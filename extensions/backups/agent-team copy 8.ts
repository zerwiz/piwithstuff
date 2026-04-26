/**
 * Agent Team — Dispatcher-only orchestrator with strict Tree dashboard
 *
 * The primary Pi agent has NO codebase tools. It can ONLY delegate work
 * to specialist agents via the `dispatch_agent` tool.
 *
 * Loads agent definitions from agents/*.md, .claude/agents/*.md, .pi/agents/*.md.
 * Teams are defined in .pi/agents/teams.yaml — on boot a select dialog lets
 * you pick which team to work with.
 *
 * Commands:
 * /agents-team          — switch active team
 * /agents-list          — list loaded agents
 *
 * Usage: pi -e extensions/agent-team.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { spawn } from "child_process";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
} from "fs";
import { join, resolve } from "path";
import { applyExtensionDefaults } from "../themeMap.js";

// ── Types ────────────────────────────────────────

interface AgentDef {
  name: string;
  description: string;
  tools: string;
  systemPrompt: string;
  file: string;
}

interface AgentState {
  def: AgentDef;
  status: "idle" | "running" | "done" | "error";
  task: string;
  toolCount: number;
  elapsed: number;
  lastWork: string;
  lastThinking: string;
  currentMode: "idle" | "thinking" | "working" | "tool";
  contextPct: number;
  sessionFile: string | null;
  runCount: number;
  activeTools: Set<string>;
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// ── Display Name Helper ──────────────────────────

function displayName(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Teams YAML Parser ────────────────────────────

function parseTeamsYaml(raw: string): Record<string, string[]> {
  const teams: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of raw.split("\n")) {
    const teamMatch = line.match(/^(\S[^:]*):$/);
    if (teamMatch) {
      current = teamMatch[1].trim();
      teams[current] = [];
      continue;
    }
    const itemMatch = line.match(/^\s+-\s+(.+)$/);
    if (itemMatch && current) {
      teams[current].push(itemMatch[1].trim());
    }
  }
  return teams;
}

function stringifyTeamsYaml(teams: Record<string, string[]>): string {
  let out = "";
  for (const [name, members] of Object.entries(teams)) {
    out += `${name}:\n`;
    for (const member of members) {
      out += `  - ${member}\n`;
    }
    out += "\n";
  }
  return out.trim();
}

// ── Frontmatter Parser ───────────────────────────

function parseAgentFile(filePath: string): AgentDef | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;

    const frontmatter: Record<string, string> = {};
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }

    if (!frontmatter.name) return null;

    return {
      name: frontmatter.name,
      description: frontmatter.description || "",
      tools: frontmatter.tools || "read,grep,find,ls",
      systemPrompt: match[2].trim(),
      file: filePath,
    };
  } catch {
    return null;
  }
}

function scanAgentDirs(cwd: string): AgentDef[] {
  const dirs = [
    join(cwd, "agents"),
    join(cwd, ".claude", "agents"),
    join(cwd, ".pi", "agents"),
  ];

  const agents: AgentDef[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    try {
      for (const file of readdirSync(dir)) {
        if (!file.endsWith(".md")) continue;
        const fullPath = resolve(dir, file);
        const def = parseAgentFile(fullPath);
        if (def && !seen.has(def.name.toLowerCase())) {
          seen.add(def.name.toLowerCase());
          agents.push(def);
        }
      }
    } catch {}
  }

  return agents;
}

// ── Extension ────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const agentStates: Map<string, AgentState> = new Map();
  let allAgentDefs: AgentDef[] = [];
  let teams: Record<string, string[]> = {};
  let activeTeamName = "";
  let widgetCtx: any;
  let sessionDir = "";
  let contextWindow = 0;

  let widgetFrame = 0;
  let globalInterval: ReturnType<typeof setInterval> | undefined;

  function loadAgents(cwd: string) {
    sessionDir = join(cwd, ".pi", "agent-sessions");
    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir, { recursive: true });
    }

    allAgentDefs = scanAgentDirs(cwd);

    const teamsPath = join(cwd, ".pi", "agents", "teams.yaml");
    if (existsSync(teamsPath)) {
      try {
        teams = parseTeamsYaml(readFileSync(teamsPath, "utf-8"));
      } catch {
        teams = {};
      }
    } else {
      teams = {};
    }

    if (Object.keys(teams).length === 0) {
      teams = { all: allAgentDefs.map((d) => d.name) };
    }
  }

  function saveTeams(cwd: string) {
    const dirPath = join(cwd, ".pi", "agents");
    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
    const teamsPath = join(dirPath, "teams.yaml");
    try {
      writeFileSync(teamsPath, stringifyTeamsYaml(teams), "utf-8");
    } catch {}
  }

  function activateTeam(teamName: string) {
    activeTeamName = teamName;
    const members = teams[teamName] || [];
    const defsByName = new Map(
      allAgentDefs.map((d) => [d.name.toLowerCase(), d]),
    );

    agentStates.clear();
    for (const member of members) {
      const def = defsByName.get(member.toLowerCase());
      if (!def) continue;
      const key = def.name.toLowerCase().replace(/\s+/g, "-");
      const sessionFile = join(sessionDir, `${key}.json`);
      agentStates.set(def.name.toLowerCase(), {
        def,
        status: "idle",
        task: "",
        toolCount: 0,
        elapsed: 0,
        lastWork: "",
        lastThinking: "",
        currentMode: "idle",
        contextPct: 0,
        sessionFile: existsSync(sessionFile) ? sessionFile : null,
        runCount: 0,
        activeTools: new Set(),
      });
    }
  }

  function ensureGlobalInterval() {
    if (globalInterval) return;
    let lastTick = Date.now();
    globalInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      widgetFrame++;

      let anyRunning = false;
      for (const state of agentStates.values()) {
        if (state.status === "running") {
          state.elapsed += delta;
          anyRunning = true;
        }
      }

      updateWidget();

      if (!anyRunning) {
        clearInterval(globalInterval);
        globalInterval = undefined;
      }
    }, 80);
  }

  // ── Tree Rendering ───────────────────────────

  function renderTreeAgent(
    state: AgentState,
    isLast: boolean,
    width: number,
    theme: any,
  ): string[] {
    const frame = SPINNER[widgetFrame % SPINNER.length];
    const safeWidth = Math.max(10, width - 2); // Guaranteed anti-wrap margin
    const maxActivityHeight = 8; // Max lines to show per agent

    let icon = theme.fg("dim", "○");
    let nameColor = "dim";
    let descColor = "dim";

    if (state.status === "running") {
      icon = theme.fg("accent", frame);
      nameColor = "accent";
      descColor = "muted";
    } else if (state.status === "done") {
      icon = theme.fg("success", "✓");
      nameColor = "dim";
      descColor = "dim";
    } else if (state.status === "error") {
      icon = theme.fg("error", "✗");
      nameColor = "error";
      descColor = "dim";
    }

    const name = theme.bold(displayName(state.def.name));
    const desc = state.task ? state.task : state.def.description;

    const parts: string[] = [];
    if (state.status !== "idle") {
      parts.push(`${Math.round(state.elapsed / 1000)}s`);
      if (state.toolCount > 0) parts.push(`${state.toolCount} tools`);
    }
    if (state.contextPct > 0) {
      const filled = Math.ceil(state.contextPct / 20);
      const bar = "#".repeat(filled) + "-".repeat(5 - filled);
      parts.push(`[${bar}] ${Math.ceil(state.contextPct)}%`);
    }

    const stats =
      parts.length > 0
        ? ` ${theme.fg("dim", "·")} ${theme.fg("dim", parts.join(" · "))}`
        : "";

    const branch = isLast ? "└─" : "├─";

    const headerLine =
      truncateToWidth(
        theme.fg("dim", branch) +
          " " +
          `${icon} ${theme.fg(nameColor, name)}  ${theme.fg(descColor, desc)}`,
        safeWidth - visibleWidth(stats),
      ) + stats;

    const outLines = [truncateToWidth(headerLine, safeWidth)];

    if (state.status === "running") {
      const activityPrefix = isLast ? "    " : "│   ";

      let rawActivity = "";
      let color = "dim";
      let prefix = "";

      // Determine content based on current mode
      if (state.activeTools.size > 0) {
        rawActivity = `using: ${Array.from(state.activeTools).join(", ")}`;
        color = "accent";
      } else if (state.currentMode === "thinking") {
        rawActivity = state.lastThinking;
        color = "dim";
        prefix = "thinking: ";
      } else if (state.currentMode === "working") {
        rawActivity = state.lastWork;
        color = "muted";
      } else {
        rawActivity = state.lastWork || state.lastThinking;
        color = "dim";
      }

      // Extract last lines up to maxActivityHeight
      let logLines = rawActivity
        .split("\n")
        .map((l) => l.trim().replace(/\r/g, ""))
        .filter(Boolean)
        .slice(-maxActivityHeight);

      // If empty, provide a fallback
      if (logLines.length === 0) {
        logLines = [
          state.currentMode === "thinking" ? "thinking..." : "working...",
        ];
      }

      // Dynamic height rendering: only iterate over available lines
      for (let j = 0; j < logLines.length; j++) {
        const isLastLog = j === logLines.length - 1;
        const logBranch = isLastLog ? "⎿ " : "│ ";
        let content = logLines[j];

        // Add mode prefix to the first non-empty line
        if (prefix && content && j === 0 && !content.startsWith(prefix)) {
          content = prefix + content;
        }

        outLines.push(
          truncateToWidth(
            theme.fg("dim", activityPrefix) +
              theme.fg("dim", logBranch) +
              theme.fg(color, content),
            safeWidth,
          ),
        );
      }
    }

    return outLines;
  }

  function updateWidget() {
    if (!widgetCtx) return;

    widgetCtx.ui.setWidget("agent-team", (_tui: any, theme: any) => {
      const text = new Text("", 0, 1);

      return {
        render(width: number): string[] {
          if (agentStates.size === 0) {
            text.setText(
              theme.fg("dim", "No agents found. Add .md files to agents/"),
            );
            return text.render(width);
          }

          const anyRunning = Array.from(agentStates.values()).some(
            (s) => s.status === "running",
          );
          const headingColor = anyRunning ? "accent" : "dim";
          const headingIcon = anyRunning ? "●" : "○";
          const safeWidth = Math.max(10, width - 2);

          const headingLine = truncateToWidth(
            theme.fg(headingColor, headingIcon) +
              " " +
              theme.fg(headingColor, `Team: ${activeTeamName}`),
            safeWidth,
          );

          const agents = Array.from(agentStates.values());
          const lines = [headingLine];

          for (let i = 0; i < agents.length; i++) {
            const isLast = i === agents.length - 1;
            lines.push(...renderTreeAgent(agents[i], isLast, width, theme));
          }

          text.setText(lines.join("\n"));
          return text.render(width);
        },
        invalidate() {
          text.invalidate();
        },
      };
    });
  }

  // ── Dispatch Agent ─────────

  function dispatchAgent(
    agentName: string,
    task: string,
    ctx: any,
    signal?: AbortSignal,
  ): Promise<{ output: string; exitCode: number; elapsed: number }> {
    const key = agentName.toLowerCase();
    const state = agentStates.get(key);
    if (!state) {
      return Promise.resolve({
        output: `Agent "${agentName}" not found. Active IDs: ${Array.from(agentStates.keys()).join(", ")}. Use manage_team to add them.`,
        exitCode: 1,
        elapsed: 0,
      });
    }

    if (state.status === "running") {
      return Promise.resolve({
        output: `Agent "${displayName(state.def.name)}" is already running. Wait for it to finish.`,
        exitCode: 1,
        elapsed: 0,
      });
    }

    state.status = "running";
    state.task = task;
    state.toolCount = 0;
    state.elapsed = 0;
    state.lastWork = "";
    state.lastThinking = "";
    state.currentMode = "thinking";
    state.activeTools.clear();
    state.runCount++;

    ensureGlobalInterval();
    updateWidget();

    const startTime = Date.now();
    const model = ctx.model
      ? `${ctx.model.provider}/${ctx.model.id}`
      : "openrouter/google/gemini-3-flash-preview";

    const agentKey = state.def.name.toLowerCase().replace(/\s+/g, "-");
    const agentSessionFile = join(sessionDir, `${agentKey}.json`);

    const args = [
      "--mode",
      "json",
      "-p",
      "--no-extensions",
      "--model",
      model,
      "--tools",
      state.def.tools,
      "--thinking",
      "low", // Enable low thinking so we get logs
      "--append-system-prompt",
      state.def.systemPrompt,
      "--session",
      agentSessionFile,
    ];

    if (state.sessionFile) {
      args.push("-c");
    }

    args.push(task);

    const textChunks: string[] = [];

    return new Promise((resolve) => {
      const proc = spawn("pi", args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      });

      const onAbort = () => {
        proc.kill("SIGINT");
      };

      if (signal) {
        if (signal.aborted) {
          onAbort();
        } else {
          signal.addEventListener("abort", onAbort);
        }
      }

      let buffer = "";

      proc.stdout!.setEncoding("utf-8");
      proc.stdout!.on("data", (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "message_update") {
              const delta = event.assistantMessageEvent;
              if (delta?.type === "text_delta") {
                textChunks.push(delta.delta || "");
                state.lastWork = textChunks.join("");
                state.currentMode = "working"; // Switch to working
                updateWidget();
              } else if (delta?.type === "thinking_delta") {
                state.lastThinking += delta.delta || "";
                state.currentMode = "thinking"; // Switch to thinking
                updateWidget();
              } else if (delta?.type === "thinking_start") {
                state.lastThinking = "";
                state.currentMode = "thinking";
                updateWidget();
              }
            } else if (event.type === "tool_execution_start") {
              state.toolCount++;
              if (event.toolCall?.name)
                state.activeTools.add(event.toolCall.name);
              state.currentMode = "tool";
              updateWidget();
            } else if (event.type === "tool_execution_end") {
              if (event.toolCall?.name)
                state.activeTools.delete(event.toolCall.name);
              state.currentMode = "working"; // Revert to working mode after tool
              updateWidget();
            } else if (event.type === "message_end") {
              const msg = event.message;
              if (msg?.usage && contextWindow > 0) {
                state.contextPct =
                  ((msg.usage.input || 0) / contextWindow) * 100;
                updateWidget();
              }
            } else if (event.type === "agent_end") {
              const msgs = event.messages || [];
              const last = [...msgs]
                .reverse()
                .find((m: any) => m.role === "assistant");
              if (last?.usage && contextWindow > 0) {
                state.contextPct =
                  ((last.usage.input || 0) / contextWindow) * 100;
                updateWidget();
              }
            }
          } catch {}
        }
      });

      proc.stderr!.setEncoding("utf-8");
      proc.stderr!.on("data", () => {});

      proc.on("close", (code) => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }

        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer);
            if (event.type === "message_update") {
              const delta = event.assistantMessageEvent;
              if (delta?.type === "text_delta") {
                textChunks.push(delta.delta || "");
                state.lastWork = textChunks.join("");
              }
            }
          } catch {}
        }

        const isAborted = signal?.aborted;
        state.elapsed = Date.now() - startTime;
        state.status = code === 0 && !isAborted ? "done" : "error";
        state.currentMode = "idle";
        state.activeTools.clear();

        if (code === 0 && !isAborted) {
          state.sessionFile = agentSessionFile;
        }

        updateWidget();

        ctx.ui.notify(
          `${displayName(state.def.name)} ${isAborted ? "aborted" : state.status} in ${Math.round(state.elapsed / 1000)}s`,
          code === 0 && !isAborted ? "success" : "error",
        );

        resolve({
          output: isAborted
            ? textChunks.join("") + "\n\n[Task canceled by user]"
            : textChunks.join(""),
          exitCode: isAborted ? 1 : (code ?? 1),
          elapsed: state.elapsed,
        });
      });

      proc.on("error", (err) => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
        state.status = "error";
        state.currentMode = "idle";
        state.activeTools.clear();
        updateWidget();
        resolve({
          output: `Error spawning agent: ${err.message}`,
          exitCode: 1,
          elapsed: Date.now() - startTime,
        });
      });
    });
  }

  // ── Tools ────────────────────────────────────

  pi.registerTool({
    name: "switch_team",
    label: "Switch Team",
    description:
      "Switch the active team of specialist agents. Completely replaces current active team.",
    parameters: Type.Object({
      teamName: Type.String({
        description: "The name of the team to switch to",
      }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const { teamName } = params as { teamName: string };
      if (!teams[teamName]) {
        return {
          content: [
            {
              type: "text",
              text: `Team "${teamName}" not found. Available teams: ${Object.keys(teams).join(", ")}`,
            },
          ],
        };
      }
      activateTeam(teamName);
      updateWidget();
      ctx.ui.setStatus("agent-team", `Team: ${teamName} (${agentStates.size})`);
      return {
        content: [
          {
            type: "text",
            text: `Switched to team "${teamName}". Members: ${teams[teamName].join(", ")}`,
          },
        ],
      };
    },
    renderCall(args, theme) {
      return new Text(
        theme.fg("toolTitle", theme.bold("switch_team ")) +
          theme.fg("accent", (args as any).teamName),
        0,
        0,
      );
    },
  });

  pi.registerTool({
    name: "manage_team",
    label: "Manage Team",
    description:
      "Add or remove specialist agents from your active team. Add required agents before dispatching.",
    parameters: Type.Object({
      action: Type.Enum({ add: "add", remove: "remove" }),
      agent: Type.String({
        description: "The name of the agent to add or remove",
      }),
    }),
    async execute(_toolCallId, params, _signal, onUpdate, ctx) {
      const { action, agent } = params as {
        action: "add" | "remove";
        agent: string;
      };
      const key = agent.toLowerCase();

      if (action === "add") {
        if (agentStates.has(key)) {
          return {
            content: [
              {
                type: "text",
                text: `Agent "${agent}" is already in the team.`,
              },
            ],
          };
        }
        const def = allAgentDefs.find((d) => d.name.toLowerCase() === key);
        if (!def) {
          return {
            content: [
              { type: "text", text: `Agent "${agent}" not found in system.` },
            ],
          };
        }

        const agentKey = def.name.toLowerCase().replace(/\s+/g, "-");
        const sessionFile = join(sessionDir, `${agentKey}.json`);
        agentStates.set(key, {
          def,
          status: "idle",
          task: "",
          toolCount: 0,
          elapsed: 0,
          lastWork: "",
          lastThinking: "",
          currentMode: "idle",
          contextPct: 0,
          sessionFile: existsSync(sessionFile) ? sessionFile : null,
          runCount: 0,
          activeTools: new Set(),
        });

        if (!teams[activeTeamName]) teams[activeTeamName] = [];
        if (!teams[activeTeamName].includes(def.name))
          teams[activeTeamName].push(def.name);
        saveTeams(ctx.cwd);
        updateWidget();

        return {
          content: [
            {
              type: "text",
              text: `Added specialist "${displayName(def.name)}" to the team.`,
            },
          ],
        };
      } else {
        if (!agentStates.has(key))
          return {
            content: [
              { type: "text", text: `Agent "${agent}" is not in the team.` },
            ],
          };

        const state = agentStates.get(key)!;
        if (state.status === "running")
          return {
            content: [
              { type: "text", text: `Cannot remove agent while running.` },
            ],
          };

        agentStates.delete(key);
        if (teams[activeTeamName]) {
          teams[activeTeamName] = teams[activeTeamName].filter(
            (m) => m.toLowerCase() !== key,
          );
        }
        saveTeams(ctx.cwd);
        updateWidget();

        return {
          content: [
            {
              type: "text",
              text: `Removed agent "${displayName(state.def.name)}" from the team.`,
            },
          ],
        };
      }
    },
    renderCall(args, theme) {
      const { action, agent } = args as any;
      return new Text(
        theme.fg("toolTitle", theme.bold("manage_team ")) +
          theme.fg("accent", `${action} ${agent}`),
        0,
        0,
      );
    },
  });

  pi.registerTool({
    name: "dispatch_agent",
    label: "Dispatch Agent",
    description:
      "Dispatch a task to a specialist agent. The agent will execute the task and return the result.",
    parameters: Type.Object({
      agent: Type.String({ description: "Agent name (case-insensitive)" }),
      task: Type.String({
        description: "Task description for the agent to execute",
      }),
    }),
    async execute(_toolCallId, params, _signal, onUpdate, ctx) {
      const { agent, task } = params as { agent: string; task: string };
      try {
        if (onUpdate) {
          onUpdate({
            content: [{ type: "text", text: `Dispatching to ${agent}...` }],
            details: { agent, task, status: "dispatching" },
          });
        }
        const result = await dispatchAgent(agent, task, ctx, _signal);
        const truncated =
          result.output.length > 8000
            ? result.output.slice(0, 8000) + "\n\n... [truncated]"
            : result.output;
        const status = result.exitCode === 0 ? "done" : "error";
        const summary = `[${agent}] ${status} in ${Math.round(result.elapsed / 1000)}s`;

        return {
          content: [{ type: "text", text: `${summary}\n\n${truncated}` }],
          details: {
            agent,
            task,
            status,
            elapsed: result.elapsed,
            exitCode: result.exitCode,
            fullOutput: result.output,
          },
        };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error dispatching to ${agent}: ${err?.message || err}`,
            },
          ],
          details: {
            agent,
            task,
            status: "error",
            elapsed: 0,
            exitCode: 1,
            fullOutput: "",
          },
        };
      }
    },
    renderCall(args, theme) {
      const agentName = (args as any).agent || "?";
      const task = (args as any).task || "";
      const preview = task.length > 60 ? task.slice(0, 57) + "..." : task;
      return new Text(
        theme.fg("toolTitle", theme.bold("dispatch_agent ")) +
          theme.fg("accent", agentName) +
          theme.fg("dim", " — ") +
          theme.fg("muted", preview),
        0,
        0,
      );
    },
    renderResult(result, options, theme) {
      const details = result.details as any;
      if (!details) {
        const text = result.content[0];
        return new Text(text?.type === "text" ? text.text : "", 0, 0);
      }

      if (options.isPartial || details.status === "dispatching") {
        return new Text(
          theme.fg("accent", `● ${details.agent || "?"}`) +
            theme.fg("dim", " working..."),
          0,
          0,
        );
      }

      const icon = details.status === "done" ? "✓" : "✗";
      const color = details.status === "done" ? "success" : "error";
      const elapsed =
        typeof details.elapsed === "number"
          ? Math.round(details.elapsed / 1000)
          : 0;
      const header =
        theme.fg(color, `${icon} ${details.agent}`) +
        theme.fg("dim", ` ${elapsed}s`);

      if (options.expanded && details.fullOutput) {
        const output =
          details.fullOutput.length > 4000
            ? details.fullOutput.slice(0, 4000) + "\n... [truncated]"
            : details.fullOutput;
        return new Text(header + "\n" + theme.fg("muted", output), 0, 0);
      }

      return new Text(header, 0, 0);
    },
  });

  // ── Commands ─────────────────────────────────

  pi.registerCommand("agents-team", {
    description: "Select a team to work with",
    handler: async (_args, ctx) => {
      widgetCtx = ctx;
      const teamNames = Object.keys(teams);
      if (teamNames.length === 0) {
        ctx.ui.notify("No teams defined in .pi/agents/teams.yaml", "warning");
        return;
      }

      const options = teamNames.map((name) => {
        const members = teams[name].map((m) => displayName(m));
        return `${name} — ${members.join(", ")}`;
      });

      const choice = await ctx.ui.select("Select Team", options);
      if (choice === undefined) return;

      const idx = options.indexOf(choice);
      const name = teamNames[idx];
      activateTeam(name);
      updateWidget();
      ctx.ui.setStatus("agent-team", `Team: ${name} (${agentStates.size})`);
      ctx.ui.notify(
        `Team: ${name} — ${Array.from(agentStates.values())
          .map((s) => displayName(s.def.name))
          .join(", ")}`,
        "info",
      );
    },
  });

  pi.registerCommand("agents-list", {
    description: "List all loaded agents",
    handler: async (_args, _ctx) => {
      widgetCtx = _ctx;
      const names = Array.from(agentStates.values())
        .map((s) => {
          const session = s.sessionFile ? "resumed" : "new";
          return `${displayName(s.def.name)} (${s.status}, ${session}, runs: ${s.runCount}): ${s.def.description}`;
        })
        .join("\n");
      _ctx.ui.notify(names || "No agents loaded", "info");
    },
  });

  // ── System Prompt Override ───────────────────

  pi.on("before_agent_start", async (_event, _ctx) => {
    const agentCatalog = Array.from(agentStates.values())
      .map(
        (s) =>
          `### ${displayName(s.def.name)} (ID: \`${s.def.name}\`)\n**Dispatch as:** \`${s.def.name}\`\n${s.def.description}\n**Tools:** ${s.def.tools}`,
      )
      .join("\n\n");

    const teamMembers = Array.from(agentStates.values())
      .map((s) => `\`${s.def.name}\``)
      .join(", ");
    const teamKeys = new Set(Array.from(agentStates.keys()));

    const availableSpecialists = allAgentDefs
      .filter((d) => !teamKeys.has(d.name.toLowerCase()))
      .map(
        (d) =>
          `- **${displayName(d.name)}** (ID: \`${d.name.toLowerCase()}\`): ${d.description}`,
      )
      .join("\n");

    return {
      systemPrompt: `You are a dispatcher agent. You coordinate specialist agents to accomplish tasks.
You do NOT have direct access to the codebase. You MUST delegate all work through
agents using the dispatch_agent tool.

## Active Team: ${activeTeamName}
Members: ${teamMembers}
You can ONLY dispatch to agents listed below. Do not attempt to dispatch to agents outside this team.

## How to Work
- Analyze the user's request and break it into clear sub-tasks
- Choose the right agent(s) for each sub-task
- Dispatch tasks using the dispatch_agent tool
- Review results and dispatch follow-up agents if needed
- If a task fails, try a different agent or adjust the task description
- Summarize the outcome for the user

## Rules
- NEVER try to read, write, or execute code directly — you have no such tools
- ALWAYS use dispatch_agent to get work done
- You can chain agents: use scout to explore, then builder to implement
- You can dispatch the same agent multiple times with different tasks
- Keep tasks focused — one clear objective per dispatch

## Agents

### ACTIVE TEAM: ${activeTeamName}
Active IDs: ${teamMembers}
(You can only dispatch to these IDs right now)

## Available Specialists (Inactive - Add with \`manage_team\`)
${availableSpecialists || "None available."}

This is the Teams and Agents

main:
  - scout
  - planner
  - developer
  - reviewer
  - documenter
  - red-team
  - session-manager

plan-build:
  - planner
  - developer
  - reviewer
  - session-manager

info:
  - scout
  - documenter
  - reviewer
  - session-manager

frontend:
  - planner
  - frontendcoder
  - scout
  - reviewer
  - bowser
  - session-manager

pi-pi:
  - ext-expert
  - theme-expert
  - skill-expert
  - config-expert
  - tui-expert
  - prompt-expert
  - agent-expert
  - session-expert

Extra:
  - developer
  - reviewer
  - scout
  - dispatcher`,
    };
  });

  // ── Session Start ────────────────────────────

  pi.on("session_start", async (_event, _ctx) => {
    applyExtensionDefaults(import.meta.url, _ctx);
    if (widgetCtx) {
      widgetCtx.ui.setWidget("agent-team", undefined);
    }
    widgetCtx = _ctx;
    contextWindow = _ctx.model?.contextWindow || 0;

    const sessDir = join(_ctx.cwd, ".pi", "agent-sessions");
    if (existsSync(sessDir)) {
      for (const f of readdirSync(sessDir)) {
        if (f.endsWith(".json")) {
          try {
            unlinkSync(join(sessDir, f));
          } catch {}
        }
      }
    }

    loadAgents(_ctx.cwd);

    const teamNames = Object.keys(teams);
    if (teamNames.length > 0) {
      activateTeam(activeTeamName || teamNames[0]);
    }

    // Lock down to dispatcher-only
    pi.setActiveTools(["dispatch_agent", "manage_team", "switch_team"]);

    _ctx.ui.setStatus(
      "agent-team",
      `Team: ${activeTeamName} (${agentStates.size})`,
    );
    const members = Array.from(agentStates.values())
      .map((s) => displayName(s.def.name))
      .join(", ");
    _ctx.ui.notify(
      `Team: ${activeTeamName} (${members})\n` +
        `/agents-team          Select a team\n` +
        `/agents-list          List active agents and status`,
      "info",
    );
    updateWidget();

    // Footer: model | team | context bar
    _ctx.ui.setFooter((_tui, theme, _footerData) => ({
      dispose: () => {},
      invalidate() {},
      render(width: number): string[] {
        const model = _ctx.model?.id || "no-model";
        const usage = _ctx.getContextUsage();
        const pct = usage ? usage.percent : 0;
        const filled = Math.round(pct / 10);
        const bar = "#".repeat(filled) + "-".repeat(10 - filled);

        const left =
          theme.fg("dim", ` ${model}`) +
          theme.fg("muted", " · ") +
          theme.fg("accent", activeTeamName);
        const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}% `);
        const pad = " ".repeat(
          Math.max(1, width - visibleWidth(left) - visibleWidth(right)),
        );

        return [truncateToWidth(left + pad + right, width)];
      },
    }));
  });
}

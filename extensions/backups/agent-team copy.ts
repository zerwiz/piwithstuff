/**
 * Agent Team — Dispatcher-only orchestrator with tree dashboard
 *
 * The primary Pi agent has NO codebase tools. It can ONLY delegate work
 * to specialist agents via the `dispatch_agent` tool. Each specialist
 * maintains its own Pi session for cross-invocation memory.
 *
 * Loads agent definitions from agents/*.md, .claude/agents/*.md, .pi/agents/*.md.
 * Teams are defined in .pi/agents/teams.yaml.
 *
 * Commands:
 * /agents-team          — switch active team
 * /agents-list          — list loaded agents
 *
 * Usage: pi -e extensions/agent-team.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import {
  Text,
  type AutocompleteItem,
  truncateToWidth,
  visibleWidth,
} from "@mariozechner/pi-tui";
import { spawn } from "child_process";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  unlinkSync,
  lstatSync,
} from "fs";
import { join, resolve } from "path";
import { homedir } from "os";
import { applyExtensionDefaults } from "../themeMap.js";

// ── Types ────────────────────────────────────────

type MemoryScope = "user" | "project" | "local";

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
  contextPct: number;
  sessionFile: string | null;
  runCount: number;
  activeTools: Set<string>;
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// ── Memory Helpers ───────────────────────────────

const MAX_MEMORY_LINES = 200;

export function isUnsafeName(name: string): boolean {
  if (!name || name.length > 128) return true;
  return !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
}

export function isSymlink(filePath: string): boolean {
  try {
    return lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

export function safeReadFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  if (isSymlink(filePath)) return undefined;
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

export function resolveMemoryDir(
  agentName: string,
  scope: MemoryScope,
  cwd: string,
): string {
  if (isUnsafeName(agentName)) {
    throw new Error(`Unsafe agent name for memory directory: "${agentName}"`);
  }
  const key = agentName.toLowerCase().replace(/\s+/g, "-");
  switch (scope) {
    case "user":
      return join(homedir(), ".pi", "agent-memory", key);
    case "project":
      return join(cwd, ".pi", "agent-memory", key);
    case "local":
      return join(cwd, ".pi", "agent-memory-local", key);
  }
}

export function ensureMemoryDir(memoryDir: string): void {
  if (existsSync(memoryDir)) {
    if (isSymlink(memoryDir)) {
      throw new Error(
        `Refusing to use symlinked memory directory: ${memoryDir}`,
      );
    }
    return;
  }
  mkdirSync(memoryDir, { recursive: true });
}

export function readMemoryIndex(memoryDir: string): string | undefined {
  if (isSymlink(memoryDir)) return undefined;
  const memoryFile = join(memoryDir, "MEMORY.md");
  const content = safeReadFile(memoryFile);
  if (content === undefined) return undefined;

  const lines = content.split("\n");
  if (lines.length > MAX_MEMORY_LINES) {
    return (
      lines.slice(0, MAX_MEMORY_LINES).join("\n") +
      "\n... (truncated at 200 lines)"
    );
  }
  return content;
}

export function buildMemoryBlock(
  agentName: string,
  scope: MemoryScope,
  cwd: string,
): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  ensureMemoryDir(memoryDir);
  const existingMemory = readMemoryIndex(memoryDir);

  const header = `# Agent Memory\n\nYou have a persistent memory directory at: ${memoryDir}/\nMemory scope: ${scope}\n\nThis memory persists across sessions. Use it to build up knowledge over time.`;
  const memoryContent = existingMemory
    ? `\n\n## Current MEMORY.md\n${existingMemory}`
    : `\n\nNo MEMORY.md exists yet. Create one at ${join(memoryDir, "MEMORY.md")} to start building persistent memory.`;

  const instructions = `\n\n## Memory Instructions\n- MEMORY.md is an index file — keep it concise (under 200 lines).\n- Store detailed memories in separate files within ${memoryDir}/ and link to them from MEMORY.md.\n- Update or remove memories that become outdated.\n- You have Read, Write, and Edit tools available for managing memory files.`;

  return header + memoryContent + instructions;
}

export function buildReadOnlyMemoryBlock(
  agentName: string,
  scope: MemoryScope,
  cwd: string,
): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  const existingMemory = readMemoryIndex(memoryDir);

  const header = `# Agent Memory (read-only)\n\nMemory scope: ${scope}\nYou have read-only access to memory. You can reference existing memories but cannot modify them.`;
  const memoryContent = existingMemory
    ? `\n\n## Current MEMORY.md\n${existingMemory}`
    : `\n\nNo memory is available yet.`;

  return header + memoryContent;
}

// ── Helpers ──────────────────────────────────────

function displayName(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Wrap text into lines of max width */
function wrapLine(text: string, width: number): string[] {
  const lines: string[] = [];
  let current = text;
  while (current.length > 0) {
    lines.push(current.slice(0, width));
    current = current.slice(width);
  }
  return lines;
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

    const teamsPaths = [
      join(cwd, ".pi", "teams.yaml"),
      join(cwd, ".pi", "agents", "teams.yaml"),
    ];

    teams = {};
    for (const teamsPath of teamsPaths) {
      if (existsSync(teamsPath)) {
        try {
          const loadedTeams = parseTeamsYaml(readFileSync(teamsPath, "utf-8"));
          for (const [teamName, members] of Object.entries(loadedTeams)) {
            if (!teams[teamName]) {
              teams[teamName] = [];
            }
            // Merge members, avoid duplicates
            for (const member of members) {
              if (!teams[teamName].includes(member)) {
                teams[teamName].push(member);
              }
            }
          }
        } catch {}
      }
    }

    if (Object.keys(teams).length === 0) {
      teams = { all: allAgentDefs.map((d) => d.name) };
    }
  }

  function saveTeams(cwd: string) {
    // Save to the project-local teams.yaml
    const teamsPath = join(cwd, ".pi", "agents", "teams.yaml");
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

      for (const state of agentStates.values()) {
        if (state.status === "running") {
          state.elapsed += delta;
        }
      }

      updateWidget();
    }, 80);
  }

  function stopGlobalIntervalIfNoRunning() {
    const anyRunning = Array.from(agentStates.values()).some(
      (s) => s.status === "running",
    );
    if (!anyRunning && globalInterval) {
      clearInterval(globalInterval);
      globalInterval = undefined;
    }
  }

  // ── Rendering ────────────────────────────────

  function renderAgentLine(state: AgentState, theme: any): string {
    const frame = SPINNER[widgetFrame % SPINNER.length];
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
      if (state.toolCount > 0)
        parts.push(
          `${state.toolCount} tool${state.toolCount === 1 ? "" : "s"}`,
        );
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
    return `${icon} ${theme.fg(nameColor, name)}  ${theme.fg(descColor, truncateToWidth(desc, 50))}${stats}`;
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

          const lines: string[] = [
            truncateToWidth(
              theme.fg(headingColor, headingIcon) +
                " " +
                theme.fg(headingColor, `Team: ${activeTeamName}`),
              width,
            ),
          ];

          const agents = Array.from(agentStates.values());
          for (let i = 0; i < agents.length; i++) {
            const state = agents[i];
            const isLast = i === agents.length - 1;
            const branch = isLast ? "└─" : "├─";

            lines.push(
              truncateToWidth(
                theme.fg("dim", branch) + " " + renderAgentLine(state, theme),
                width,
              ),
            );

            if (state.status === "running") {
              const activityBranch = isLast ? "   " : "│  ";

              if (state.activeTools.size > 0) {
                const toolNames = Array.from(state.activeTools).join(", ");
                lines.push(
                  truncateToWidth(
                    theme.fg("dim", activityBranch) +
                      theme.fg("accent", `  ⎿  using: ${toolNames}...`),
                    width,
                  ),
                );
              } else {
                const workText = (state.lastWork || "").trim();
                const thinkText = (state.lastThinking || "").trim();
                const subLines: string[] = [];

                // 1. Thinking Area (up to 8 rows)
                if (thinkText) {
                  const lastThinkChunk =
                    thinkText
                      .split("\n")
                      .filter((l) => l.trim())
                      .pop() || "";
                  const wrappedThink = wrapLine(
                    `thinking: ${lastThinkChunk}`,
                    width - 20,
                  ).slice(0, 8);
                  for (let j = 0; j < wrappedThink.length; j++) {
                    const isLastThink =
                      j === wrappedThink.length - 1 && !workText;
                    const thinkBranch = isLastThink ? "⎿ " : "  ";
                    subLines.push(
                      theme.fg("dim", `  ${thinkBranch} `) +
                        theme.fg("dim", theme.italic(wrappedThink[j])),
                    );
                  }
                }

                // 2. Actual Work Section (Clearly separated)
                if (workText) {
                  const lastWorkChunk =
                    workText
                      .split("\n")
                      .filter((l) => l.trim())
                      .pop() || "";
                  const wrappedWork = wrapLine(lastWorkChunk, width - 20).slice(
                    0,
                    3,
                  );
                  for (let j = 0; j < wrappedWork.length; j++) {
                    const isLastWork = j === wrappedWork.length - 1;
                    const workBranch = isLastWork ? "⎿ " : "  ";
                    subLines.push(
                      theme.fg("dim", `  ${workBranch} `) +
                        theme.fg("muted", wrappedWork[j]),
                    );
                  }
                }

                if (subLines.length === 0) {
                  lines.push(
                    truncateToWidth(
                      theme.fg("dim", activityBranch) +
                        theme.fg("dim", "  ⎿  thinking..."),
                      width,
                    ),
                  );
                } else {
                  for (const sl of subLines) {
                    lines.push(
                      truncateToWidth(
                        theme.fg("dim", activityBranch) + sl,
                        width,
                      ),
                    );
                  }
                }
              }
            }
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

  // ── Dispatch Agent ───────────────────────────

  function dispatchAgent(
    agentName: string,
    task: string,
    ctx: any,
  ): Promise<{ output: string; exitCode: number; elapsed: number }> {
    const key = agentName.toLowerCase();
    const state = agentStates.get(key);
    if (!state) {
      const activeIds = Array.from(agentStates.keys())
        .map((k) => `\`${k}\``)
        .join(", ");
      return Promise.resolve({
        output: `Agent "${agentName}" not found in your active team. Active IDs: ${activeIds || "none"}. If you need a different specialist, use \`manage_team\` first.`,
        exitCode: 1,
        elapsed: 0,
      });
    }

    if (state.status === "running") {
      return Promise.resolve({
        output: `Agent "${displayName(state.def.name)}" is already running.`,
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

    const hasWriteTools =
      state.def.tools.includes("write") || state.def.tools.includes("edit");
    const memoryBlock = hasWriteTools
      ? buildMemoryBlock(state.def.name, "project", ctx.cwd)
      : buildReadOnlyMemoryBlock(state.def.name, "project", ctx.cwd);

    const combinedPrompt = state.def.systemPrompt + "\n\n" + memoryBlock;

    const args = [
      "--mode",
      "json",
      "-p",
      "-e",
      "extensions/damage-control.ts",
      "--model",
      model,
      "--tools",
      state.def.tools,
      "--thinking",
      "low",
      "--append-system-prompt",
      combinedPrompt,
      "--session",
      agentSessionFile,
    ];

    if (state.sessionFile) args.push("-c");
    args.push(task);

    const textChunks: string[] = [];

    return new Promise((resolve) => {
      const proc = spawn("pi", args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      });

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
                updateWidget();
              } else if (delta?.type === "thinking_delta") {
                state.lastThinking += delta.delta || "";
                updateWidget();
              } else if (delta?.type === "thinking_start") {
                state.lastThinking = "";
                updateWidget();
              }
            } else if (event.type === "tool_execution_start") {
              state.toolCount++;
              if (event.toolCall?.name)
                state.activeTools.add(event.toolCall.name);
              updateWidget();
            } else if (event.type === "tool_execution_end") {
              if (event.toolCall?.name)
                state.activeTools.delete(event.toolCall.name);
              updateWidget();
            } else if (event.type === "message_end") {
              if (event.message?.usage && contextWindow > 0) {
                state.contextPct =
                  ((event.message.usage.input || 0) / contextWindow) * 100;
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
        if (buffer.trim()) {
          try {
            const event = JSON.parse(buffer);
            if (event.type === "message_update") {
              const delta = event.assistantMessageEvent;
              if (delta?.type === "text_delta") {
                textChunks.push(delta.delta || "");
              }
            }
          } catch {}
        }

        state.elapsed = Date.now() - startTime;
        state.status = code === 0 ? "done" : "error";
        if (code === 0) state.sessionFile = agentSessionFile;
        state.activeTools.clear();
        stopGlobalIntervalIfNoRunning();
        updateWidget();

        ctx.ui.notify(
          `${displayName(state.def.name)} ${state.status} in ${Math.round(state.elapsed / 1000)}s`,
          state.status === "done" ? "success" : "error",
        );

        resolve({
          output: textChunks.join(""),
          exitCode: code ?? 1,
          elapsed: state.elapsed,
        });
      });

      proc.on("error", (err) => {
        state.status = "error";
        state.activeTools.clear();
        stopGlobalIntervalIfNoRunning();
        updateWidget();
        resolve({
          output: err.message,
          exitCode: 1,
          elapsed: Date.now() - startTime,
        });
      });
    });
  }

  // ── Tools & Commands ─────────────────────────

  pi.registerTool({
    name: "switch_team",
    label: "Switch Team",
    description:
      "Switch the active team of specialist agents. This completely replaces your current active team with a new set of specialists.",
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
      "Add or remove specialist agents from your active team. Use this to bring in experts needed for specific tasks or remove those no longer needed.",
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
              {
                type: "text",
                text: `Agent "${agent}" not found in available specialists.`,
              },
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
          contextPct: 0,
          sessionFile: existsSync(sessionFile) ? sessionFile : null,
          runCount: 0,
          activeTools: new Set(),
        });

        // Sync with YAML
        if (!teams[activeTeamName]) teams[activeTeamName] = [];
        if (!teams[activeTeamName].includes(def.name)) {
          teams[activeTeamName].push(def.name);
        }
        saveTeams(ctx.cwd);

        updateWidget();
        return {
          content: [
            {
              type: "text",
              text: `Added specialist "${displayName(def.name)}" to the team and updated config.`,
            },
          ],
        };
      } else {
        if (!agentStates.has(key)) {
          return {
            content: [
              { type: "text", text: `Agent "${agent}" is not in the team.` },
            ],
          };
        }
        const state = agentStates.get(key)!;
        if (state.status === "running") {
          return {
            content: [
              {
                type: "text",
                text: `Cannot remove agent "${agent}" while it is running.`,
              },
            ],
          };
        }
        agentStates.delete(key);

        // Sync with YAML
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
              text: `Removed agent "${displayName(state.def.name)}" from the team and updated config.`,
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
      "Dispatch a task to a specialist agent. The agent will execute the task and return the result. Use the system prompt to see available agent names.",
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

        const result = await dispatchAgent(agent, task, ctx);

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

      // Streaming/partial result while agent is still running
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
    handler: async (_args, ctx) => {
      const list = Array.from(agentStates.values())
        .map(
          (s) =>
            `${displayName(s.def.name)} (${s.status}, runs: ${s.runCount}): ${s.def.description}`,
        )
        .join("\n");
      ctx.ui.notify(list || "No agents loaded", "info");
    },
  });

  pi.registerCommand("agents-reload", {
    description: "Reload team configuration from YAML files",
    handler: async (_args, ctx) => {
      loadAgents(ctx.cwd);
      activateTeam(activeTeamName || Object.keys(teams)[0] || "all");
      updateWidget();
      ctx.ui.notify(
        `Teams reloaded. Active team: ${activeTeamName}`,
        "success",
      );
    },
  });

  pi.registerCommand("agents-status", {
    description: "Show current team status and available specialists",
    handler: async (_args, ctx) => {
      const active = Array.from(agentStates.values())
        .map((s) => `- **${displayName(s.def.name)}** (${s.status})`)
        .join("\n");
      const teamKeys = new Set(Array.from(agentStates.keys()));
      const others = allAgentDefs
        .filter((d) => !teamKeys.has(d.name.toLowerCase()))
        .map((d) => `- ${displayName(d.name)} (inactive)`)
        .join("\n");

      const output = `### Active Team: ${activeTeamName}\n${active}\n\n### Other Available Specialists\n${others || "None"}`;
      ctx.ui.notify(output, "info");
    },
  });

  /**
   * Get all agents in the system for subagent visibility
   * Returns formatted agent definitions that subagents can use
   * to see all available agents across the system
   */
  function getAllAgents(): string {
    if (allAgentDefs.length === 0) {
      return "No agents available.";
    }

    const agents = allAgentDefs
      .map((d) => {
        const name = displayName(d.name);
        const id = `\`${d.name}\``;
        return `### ${name}\n- **ID:** ${id}\n- **Description:** ${d.description}\n- **Tools:** ${d.tools || "read,grep,find,ls"}`;
      })
      .join("\n\n");

    return `## All Agents in System\n\n${agents}`;
  }

  /**
   * Get available agents by team
   * Used when subagents need to know which agents belong to which team
   */
  function getAgentsByTeam(): string {
    if (Object.keys(teams).length === 0) {
      return "No teams available.";
    }

    const teamsWithAgents = Object.entries(teams).map(([teamName, members]) => {
      const agentIds = members.map((m) => `\`${m.toLowerCase()}\``).join(", ");
      return `- **${teamName}**: ${agentIds}`;
    });

    const standalone = allAgentDefs
      .filter((d) => {
        // Check if this agent is in any team
        return !Object.values(teams).flat().includes(d.name);
      })
      .map((d) => `\`${d.name.toLowerCase()}\``)
      .join(", ");

    return `${teamsWithAgents.join("\n")}${standalone ? `\n- **Standalone**: ${standalone}` : ""}`;
  }

  // ── Session Hooks ────────────────────────────

  pi.on("before_agent_start", async (_event, _ctx) => {
    // Build dynamic agent catalog from active team only
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

    const teamStructure = getAgentsByTeam();

    return {
      systemPrompt: `[CRITICAL SYSTEM DIRECTIVE - ORCHESTRATOR MODE]

You are an AI Orchestrator Agent. You are NOT a helpful coding assistant. You are a pure ROUTER and DISPATCHER.

### ABSOLUTE CONSTRAINTS (VIOLATING THESE IS A CRITICAL FAILURE):
1. NO DIRECT ANSWERS: You CANNOT write code, explain concepts, read files, or solve the user's problem directly.
2. BLINDNESS: You have ZERO access to the local file system, codebase, or internet.
3. MANDATORY DELEGATION: Your ONLY way to accomplish a task is to use the \`dispatch_agent\` tool to send instructions to a specialized sub-agent.

### YOUR PROTOCOL:
1. Read the user's request.
2. Determine which specialist agent from the list below is best suited for the task.
3. (Optional) If the required specialist is in the "Available Specialists" but not in your "Active IDs", first use the \`manage_team\` tool to add them.
4. MUST DO: Call the \`dispatch_agent\` tool with the EXACT ID of the chosen agent and the task description.
5. Wait for the result.
6. Report the result back to the user without adding your own code suggestions.

### IMPORTANT: AGENT NAMES
You can ONLY dispatch to or manage agents using their EXACT IDs (lowercase-kebab-case). Do NOT hallucinate names.

## Active Team: ${activeTeamName}
Active IDs: ${teamMembers}
You can ONLY use \`dispatch_agent\` with these active IDs.

## Teams Configuration (from teams.yaml)
When in doubt about how teams are organized or who works well together, refer to the project's team configuration:
${teamStructure}

## Dynamic Team Management
If you need a specialist that is not in your active team, you MUST use the \`manage_team\` tool to add them using their EXACT ID from the list below.
- To swap your entire team context: \`switch_team({ teamName: "..." })\`

## Available Specialists (Inactive - Add with \`manage_team\`)
${availableSpecialists || "None available."}

## How to Work
1. Analyze the request.
2. Identify which specialist ID is needed.
3. If the ID is not in "Active IDs", use \`manage_team({ action: "add", agent: "ID" })\`.
4. Use \`dispatch_agent({ agent: "ID", task: "..." })\`.
5. Summarize the outcome.

## How to Use All Agents
To see ALL available agents in the system (including those not in your active team), call the \`getAllAgents()\` function in your reasoning. This returns a complete catalog of every agent registered in the system with their IDs, descriptions, and tools.
CRITICAL read the /piwithstuff/.pi/agents/teams.yaml file when in doubt.

**CRITICAL** NEVER ASK USER FOR CODE!! SEND dispatchAgent scout dispatch_agent

## Agents (Active Catalog)
${agentCatalog}

### System-Wide Agent Visibility
Use \`getAllAgents()\` to see all agents in the system (active and inactive) for broader task delegation needs.

${getAllAgents()}
`,
    };
  });

  pi.on("session_start", async (_ev, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);

    if (widgetCtx) {
      widgetCtx.ui.setWidget("agent-team", undefined);
    }

    widgetCtx = ctx;
    contextWindow = ctx.model?.contextWindow || 0;

    // Wipe old agent session files so subagents start fresh
    const sessDir = join(ctx.cwd, ".pi", "agent-sessions");
    if (existsSync(sessDir)) {
      for (const f of readdirSync(sessDir)) {
        if (f.endsWith(".json")) {
          try {
            unlinkSync(join(sessDir, f));
          } catch {}
        }
      }
    }

    loadAgents(ctx.cwd);

    // Ensure we always have an active team
    const teamNames = Object.keys(teams);
    if (teamNames.length > 0) {
      activateTeam(activeTeamName || teamNames[0]);
    } else {
      // Fallback to 'all' if no teams defined
      teams = { all: allAgentDefs.map((d) => d.name) };
      activateTeam("all");
    }

    pi.setActiveTools(["dispatch_agent", "manage_team", "switch_team"]);

    ctx.ui.setStatus(
      "agent-team",
      `Team: ${activeTeamName} (${agentStates.size})`,
    );

    const members = Array.from(agentStates.values())
      .map((s) => displayName(s.def.name))
      .join(", ");
    ctx.ui.notify(
      `Team: ${activeTeamName} (${members})\n` +
        `Team sets loaded from: .pi/agents/teams.yaml\n\n` +
        `/agents-team          Select a team\n` +
        `/agents-list          List active agents and status\n` +
        `/agents-reload        Reload team configuration\n` +
        `/agents-status        Show active/inactive specialists`,
      "info",
    );

    updateWidget();

    // Footer: model | team | context bar
    ctx.ui.setFooter((_tui, theme, _footerData) => ({
      dispose: () => {},
      invalidate() {},
      render(width: number): string[] {
        const model = ctx.model?.id || "no-model";
        const usage = ctx.getContextUsage();
        const pct = usage ? usage.percent : 0;
        const filled = Math.round(pct / 10);
        const bar = "#".repeat(filled) + "-".repeat(10 - filled);

        const left =
          theme.fg("dim", ` ${model}`) +
          theme.fg("muted", " · ") +
          theme.fg("accent", activeTeamName || "none");
        const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}% `);
        const pad = " ".repeat(
          Math.max(1, width - visibleWidth(left) - visibleWidth(right)),
        );

        return [truncateToWidth(left + pad + right, width)];
      },
    }));
  });
}

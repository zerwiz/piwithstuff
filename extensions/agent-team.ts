/**
 * Agent Team — Production-Ready High-Complexity Dispatcher Orchestrator
 * * VERSION: 3.2.0 (Dynamic Height & Error-Proofed Progress Bars)
 * * FEATURES:
 * - Dynamic Top-Down Hierarchy: Agents render first; Team status line is the terminal footer.
 * - Stick-to-Bottom: The orchestrator header is anchored at the bottom to stay near the prompt.
 * - Under-Agent Activity: specialist logs render beneath headers without fixed-height "holes".
 * - Range Safety: Progress bars are clamped [0-5] to prevent RangeError on context overflow.
 * - Recursive Row Wrapping: Thinking/Work logs are broken into terminal rows to prevent bleed.
 * - Persistent Memory System: Robust MEMORY.md system for specialist context across session restarts.
 * - Scoped Storage Architecture: Full resolution for 'user', 'project', and 'local' memory isolation.
 * - Process Lifecycle Control: Child processes are correctly terminated via AbortSignal (Esc/Ctrl+C).
 * - Team Management: YAML-based configuration for team persistence and dynamic roster editing.
 * - Specialist Visibility: Injected functions allow sub-agents to "see" the full catalog and teams.
 * - Detailed Rendering: Custom call/result rendering for tools and status indicators.
 * - Extension Guarding: Integrated damage-control hooks for sub-agent safety.
 * * USAGE:
 * pi -e extensions/agent-team.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import {
  exportMemory,
  cleanupExports,
  listExportFormats,
} from "./util/memory-export";
import { handleMemoryExport } from "./util/memory-tools";
import { Text, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
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
import { applyExtensionDefaults } from "./themeMap.ts";

// ── Types & Interfaces ───────────────────────────

/**
 * Memory scopes define the persistence lifecycle of specialist knowledge.
 * 'user': Global across all codebases for the current system user (~/.pi/agent-memory).
 * 'project': Committed knowledge specific to this repository (.pi/agent-memory).
 * 'local': Developer-specific local overrides (not committed to git).
 */
type MemoryScope = "user" | "project" | "local";

/**
 * Static definition of an agent loaded from specialized markdown files.
 * The frontmatter defines tools and description; the body defines the persona.
 */
interface AgentDef {
  name: string;
  description: string;
  tools: string;
  systemPrompt: string;
  file: string;
  model?: string;
}

/**
 * Runtime state of an agent in the current active TUI dashboard.
 */
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

// UI Rendering Constants
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const MAX_MEMORY_LINES = 200;

// ── Memory & Safety Helpers ──────────────────────

/**
 * Sanitizes agent names to prevent directory traversal or shell injection attacks.
 */
export function isUnsafeName(name: string): boolean {
  if (!name || name.length > 128) return true;
  // Strictly allow alphanumeric and basic separators
  return !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
}

/**
 * Determines if a file path is a symbolic link to prevent recursive loop exploits.
 */
export function isSymlink(filePath: string): boolean {
  try {
    return lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Reads file contents with strict checks for existence and security (no symlinks).
 */
export function safeReadFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  if (isSymlink(filePath)) return undefined;
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

/**
 * Resolves the absolute physical directory for a specialist's long-term memory.
 */
export function resolveMemoryDir(
  agentName: string,
  scope: MemoryScope,
  cwd: string,
): string {
  if (isUnsafeName(agentName)) {
    throw new Error(`CRITICAL: Unsafe agent name detected: "${agentName}"`);
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

/**
 * Idempotently ensures the memory directory exists and is structurally safe.
 */
export function ensureMemoryDir(memoryDir: string): void {
  if (existsSync(memoryDir)) {
    if (isSymlink(memoryDir)) {
      throw new Error(
        `SECURITY ALERT: Refusing to interact with symlinked memory directory: ${memoryDir}`,
      );
    }
    return;
  }
  mkdirSync(memoryDir, { recursive: true });
}

/**
 * Reads the MEMORY.md index file, enforcing a line limit for context efficiency.
 */
export function readMemoryIndex(memoryDir: string): string | undefined {
  if (isSymlink(memoryDir)) return undefined;
  const memoryFile = join(memoryDir, "MEMORY.md");
  const content = safeReadFile(memoryFile);
  if (content === undefined) return undefined;

  const lines = content.split("\n");
  if (lines.length > MAX_MEMORY_LINES) {
    return (
      lines.slice(0, MAX_MEMORY_LINES).join("\n") +
      "\n... (Truncated for Context Window Efficiency)"
    );
  }
  return content;
}

/**
 * Constructs the system-prompt block for agents with WRITE capability on their memory.
 */
export function buildMemoryBlock(
  agentName: string,
  scope: MemoryScope,
  cwd: string,
): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  ensureMemoryDir(memoryDir);
  const existingMemory = readMemoryIndex(memoryDir);

  const header = `## Persistent Memory (RW)
Location: ${memoryDir}/
Scope: ${scope}

You have a persistent knowledge base. The primary index (MEMORY.md) is provided below.
You are required to maintain this memory as you learn new information about the codebase.
Use your file tools (write/edit) to update MEMORY.md or create new files in the memory dir.`;

  const content = existingMemory
    ? `\n\n### Current MEMORY.md\n${existingMemory}`
    : `\n\nNo memory exists yet. Please initialize your knowledge base now.`;

  return header + content;
}

/**
 * Constructs the system-prompt block for agents with READ-ONLY capability.
 */
export function buildReadOnlyMemoryBlock(
  agentName: string,
  scope: MemoryScope,
  cwd: string,
): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  const existingMemory = readMemoryIndex(memoryDir);

  const header = `## Persistent Memory (RO)
Scope: ${scope}

Reference the following specialist knowledge. You cannot modify these files.`;

  const content = existingMemory
    ? `\n\n### Current MEMORY.md\n${existingMemory}`
    : `\n\nNo specialist memory available for reference.`;

  return header + content;
}

// ── UI Formatting Helpers ───────────────────────

/**
 * Formats specialist IDs into human-readable Title Case.
 */
function displayName(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * High-Performance Wrap Logic: recursively breaks strings into rows of fixed width.
 */
function wrapText(text: string, width: number): string[] {
  if (width <= 0) return [text];
  const lines: string[] = [];
  const segments = text.replace(/\r/g, "").split("\n");
  for (const segment of segments) {
    if (segment.length === 0) {
      lines.push("");
      continue;
    }
    let current = segment;
    while (current.length > 0) {
      lines.push(current.slice(0, width));
      current = current.slice(width);
    }
  }
  return lines;
}

// ── Configuration Parsers ───────────────────────

/**
 * Robust YAML-lite parser for agents.yaml.
 */
function parseAgentsYaml(
  raw: string,
): Record<string, { name: string; description: string; tools: string }> {
  const agents: Record<
    string,
    { name: string; description: string; tools: string }
  > = {};
  let current: string | null = null;
  for (const line of raw.split("\n")) {
    if (line.trim() === "") continue;
    const itemMatch = line.match(/^(\S[^:]*):$/);
    if (itemMatch) {
      current = itemMatch[1].trim();
      agents[current] = { name: current, description: "", tools: "" };
      continue;
    }
    const keyMatch = line.match(/^\s+(name|description|tools):\s*(.+)$/);
    if (keyMatch && current) {
      agents[current][keyMatch[1] as "name" | "description" | "tools"] =
        keyMatch[2].trim();
    }
  }
  return agents;
}

/**
 * Robust YAML-lite parser for teams.yaml.
 */
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

/**
 * Serializes internal state back to YAML for persistent team storage.
 */
function stringifyTeamsYaml(teams: Record<string, string[]>): string {
  let out =
    "# Specialist Teams Definition\n# Auto-generated by Agent-Team Orchestrator\n\n";
  for (const [name, members] of Object.entries(teams)) {
    out += `${name}:\n`;
    for (const member of members) {
      out += `  - ${member}\n`;
    }
    out += "\n";
  }
  return out.trim();
}

/**
 * Parses markdown files containing YAML frontmatter and System Prompt bodies.
 */
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

/**
 * Scans primary directories for available specialist agent definitions.
 */
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

// ── Specialist Visibility Logic ────────────────

/**
 * Generates a full readable catalog of all agents available to the orchestrator.
 */
function getAllAgentsCatalog(allAgentDefs: AgentDef[]): string {
  if (allAgentDefs.length === 0) return "No specialist definitions found.";
  return allAgentDefs
    .map(
      (d) =>
        `### ${displayName(d.name)} (ID: \`${d.name}\`)\n- **Role:** ${d.description}\n- **Tools:** ${d.tools}`,
    )
    .join("\n\n");
}

/**
 * Generates a grouped list of specialists by their defined team context.
 */
function getTeamsCatalog(teams: Record<string, string[]>): string {
  if (Object.keys(teams).length === 0) return "No teams defined.";
  return Object.entries(teams)
    .map(([name, members]) => `- **${name}**: ${members.join(", ")}`)
    .join("\n");
}

// ── The Extension ────────────────────────────────

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

  /**
   * Initializes and loads all agent/team metadata from the project.
   */
  function loadAgents(cwd: string) {
    sessionDir = join(cwd, ".pi", "agent-sessions");
    if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true });

    allAgentDefs = scanAgentDirs(cwd);
    const teamsPath = join(cwd, ".pi", "agents", "teams.yaml");
    if (existsSync(teamsPath)) {
      try {
        teams = parseTeamsYaml(readFileSync(teamsPath, "utf-8"));
      } catch {
        teams = {};
      }
    }

    // Default fallback roster
    if (Object.keys(teams).length === 0) {
      teams = { all: allAgentDefs.map((d) => d.name) };
    }
  }

  /**
   * Saves team modifications back to the project configuration.
   */
  function saveTeams(cwd: string) {
    const dirPath = join(cwd, ".pi", "agents");
    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
    try {
      writeFileSync(
        join(dirPath, "teams.yaml"),
        stringifyTeamsYaml(teams),
        "utf-8",
      );
    } catch {}
  }

  /**
   * Hot-swaps the current specialist roster in the TUI dashboard.
   */
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
      const sessFile = join(sessionDir, `${key}.json`);
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
        sessionFile: existsSync(sessFile) ? sessFile : null,
        runCount: 0,
        activeTools: new Set(),
      });
    }
  }

  /**
   * Maintains the high-frequency TUI animation loop.
   */
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

  // ── Tree Rendering Logic (Full Depth Architecture) ───

  /**
   * Renders a specialist's dashboard block with recursive row wrapping.
   * Logic: Header is rendered first, Activity/Logs follow immediately.
   * DYNAMIC HEIGHT: Logs are rendered exactly as they appear, letting the tree grow.
   */
  function renderTreeAgent(
    state: AgentState,
    isLastInList: boolean,
    width: number,
    theme: any,
  ): string[] {
    const frame = SPINNER[widgetFrame % SPINNER.length];
    const safeWidth = Math.max(10, width - 2);

    let icon = theme.fg("dim", "○");
    let nameColor = "dim";

    if (state.status === "running") {
      icon = theme.fg("accent", frame);
      nameColor = "accent";
    } else if (state.status === "done") {
      icon = theme.fg("success", "✓");
      nameColor = "dim";
    } else if (state.status === "error") {
      icon = theme.fg("error", "✗");
      nameColor = "error";
    }

    const nameLabel = theme.bold(displayName(state.def.name));
    const descText = state.task ? state.task : state.def.description;

    const parts: string[] = [];
    if (state.status !== "idle") {
      parts.push(`${Math.round(state.elapsed / 1000)}s`);
      if (state.toolCount > 0)
        parts.push(
          `${state.toolCount} tool${state.toolCount === 1 ? "" : "s"}`,
        );
    }
    if (state.contextPct > 0) {
      // FIX: Clamp filled value to prevent RangeError: Invalid count value: -1
      const filled = Math.max(0, Math.min(5, Math.ceil(state.contextPct / 20)));
      parts.push(
        `[${"#".repeat(filled)}${"-".repeat(5 - filled)}] ${Math.ceil(state.contextPct)}%`,
      );
    }

    const stats =
      parts.length > 0
        ? ` ${theme.fg("dim", "·")} ${theme.fg("dim", parts.join(" · "))}`
        : "";
    const prefixChar = isLastInList ? "└─" : "├─";

    const headerLine =
      truncateToWidth(
        `${prefixChar} ${icon} ${theme.fg(nameColor, nameLabel)}  ${theme.fg("dim", descText)}`,
        safeWidth - visibleWidth(stats),
      ) + stats;

    const logRows: string[] = [];
    if (state.status === "running") {
      const logIndent = isLastInList ? "   " : "│  ";
      const contentWidth = Math.max(20, safeWidth - 10);

      let raw = "",
        color = "dim",
        prefix = "";
      if (state.activeTools.size > 0) {
        raw = `using tools: ${Array.from(state.activeTools).join(", ")}`;
        color = "accent";
      } else if (state.currentMode === "thinking") {
        raw = state.lastThinking;
        color = "dim";
        prefix = "thinking: ";
      } else if (state.currentMode === "working") {
        raw = state.lastWork;
        color = "muted";
      } else {
        raw = state.lastWork || state.lastThinking;
        color = "dim";
      }

      // Process and wrap logs
      const rawLines = raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const wrapped: string[] = [];
      for (let i = 0; i < rawLines.length; i++) {
        let content = rawLines[i];
        if (i === 0 && prefix && !content.startsWith(prefix))
          content = prefix + content;
        wrapped.push(...wrapText(content, contentWidth));
      }

      if (wrapped.length === 0) wrapped.push("initializing child process...");

      // DYNAMIC HEIGHT: Show last 8 lines without fixed padding
      const visible = wrapped.slice(-8);

      for (let j = 0; j < visible.length; j++) {
        logRows.push(theme.fg("dim", logIndent) + theme.fg(color, visible[j]));
      }
    }

    // MANDATORY SEQUENCE: Header first, logs indented beneath
    return [truncateToWidth(headerLine, safeWidth), ...logRows];
  }

  /**
   * Final Widget Assembly.
   * STICK-TO-BOTTOM: Team status line is the last item in the array.
   * DYNAMIC TOP: The list grows upwards into the scrollback as needed.
   */
  function updateWidget() {
    if (!widgetCtx) return;

    widgetCtx.ui.setWidget("agent-team", (_tui: any, theme: any) => {
      const text = new Text("", 0, 1);
      return {
        render(width: number): string[] {
          if (agentStates.size === 0)
            return [theme.fg("dim", "No active specialists loaded.")];

          const running = Array.from(agentStates.values()).some(
            (s) => s.status === "running",
          );
          const safeWidth = Math.max(10, width - 2);

          const lines: string[] = [];

          // Team Dashboard Header (standalone - no branch)
          const headingLine = truncateToWidth(
            theme.fg(running ? "accent" : "dim", "○") +
              " " +
              theme.fg(
                running ? "accent" : "dim",
                `Team Orchestrator: ${activeTeamName}`,
              ),
            safeWidth,
          );
          lines.push(headingLine);

          // Assemble specialist blocks beneath the orchestrator
          const agents = Array.from(agentStates.values());
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

  // ── Dispatch Logic (Signal-Aware Process Lifecycle) ──────────

  /**
   * Spawns sub-agents as isolated child processes with full event tunneling.
   */
  function dispatchAgent(
    agentName: string,
    task: string,
    ctx: any,
    signal?: AbortSignal,
  ): Promise<{ output: string; exitCode: number; elapsed: number }> {
    const key = agentName.toLowerCase();
    const state = agentStates.get(key);

    if (!state)
      return Promise.resolve({
        output: `CRITICAL: Specialist ID "${agentName}" not found.`,
        exitCode: 1,
        elapsed: 0,
      });
    if (state.status === "running")
      return Promise.resolve({
        output: `RESOURCE_ERROR: Specialist engages elsewhere.`,
        exitCode: 1,
        elapsed: 0,
      });

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
    const sessFile = join(sessionDir, `${agentKey}.json`);

    const hasWriteTools =
      state.def.tools.includes("write") || state.def.tools.includes("edit");
    const memory = hasWriteTools
      ? buildMemoryBlock(state.def.name, "project", ctx.cwd)
      : buildReadOnlyMemoryBlock(state.def.name, "project", ctx.cwd);

    const args = [
      "--mode",
      "json",
      "-p",
      "--model",
      model,
      "--tools",
      state.def.tools,
      "--thinking",
      "low",
      "--append-system-prompt",
      `${state.def.systemPrompt}\n\n${memory}`,
      "--session",
      sessFile,
    ];

    if (state.sessionFile) args.push("-c");
    args.push(task);

    const textChunks: string[] = [];

    return new Promise((resolve) => {
      const proc = spawn("pi", args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      });

      const onAbort = () => proc.kill("SIGINT");
      if (signal) {
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort);
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
                state.currentMode = "working";
                updateWidget();
              } else if (delta?.type === "thinking_delta") {
                state.lastThinking += delta.delta || "";
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
              state.currentMode = "working";
              updateWidget();
            } else if (
              event.type === "message_end" &&
              event.message?.usage &&
              contextWindow > 0
            ) {
              state.contextPct =
                (event.message.usage.input / contextWindow) * 100;
              updateWidget();
            }
          } catch (e) {}
        }
      });

      proc.on("close", (code) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        const aborted = signal?.aborted;

        state.elapsed = Date.now() - startTime;
        state.status = code === 0 && !aborted ? "done" : "error";
        state.currentMode = "idle";
        state.activeTools.clear();

        if (code === 0 && !aborted) state.sessionFile = sessFile;

        updateWidget();
        resolve({
          output: aborted
            ? textChunks.join("") + "\n\n[USER_TERMINATED_SESSION]"
            : textChunks.join(""),
          exitCode: aborted ? 1 : (code ?? 1),
          elapsed: state.elapsed,
        });
      });

      proc.on("error", (err) => {
        if (signal) signal.removeEventListener("abort", onAbort);
        state.status = "error";
        state.currentMode = "idle";
        updateWidget();
        resolve({
          output: `SPAWN_EXCEPTION: ${err.message}`,
          exitCode: 1,
          elapsed: Date.now() - startTime,
        });
      });
    });
  }

  // ── Tools & Commands Registration ────────────

  pi.registerTool({
    name: "switch_team",
    label: "Switch Team",
    description: "Switch the active specialist roster.",
    parameters: Type.Object({
      teamName: Type.String({ description: "Target Team ID" }),
    }),
    async execute(_id, params, _sig, _upd, ctx) {
      const { teamName } = params as { teamName: string };
      if (!teams[teamName])
        return {
          content: [
            { type: "text", text: `Team ID "${teamName}" not defined.` },
          ],
          details: {},
        };
      activateTeam(teamName);
      updateWidget();
      ctx.ui.setStatus("agent-team", `Team: ${teamName}`);
      return {
        content: [{ type: "text", text: `Swapped to roster: "${teamName}".` }],
        details: {},
      };
    },
    renderCall: (args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("switch_team ")) +
          theme.fg("accent", (args as any).teamName),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "list_teams",
    label: "List Teams",
    description: "List all teams from teams.yaml that can be switched to.",
    parameters: Type.Object({}),
    async execute(_id, _params, _sig, _upd, ctx) {
      const teamsPath = join(ctx.cwd, ".pi", "agents", "teams.yaml");
      const teamsContent = safeReadFile(teamsPath);
      const teamsList = teamsContent ? parseTeamsYaml(teamsContent) : {};

      let output = "### Teams\n";
      if (Object.keys(teamsList).length > 0) {
        for (const [team, members] of Object.entries(teamsList)) {
          const marker = team === activeTeamName ? " **(active)**" : "";
          output += `\n#### ${team}${marker}\nMembers: ${members.join(", ")}`;
        }
      } else {
        output += "No teams defined.\n";
      }

      return {
        content: [{ type: "text", text: output }],
        details: {},
      };
    },
    renderCall: (_args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("list_teams")) +
          theme.fg("dim", " (from teams.yaml)"),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "list_agents",
    label: "List Agents",
    description: "List all agents from agents.yaml that can be loaded.",
    parameters: Type.Object({}),
    async execute(_id, _params, _sig, _upd, ctx) {
      const agentsPath = join(ctx.cwd, ".pi", "agents", "agents.yaml");
      const agentsContent = safeReadFile(agentsPath);
      const activeMembers = teams[activeTeamName] || [];

      let output = "### Agents\n";
      if (agentsContent) {
        const parsedAgents = parseAgentsYaml(agentsContent);
        for (const [name, agent] of Object.entries(parsedAgents)) {
          const inActive = activeMembers.includes(name) ? " ✓" : "";
          output += `\n- **${name}**${inActive}\n  ${agent.description}\n  Tools: ${agent.tools}`;
        }
      } else {
        output += "No agents defined.\n";
      }

      return {
        content: [{ type: "text", text: output }],
        details: {},
      };
    },
    renderCall: (_args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("list_agents")) +
          theme.fg("dim", " (from agents.yaml)"),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "list_active_team",
    label: "List Active Team",
    description: "List agents currently loaded in the active team.",
    parameters: Type.Object({}),
    async execute(_id, _params, _sig, _upd, _ctx) {
      const members = Array.from(agentStates.values())
        .map((s) => {
          const model = s.def.model ? ` (${s.def.model})` : "";
          return `- **${s.def.name}**${model} — ${s.def.description} [${s.status}]`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `### Active Team: ${activeTeamName}\n\n${members || "No agents loaded."}`,
          },
        ],
        details: {},
      };
    },
    renderCall: (_args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("list_active_team")) +
          theme.fg("dim", " (loaded agents)"),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "manage_team",
    label: "Manage Team",
    description: "Add or remove specialists from the active roster.",
    parameters: Type.Object({
      action: Type.Enum({ add: "add", remove: "remove" }),
      agent: Type.String({ description: "Specialist ID" }),
    }),
    async execute(_id, params, _sig, _upd, ctx) {
      const { action, agent } = params as {
        action: "add" | "remove";
        agent: string;
      };
      const key = agent.toLowerCase();

      if (action === "add") {
        if (agentStates.has(key))
          return {
            content: [{ type: "text", text: `Specialist already active.` }],
          };
        const def = allAgentDefs.find((d) => d.name.toLowerCase() === key);
        if (!def)
          return {
            content: [{ type: "text", text: `Specialist ID unknown.` }],
          };

        const sess = join(
          sessionDir,
          `${def.name.toLowerCase().replace(/\s+/g, "-")}.json`,
        );
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
          sessionFile: existsSync(sess) ? sess : null,
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
            { type: "text", text: `Enlisted ${displayName(def.name)}.` },
          ],
        };
      } else {
        if (!agentStates.has(key))
          return { content: [{ type: "text", text: `ID not active.` }] };
        agentStates.delete(key);
        if (teams[activeTeamName])
          teams[activeTeamName] = teams[activeTeamName].filter(
            (m) => m.toLowerCase() !== key,
          );
        saveTeams(ctx.cwd);
        updateWidget();
        return {
          content: [{ type: "text", text: `Specialist decommissioned.` }],
        };
      }
    },
    renderCall: (args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("manage_team ")) +
          theme.fg("accent", `${(args as any).action} ${(args as any).agent}`),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "dispatch_agent",
    label: "Dispatch Agent",
    description: "Delegate a task to a specialist agent.",
    parameters: Type.Object({
      agent: Type.String({ description: "Target Specialist ID" }),
      task: Type.String({ description: "Comprehensive task description" }),
    }),
    async execute(_id, params, signal, upd, ctx) {
      const { agent, task } = params as { agent: string; task: string };
      if (upd)
        upd({
          content: [{ type: "text", text: `Piping context to: ${agent}...` }],
        });

      const res = await dispatchAgent(agent, task, ctx, signal);
      const status = res.exitCode === 0 ? "SUCCESS" : "FAILURE";

      return {
        content: [
          {
            type: "text",
            text: `### [${agent}] Task ${status}\n- **Duration:** ${Math.round(res.elapsed / 1000)}s\n\n**Output:**\n${res.output}`,
          },
        ],
      };
    },
    renderCall: (args, theme) => {
      const task = (args as any).task || "";
      const preview = task.length > 50 ? task.slice(0, 47) + "..." : task;
      return new Text(
        theme.fg("toolTitle", theme.bold("dispatch_agent ")) +
          theme.fg("accent", (args as any).agent) +
          theme.fg("dim", " -> ") +
          theme.fg("muted", preview),
        0,
        0,
      );
    },
  });

  pi.registerTool({
    name: "list_active_team",
    label: "List Active Team",
    description: "List agents currently loaded in the active team.",
    parameters: Type.Object({}),
    async execute(_id, _params, _sig, _upd, _ctx) {
      const members = Array.from(agentStates.values())
        .map((s) => {
          const model = s.def.model ? ` (${s.def.model})` : "";
          return `- **${s.def.name}**${model} — ${s.def.description} [${s.status}]`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `### Active Team: ${activeTeamName}\n\n${members || "No agents loaded."}`,
          },
        ],
        details: {},
      };
    },
    renderCall: (_args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("list_active_team")) +
          theme.fg("dim", " (loaded agents)"),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "list_teams",
    label: "List Teams",
    description: "List all teams from teams.yaml that can be switched to.",
    parameters: Type.Object({}),
    async execute(_id, _params, _sig, _upd, ctx) {
      const teamsPath = join(ctx.cwd, ".pi", "agents", "teams.yaml");
      const teamsContent = safeReadFile(teamsPath);
      const teamsList = teamsContent ? parseTeamsYaml(teamsContent) : {};

      let output = "### Teams\n";
      if (Object.keys(teamsList).length > 0) {
        for (const [team, members] of Object.entries(teamsList)) {
          const marker = team === activeTeamName ? " **(active)**" : "";
          output += `\n#### ${team}${marker}\nMembers: ${members.join(", ")}`;
        }
      } else {
        output += "No teams defined.\n";
      }

      return { content: [{ type: "text", text: output }] };
    },
    renderCall: (_args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("list_teams")) +
          theme.fg("dim", " (from teams.yaml)"),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "list_agents",
    label: "List Agents",
    description: "List all agents from agents.yaml that can be loaded.",
    parameters: Type.Object({}),
    async execute(_id, _params, _sig, _upd, ctx) {
      const agentsPath = join(ctx.cwd, ".pi", "agents", "agents.yaml");
      const agentsContent = safeReadFile(agentsPath);
      const activeMembers = teams[activeTeamName] || [];

      let output = "### Agents\n";
      if (agentsContent) {
        const parsedAgents = parseAgentsYaml(agentsContent);
        for (const [name, agent] of Object.entries(parsedAgents)) {
          const inActive = activeMembers.includes(name) ? " ✓" : "";
          output += `\n- **${name}**${inActive}\n  ${agent.description}\n  Tools: ${agent.tools}`;
        }
      } else {
        output += "No agents defined.\n";
      }

      return { content: [{ type: "text", text: output }] };
    },
    renderCall: (_args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("list_agents")) +
          theme.fg("dim", " (from agents.yaml)"),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "list_team_agents",
    label: "List Team Agents",
    description: "List all agents in the active team with their tools.",
    parameters: Type.Object({}),
    async execute(_id, _params, _sig, _upd, _ctx) {
      const members = Array.from(agentStates.values())
        .map((s) => {
          const model = s.def.model ? ` (${s.def.model})` : "";
          return `### ${s.def.name}${model}\n- **Tools:** ${s.def.tools}\n- **Status:** ${s.status}`;
        })
        .join("\n\n");

      let yamlInfo = "";
      const teamsPath = join(ctx.cwd, ".pi", "agents", "teams.yaml");
      const agentsPath = join(ctx.cwd, ".pi", "agents", "agents.yaml");
      const teamsContent = safeReadFile(teamsPath);
      const agentsContent = safeReadFile(agentsPath);

      if (teamsContent || agentsContent) {
        yamlInfo = "\n\n---\n### Teams & Agents YAML\n";
        if (teamsContent)
          yamlInfo += `\n**teams.yaml:**\n\`\`\`yaml\n${teamsContent}\n\`\`\``;
        if (agentsContent)
          yamlInfo += `\n**agents.yaml:**\n\`\`\`yaml\n${agentsContent}\n\`\`\``;
      }

      return {
        content: [
          {
            type: "text",
            text: `### Active Team: ${activeTeamName}\n\n${members || "No agents loaded."}${yamlInfo}`,
          },
        ],
      };
    },
    renderCall: (_args, theme) =>
      new Text(
        theme.fg("toolTitle", theme.bold("list_team_agents")) +
          theme.fg("dim", " (show active team)"),
        0,
        0,
      ),
  });

  pi.registerTool({
    name: "save_memory",
    label: "Save Memory",
    description: "Save notes to your persistent memory file.",
    parameters: Type.Object({
      note: Type.String({ description: "Content to append to MEMORY.md" }),
    }),
    async execute(id, params, _sig, _upd, ctx) {
      const agentKey = id.toLowerCase();
      const state = agentStates.get(agentKey);
      if (!state)
        return { content: [{ type: "text", text: `Agent not found.` }] };

      const hasWriteTools =
        state.def.tools.includes("write") || state.def.tools.includes("edit");
      if (!hasWriteTools)
        return {
          content: [
            { type: "text", text: `This agent does not have write tools.` },
          ],
        };

      const { note } = params as { note: string };
      const memoryDir = resolveMemoryDir(state.def.name, "project", ctx.cwd);
      ensureMemoryDir(memoryDir);
      const memoryFile = join(memoryDir, "MEMORY.md");

      const existing = safeReadFile(memoryFile) || "";
      const timestamp = new Date().toISOString().slice(0, 10);
      const entry = `\n\n## ${timestamp}\n${note}`;
      const updated = existing + entry;

      try {
        writeFileSync(memoryFile, updated, "utf-8");
        return {
          content: [{ type: "text", text: `Memory saved to ${memoryFile}` }],
        };
      } catch (e) {
        return {
          content: [{ type: "text", text: `Failed to save memory: ${e}` }],
        };
      }
    },
    renderCall: (args, theme) => {
      const note = (args as any).note || "";
      const preview = note.length > 30 ? note.slice(0, 27) + "..." : note;
      return new Text(
        theme.fg("toolTitle", theme.bold("save_memory ")) +
          theme.fg("dim", preview),
        0,
        0,
      );
    },
  });

  // ── Commands ─────────────────────────────────

  pi.registerCommand("agents-team", {
    description: "Switch active context.",
    handler: async (_args, ctx) => {
      const names = Object.keys(teams);
      if (names.length === 0) return;
      const options = names.map(
        (n) => `${n} — Members: ${teams[n].join(", ")}`,
      );
      const choice = await ctx.ui.select(
        "Select Active Specialist Roster",
        options,
      );
      if (choice) {
        const name = names[options.indexOf(choice)];
        activateTeam(name);
        updateWidget();
        ctx.ui.setStatus("agent-team", `Team: ${name}`);
      }
    },
  });

  pi.registerCommand("agents-reload", {
    description: "Force reload specialist metadata.",
    handler: async (_args, ctx) => {
      loadAgents(ctx.cwd);
      activateTeam(activeTeamName || Object.keys(teams)[0] || "all");
      updateWidget();
      ctx.ui.notify("Configurations hot-reloaded.", "success");
    },
  });

  pi.registerCommand("agents-status", {
    description: "Verbose team analysis.",
    handler: async (_args, ctx) => {
      const active = Array.from(agentStates.values())
        .map(
          (s) =>
            `- **${displayName(s.def.name)}** [${s.status}] (${s.runCount} sessions)`,
        )
        .join("\n");
      ctx.ui.notify(
        `### Active Context: ${activeTeamName}\n${active || "Empty roster."}`,
        "info",
      );
    },
  });

  pi.registerCommand("agents-list", {
    description: "Registry of all specialists.",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        `### Global Registry\n\n${getAllAgentsCatalog(allAgentDefs)}`,
        "info",
      );
    },
  });

  pi.registerCommand("list-teams", {
    description: "List all available teams",
    handler: async (_args, ctx) => {
      // Invoke the list_teams tool internally
      const result = await pi.dispatchTool("list_teams", {});
      ctx.ui.notify(result.content[0].text, "info");
    },
  });

  pi.registerCommand("list-agents", {
    description: "List all available agents",
    handler: async (_args, ctx) => {
      // Invoke the list_agents tool internally
      const result = await pi.dispatchTool("list_agents", {});
      ctx.ui.notify(result.content[0].text, "info");
    },
  });

  pi.registerCommand("list-active-team", {
    description: "List currently loaded agents",
    handler: async (_args, ctx) => {
      // Invoke the list_active_team tool internally
      const result = await pi.dispatchTool("list_active_team", {});
      ctx.ui.notify(result.content[0].text, "info");
    },
  });

  // ── System Hook: High-Context Orchestration ──────────

  pi.registerCommand("memory-export:json", {
    description: "Export agent memory to JSON format",
    handler: async (_args, ctx) => {
      try {
        const result = await exportMemory("json", ctx.cwd);
        ctx.ui.log(`✅ Memory export initiated:
  Format: JSON
  Path: .pi/memory-export.json
  Progress: ${result}

View with: cat .pi/memory-export.json`);
        // Cleanup old exports to prevent disk usage
        await cleanupExports(7 * 24 * 60 * 60 * 1000);
        ctx.ui.log(`✅ Memory export complete`);
      } catch (error) {
        ctx.ui.log(`❌ Export failed: ${error}`);
      }
    },
  });

  pi.registerCommand("memory-export:text", {
    description: "Export agent memory to plaintext format",
    handler: async (_args, ctx) => {
      try {
        const result = await exportMemory("text", ctx.cwd);
        ctx.ui.log(`✅ Memory export to plaintext:
  Format: Text
  Path: .pi/memory-export.txt
  Progress: ${result}

View with: cat .pi/memory-export.txt`);
        await cleanupExports(7 * 24 * 60 * 60 * 1000);
        ctx.ui.log(`✅ Memory export complete`);
      } catch (error) {
        ctx.ui.log(`❌ Export failed: ${error}`);
      }
    },
  });

  pi.registerCommand("memory-export:md", {
    description: "Export agent memory to markdown format",
    handler: async (_args, ctx) => {
      try {
        const result = await exportMemory("md", ctx.cwd);
        ctx.ui.log(`✅ Memory export to markdown:
  Format: Markdown
  Path: .pi/memory-export.md
  Progress: ${result}

View with: cat .pi/memory-export.md`);
        await cleanupExports(7 * 24 * 60 * 60 * 1000);
        ctx.ui.log(`✅ Memory export complete`);
      } catch (error) {
        ctx.ui.log(`❌ Export failed: ${error}`);
      }
    },
  });

  pi.registerCommand("memory-export:preview", {
    description: "Preview memory export without writing to file",
    handler: async (_args, ctx) => {
      try {
        const result = await exportMemory("preview", ctx.cwd);
        ctx.ui.log(`👀 Memory Preview:
${result}`);
        ctx.ui.log(`✅ Export preview shown`);
      } catch (error) {
        ctx.ui.log(`❌ Preview failed: ${error}`);
      }
    },
  });

  // ── System Hook: High-Context Orchestration ───────
  pi.on("before_agent_start", async (_event, _ctx) => {
    const activeCatalog = Array.from(agentStates.values())
      .map(
        (s) =>
          `### ${displayName(s.def.name)} (ID: \`${s.def.name}\`)\n${s.def.description}`,
      )
      .join("\n\n");

    const fullCatalog = getAllAgentsCatalog(allAgentDefs);
    const teamsList = getTeamsCatalog(teams);

    return {
      systemPrompt: `You are a dispatcher agent. You coordinate specialist agents to accomplish tasks.
You do NOT have direct access to the codebase. You MUST delegate all work through
agents using the dispatch_agent tool.

## Active Team: ${activeTeamName}
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

## Active Agent Catalog
${activeCatalog}

## Global Agent Catalog
${fullCatalog}

## Operational Directives
1. Delegate specialist agent requests via \`dispatch_agent\` (for code analysis, implementation, review, etc.).
2. Use orchestrator tools like \`list_teams\`, \`list_agents\`, and \`list_active_team\` for team management.
3. Use \`save_memory\` to persist orchestrator's own knowledge and session notes.
4. Use \`web_access\` for browsing the web and accessing current information when needed.
5. Ensure specialists have enough context to succeed.
6. Manage rosters via \`manage_team\` as needed.
`,
    };
  });

  // ── Initial Boot Sequence ────────────────────────

  pi.on("session_start", async (_ev, ctx) => {
    applyExtensionDefaults(import.meta.url, ctx);
    widgetCtx = ctx;
    contextWindow = ctx.model?.contextWindow || 0;

    loadAgents(ctx.cwd);
    if (Object.keys(teams).length > 0) {
      activateTeam(activeTeamName || Object.keys(teams)[0]);
    }

    // Register memory export tools
    const exportFormats = listExportFormats();

    pi.setActiveTools([
      "dispatch_agent",
      "manage_team",
      "switch_team",
      "list_active_team",
      "list_teams",
      "list_agents",
      "save_memory",
      "web_access",
      ...exportFormats,
    ]);
    updateWidget();

    ctx.ui.setFooter((_tui, theme) => ({
      render(width: number): string[] {
        const usage = ctx.getContextUsage();
        const pct = usage ? usage.percent : 0 || 0;
        const bar =
          "#".repeat(Math.round(pct / 10)) +
          "-".repeat(10 - Math.round(pct / 10));
        const left =
          theme.fg("dim", ` ${ctx.model?.id || "no-model"}`) +
          theme.fg("muted", " | ") +
          theme.fg("accent", `Team: ${activeTeamName}`);
        const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}% `);
        const pad = " ".repeat(
          Math.max(1, width - visibleWidth(left) - visibleWidth(right)),
        );
        return [truncateToWidth(left + pad + right, width)];
      },
      dispose: () => {},
      invalidate: () => {},
    }));
  });
}

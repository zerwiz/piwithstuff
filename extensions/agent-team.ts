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
 *   /agents-team          — switch active team
 *   /agents-list          — list loaded agents
 *
 * Usage: pi -e extensions/agent-team.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { Text, type AutocompleteItem, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
import { spawn } from "child_process";
import { readdirSync, readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join, resolve } from "path";
import { applyExtensionDefaults } from "./themeMap.ts";

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
	contextPct: number;
	sessionFile: string | null;
	runCount: number;
	activeTools: Set<string>;
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// ── Helpers ──────────────────────────────────────

function displayName(name: string): string {
	return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
			teams = { all: allAgentDefs.map(d => d.name) };
		}
	}

	function activateTeam(teamName: string) {
		activeTeamName = teamName;
		const members = teams[teamName] || [];
		const defsByName = new Map(allAgentDefs.map(d => [d.name.toLowerCase(), d]));

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
		globalInterval = setInterval(() => {
			widgetFrame++;
			updateWidget();
		}, 80);
	}

	function stopGlobalIntervalIfNoRunning() {
		const anyRunning = Array.from(agentStates.values()).some(s => s.status === "running");
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
			if (state.toolCount > 0) parts.push(`${state.toolCount} tool${state.toolCount === 1 ? "" : "s"}`);
		}

		if (state.contextPct > 0) {
			const filled = Math.ceil(state.contextPct / 20);
			const bar = "#".repeat(filled) + "-".repeat(5 - filled);
			parts.push(`[${bar}] ${Math.ceil(state.contextPct)}%`);
		}

		const stats = parts.length > 0 ? ` ${theme.fg("dim", "·")} ${theme.fg("dim", parts.join(" · "))}` : "";
		return `${icon} ${theme.fg(nameColor, name)}  ${theme.fg(descColor, truncateToWidth(desc, 50))}${stats}`;
	}

	function updateWidget() {
		if (!widgetCtx) return;

		widgetCtx.ui.setWidget("agent-team", (_tui: any, theme: any) => {
			const text = new Text("", 0, 1);

			return {
				render(width: number): string[] {
					if (agentStates.size === 0) {
						text.setText(theme.fg("dim", "No agents found. Add .md files to agents/"));
						return text.render(width);
					}

					const anyRunning = Array.from(agentStates.values()).some(s => s.status === "running");
					const headingColor = anyRunning ? "accent" : "dim";
					const headingIcon = anyRunning ? "●" : "○";

					const lines: string[] = [
						truncateToWidth(theme.fg(headingColor, headingIcon) + " " + theme.fg(headingColor, `Team: ${activeTeamName}`), width)
					];

					const agents = Array.from(agentStates.values());
					for (let i = 0; i < agents.length; i++) {
						const state = agents[i];
						const isLast = i === agents.length - 1;
						const branch = isLast ? "└─" : "├─";

						lines.push(truncateToWidth(theme.fg("dim", branch) + " " + renderAgentLine(state, theme), width));

						if (state.status === "running") {
							const activityBranch = isLast ? "   " : "│  ";

							if (state.activeTools.size > 0) {
								const toolNames = Array.from(state.activeTools).join(", ");
								lines.push(truncateToWidth(theme.fg("dim", activityBranch) + theme.fg("accent", `  ⎿  using: ${toolNames}...`), width));
							} else {
								const workText = (state.lastWork || "").trim();
								const thinkText = (state.lastThinking || "").trim();
								const subLines: string[] = [];

								// 1. Thinking Area (up to 8 rows)
								if (thinkText) {
									const lastThinkChunk = thinkText.split("\n").filter(l => l.trim()).pop() || "";
									const wrappedThink = wrapLine(`thinking: ${lastThinkChunk}`, width - 20).slice(0, 8);
									for (let j = 0; j < wrappedThink.length; j++) {
										const isLastThink = j === wrappedThink.length - 1 && !workText;
										const thinkBranch = isLastThink ? "⎿ " : "  ";
										subLines.push(theme.fg("dim", `  ${thinkBranch} `) + theme.fg("dim", theme.italic(wrappedThink[j])));
									}
								}

								// 2. Actual Work Section (Clearly separated)
								if (workText) {
									const lastWorkChunk = workText.split("\n").filter(l => l.trim()).pop() || "";
									const wrappedWork = wrapLine(lastWorkChunk, width - 20).slice(0, 3);
									for (let j = 0; j < wrappedWork.length; j++) {
										const isLastWork = j === wrappedWork.length - 1;
										const workBranch = isLastWork ? "⎿ " : "  ";
										subLines.push(theme.fg("dim", `  ${workBranch} `) + theme.fg("muted", wrappedWork[j]));
									}
								}

								if (subLines.length === 0) {
									lines.push(truncateToWidth(theme.fg("dim", activityBranch) + theme.fg("dim", "  ⎿  thinking..."), width));
								} else {
									for (const sl of subLines) {
										lines.push(truncateToWidth(theme.fg("dim", activityBranch) + sl, width));
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
			return Promise.resolve({
				output: `Agent "${agentName}" not found.`,
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
		const model = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : "openrouter/google/gemini-3-flash-preview";
		const agentKey = state.def.name.toLowerCase().replace(/\s+/g, "-");
		const agentSessionFile = join(sessionDir, `${agentKey}.json`);

		const args = [
			"--mode", "json",
			"-p",
			"--no-extensions",
			"--model", model,
			"--tools", state.def.tools,
			"--thinking", "low",
			"--append-system-prompt", state.def.systemPrompt,
			"--session", agentSessionFile,
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
						state.elapsed = Date.now() - startTime;
						if (event.type === "message_update") {
							const delta = event.assistantMessageEvent;
							if (delta?.type === "text_delta") {
								textChunks.push(delta.delta || "");
								state.lastWork = textChunks.join("");
								updateWidget();
							} else if (delta?.type === "thinking_delta") {
								state.lastThinking += (delta.delta || "");
								updateWidget();
							} else if (delta?.type === "thinking_start") {
								state.lastThinking = "";
								updateWidget();
							}
						} else if (event.type === "tool_execution_start") {
							state.toolCount++;
							if (event.toolCall?.name) state.activeTools.add(event.toolCall.name);
							updateWidget();
						} else if (event.type === "tool_execution_end") {
							if (event.toolCall?.name) state.activeTools.delete(event.toolCall.name);
							updateWidget();
						} else if (event.type === "message_end") {
							if (event.message?.usage && contextWindow > 0) {
								state.contextPct = ((event.message.usage.input || 0) / contextWindow) * 100;
								updateWidget();
							}
						}
					} catch {}
				}
			});

			proc.on("close", (code) => {
				state.elapsed = Date.now() - startTime;
				state.status = code === 0 ? "done" : "error";
				if (code === 0) state.sessionFile = agentSessionFile;
				state.activeTools.clear();
				stopGlobalIntervalIfNoRunning();
				updateWidget();
				resolve({ output: textChunks.join(""), exitCode: code ?? 1, elapsed: state.elapsed });
			});

			proc.on("error", (err) => {
				state.status = "error";
				state.activeTools.clear();
				stopGlobalIntervalIfNoRunning();
				updateWidget();
				resolve({ output: err.message, exitCode: 1, elapsed: Date.now() - startTime });
			});
		});
	}

	// ── Tools & Commands ─────────────────────────

	pi.registerTool({
		name: "dispatch_agent",
		label: "Dispatch Agent",
		description: "Dispatch a task to a specialist agent.",
		parameters: Type.Object({
			agent: Type.String(),
			task: Type.String(),
		}),
		async execute(_id, params, _sig, onUpdate, ctx) {
			const { agent, task } = params as any;
			onUpdate?.({ content: [{ type: "text", text: `Dispatching to ${agent}...` }] });
			const res = await dispatchAgent(agent, task, ctx);
			return { content: [{ type: "text", text: res.output }] };
		},
		renderCall(args, theme) {
			return new Text(theme.fg("toolTitle", theme.bold("dispatch_agent ")) + theme.fg("accent", (args as any).agent), 0, 0);
		}
	});

	pi.registerCommand("agents-team", {
		description: "Select a team",
		handler: async (_args, ctx) => {
			widgetCtx = ctx;
			const teamNames = Object.keys(teams);
			const choice = await ctx.ui.select("Select Team", teamNames);
			if (choice) {
				activateTeam(choice);
				updateWidget();
				ctx.ui.setStatus("agent-team", `Team: ${choice}`);
			}
		}
	});

	pi.registerCommand("agents-list", {
		description: "List agents",
		handler: async (_args, ctx) => {
			const list = Array.from(agentStates.values()).map(s => `${displayName(s.def.name)}: ${s.status}`).join("\n");
			ctx.ui.notify(list || "No agents", "info");
		}
	});

	// ── Session Hooks ────────────────────────────

	pi.on("before_agent_start", async () => {
		const catalog = Array.from(agentStates.values()).map(s => `### ${displayName(s.def.name)}\n${s.def.description}`).join("\n\n");
		return { systemPrompt: `Dispatcher agent. Coordinate specialist agents.\n\n## Agents\n\n${catalog}` };
	});

	pi.on("session_start", async (_ev, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		widgetCtx = ctx;
		contextWindow = ctx.model?.contextWindow || 0;
		loadAgents(ctx.cwd);
		if (Object.keys(teams).length > 0) activateTeam(Object.keys(teams)[0]);
		pi.setActiveTools(["dispatch_agent"]);
		updateWidget();
	});
}

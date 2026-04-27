/**
 * Agent Team — Dispatcher-only orchestrator with grid dashboard
 *
 * The primary Pi agent has NO codebase tools. It can ONLY delegate work
 * to specialist agents via the `dispatch_agent` tool. Each specialist
 * maintains its own Pi session for cross-invocation memory.
 *
 * Loads agent definitions from agents/*.md, .claude/agents/*.md, .pi/agents/*.md.
 * Teams are defined in .pi/agents/teams.yaml — on boot a select dialog lets
 * you pick which team to work with. Only team members are available for dispatch.
 *
 * Commands:
 *   /agents-team          — switch active team
 *   /agents-list          — list loaded agents
 *   /agents-grid N        — set column count (default 2)
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
	contextPct: number;
	sessionFile: string | null;
	runCount: number;
	activeTools: Set<string>;
	lastThinking: string;
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

// ── Display Name Helper ──────────────────────────

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
		// Create session storage dir
		sessionDir = join(cwd, ".pi", "agent-sessions");
		if (!existsSync(sessionDir)) {
			mkdirSync(sessionDir, { recursive: true });
		}

		// Load all agent definitions
		allAgentDefs = scanAgentDirs(cwd);

		// Load teams from .pi/agents/teams.yaml
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

		// If no teams defined, create a default "all" team
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
				contextPct: 0,
				sessionFile: existsSync(sessionFile) ? sessionFile : null,
				runCount: 0,
				activeTools: new Set(),
				lastThinking: "",
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
								const linesToRender: { text: string; italic?: boolean; dim?: boolean }[] = [];

								if (thinkText && workText) {
									// Both present: 1 line thinking, up to 2 lines work
									const lastThinkChunk = thinkText.split("\n").filter(l => l.trim()).pop() || "";
									linesToRender.push({ text: `thinking: ${lastThinkChunk}`, italic: true, dim: true });
									
									const lastWorkChunk = workText.split("\n").filter(l => l.trim()).pop() || "";
									const wrappedWork = wrapLine(lastWorkChunk, width - 15).slice(0, 2);
									for (const lw of wrappedWork) {
										linesToRender.push({ text: lw });
									}
								} else if (thinkText) {
									// Only thinking: up to 3 lines
									const lastThinkChunk = thinkText.split("\n").filter(l => l.trim()).pop() || "";
									const wrappedThink = wrapLine(`thinking: ${lastThinkChunk}`, width - 15).slice(0, 3);
									for (const lt of wrappedThink) {
										linesToRender.push({ text: lt, italic: true, dim: true });
									}
								} else {
									// Only work (or default "thinking...")
									const displayWork = workText || "thinking...";
									const lastWorkChunk = displayWork.split("\n").filter(l => l.trim()).pop() || "";
									const wrappedWork = wrapLine(lastWorkChunk, width - 15).slice(0, 3);
									for (const lw of wrappedWork) {
										linesToRender.push({ text: lw });
									}
								}

								if (linesToRender.length === 0) {
									lines.push(truncateToWidth(theme.fg("dim", activityBranch) + theme.fg("dim", "  ⎿  thinking..."), width));
								} else {
									for (let j = 0; j < linesToRender.length; j++) {
										const isLastLine = j === linesToRender.length - 1;
										const branch = isLastLine ? "⎿ " : "  ";
										const item = linesToRender[j];
										let content = item.text;
										if (item.italic) content = theme.italic(content);
										
										lines.push(truncateToWidth(theme.fg("dim", activityBranch) + theme.fg("dim", `  ${branch} `) + theme.fg(item.dim ? "dim" : "muted", content), width));
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

	// ── Dispatch Agent (returns Promise) ─────────

	function dispatchAgent(
		agentName: string,
		task: string,
		ctx: any,
	): Promise<{ output: string; exitCode: number; elapsed: number }> {
		const key = agentName.toLowerCase();
		const state = agentStates.get(key);
		if (!state) {
			return Promise.resolve({
				output: `Agent "${agentName}" not found. Available: ${Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ")}`,
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
		state.runCount++;
		state.activeTools.clear();
		state.lastThinking = "";
		ensureGlobalInterval();
		updateWidget();

		const startTime = Date.now();

		const model = ctx.model
			? `${ctx.model.provider}/${ctx.model.id}`
			: "openrouter/google/gemini-3-flash-preview";

		// Session file for this agent
		const agentKey = state.def.name.toLowerCase().replace(/\s+/g, "-");
		const agentSessionFile = join(sessionDir, `${agentKey}.json`);

		// Build args — first run creates session, subsequent runs resume
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

		// Continue existing session if we have one
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
								const full = textChunks.join("");
								state.lastWork = full;
								updateWidget();
							} else if (delta?.type === "thinking_delta") {
								state.lastThinking = (state.lastThinking || "") + (delta.delta || "");
								updateWidget();
							} else if (delta?.type === "thinking_start") {
								state.lastThinking = "";
								updateWidget();
							} else if (delta?.type === "thinking_end") {
								// We keep thinking visible for a bit or until next event?
								// Let's keep it until it's finished.
								updateWidget();
							}
						} else if (event.type === "tool_execution_start") {
							state.toolCount++;
							if (event.toolCall?.name) {
								state.activeTools.add(event.toolCall.name);
							}
							updateWidget();
						} else if (event.type === "tool_execution_end") {
							if (event.toolCall?.name) {
								state.activeTools.delete(event.toolCall.name);
							}
							updateWidget();
						} else if (event.type === "message_end") {
							const msg = event.message;
							if (msg?.usage && contextWindow > 0) {
								state.contextPct = ((msg.usage.input || 0) / contextWindow) * 100;
								updateWidget();
							}
						} else if (event.type === "agent_end") {
							const msgs = event.messages || [];
							const last = [...msgs].reverse().find((m: any) => m.role === "assistant");
							if (last?.usage && contextWindow > 0) {
								state.contextPct = ((last.usage.input || 0) / contextWindow) * 100;
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
							if (delta?.type === "text_delta") textChunks.push(delta.delta || "");
						}
					} catch {}
				}

				state.elapsed = Date.now() - startTime;
				state.status = code === 0 ? "done" : "error";

				// Mark session file as available for resume
				if (code === 0) {
					state.sessionFile = agentSessionFile;
				}

				const full = textChunks.join("");
				state.lastWork = full;
				state.activeTools.clear();
				stopGlobalIntervalIfNoRunning();
				updateWidget();

				ctx.ui.notify(
					`${displayName(state.def.name)} ${state.status} in ${Math.round(state.elapsed / 1000)}s`,
					state.status === "done" ? "success" : "error"
				);

				resolve({
					output: full,
					exitCode: code ?? 1,
					elapsed: state.elapsed,
				});
			});

			proc.on("error", (err) => {
				state.status = "error";
				state.lastWork = `Error: ${err.message}`;
				state.activeTools.clear();
				stopGlobalIntervalIfNoRunning();
				updateWidget();
				resolve({
					output: `Error spawning agent: ${err.message}`,
					exitCode: 1,
					elapsed: Date.now() - startTime,
				});
			});
		});
	}

	// ── dispatch_agent Tool (registered at top level) ──

	pi.registerTool({
		name: "dispatch_agent",
		label: "Dispatch Agent",
		description: "Dispatch a task to a specialist agent. The agent will execute the task and return the result. Use the system prompt to see available agent names.",
		parameters: Type.Object({
			agent: Type.String({ description: "Agent name (case-insensitive)" }),
			task: Type.String({ description: "Task description for the agent to execute" }),
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

				const truncated = result.output.length > 8000
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
					content: [{ type: "text", text: `Error dispatching to ${agent}: ${err?.message || err}` }],
					details: { agent, task, status: "error", elapsed: 0, exitCode: 1, fullOutput: "" },
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
				0, 0,
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
					0, 0,
				);
			}

			const icon = details.status === "done" ? "✓" : "✗";
			const color = details.status === "done" ? "success" : "error";
			const elapsed = typeof details.elapsed === "number" ? Math.round(details.elapsed / 1000) : 0;
			const header = theme.fg(color, `${icon} ${details.agent}`) +
				theme.fg("dim", ` ${elapsed}s`);

			if (options.expanded && details.fullOutput) {
				const output = details.fullOutput.length > 4000
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

			const options = teamNames.map(name => {
				const members = teams[name].map(m => displayName(m));
				return `${name} — ${members.join(", ")}`;
			});

			const choice = await ctx.ui.select("Select Team", options);
			if (choice === undefined) return;

			const idx = options.indexOf(choice);
			const name = teamNames[idx];
			activateTeam(name);
			updateWidget();
			ctx.ui.setStatus("agent-team", `Team: ${name} (${agentStates.size})`);
			ctx.ui.notify(`Team: ${name} — ${Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ")}`, "info");
		},
	});

	pi.registerCommand("agents-list", {
		description: "List all loaded agents",
		handler: async (_args, _ctx) => {
			widgetCtx = _ctx;
			const names = Array.from(agentStates.values())
				.map(s => {
					const session = s.sessionFile ? "resumed" : "new";
					return `${displayName(s.def.name)} (${s.status}, ${session}, runs: ${s.runCount}): ${s.def.description}`;
				})
				.join("\n");
			_ctx.ui.notify(names || "No agents loaded", "info");
		},
	});

	// ── System Prompt Override ───────────────────

	pi.on("before_agent_start", async (_event, _ctx) => {
		// Build dynamic agent catalog from active team only
		const agentCatalog = Array.from(agentStates.values())
			.map(s => `### ${displayName(s.def.name)}\n**Dispatch as:** \`${s.def.name}\`\n${s.def.description}\n**Tools:** ${s.def.tools}`)
			.join("\n\n");

		const teamMembers = Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ");

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

${agentCatalog}`,
		};
	});

	// ── Session Start ────────────────────────────

	pi.on("session_start", async (_event, _ctx) => {
		applyExtensionDefaults(import.meta.url, _ctx);
		// Clear widgets from previous session
		if (widgetCtx) {
			widgetCtx.ui.setWidget("agent-team", undefined);
		}
		widgetCtx = _ctx;
		contextWindow = _ctx.model?.contextWindow || 0;

		// Wipe old agent session files so subagents start fresh
		const sessDir = join(_ctx.cwd, ".pi", "agent-sessions");
		if (existsSync(sessDir)) {
			for (const f of readdirSync(sessDir)) {
				if (f.endsWith(".json")) {
					try { unlinkSync(join(sessDir, f)); } catch {}
				}
			}
		}

		loadAgents(_ctx.cwd);

		// Default to first team — use /agents-team to switch
		const teamNames = Object.keys(teams);
		if (teamNames.length > 0) {
			activateTeam(teamNames[0]);
		}

		// Lock down to dispatcher-only (tool already registered at top level)
		pi.setActiveTools(["dispatch_agent"]);

		_ctx.ui.setStatus("agent-team", `Team: ${activeTeamName} (${agentStates.size})`);
		const members = Array.from(agentStates.values()).map(s => displayName(s.def.name)).join(", ");
		_ctx.ui.notify(
			`Team: ${activeTeamName} (${members})\n` +
			`Team sets loaded from: .pi/agents/teams.yaml\n\n` +
			`/agents-team          Select a team\n` +
			`/agents-list          List active agents and status`,
			"info",
		);
		updateWidget();

		// Footer: model | team |This is a sophisticated extension. You have created a clean, modular architecture that effectively manages TUI state, child process orchestration, and filesystem-based configuration. The "Dispatcher-Worker" pattern implemented here is a robust way to scale agent capabilities without overloading the primary context window.

Here is a review of your implementation with observations on architecture, security, and potential improvements.

---

### Strengths
* **TUI Management:** Your use of the `widget` lifecycle (initializing `setInterval` only when needed and cleaning it up) is excellent. It prevents unnecessary resource usage when the agent is idle.
* **State Machine:** The `AgentState` interface and its transitions (`idle` -> `running` -> `done`/`error`) are well-defined and make the UI rendering logic predictable and clean.
* **Modularity:** Separating the team/agent discovery logic from the execution logic makes the codebase maintainable as you add more features.

### Critical Observations & Suggestions

#### 1. Security: Command Argument Injection
In your `dispatchAgent` function, you pass the `task` variable directly into the `spawn` arguments:

```typescript
// Current
args.push(task);
const proc = spawn("pi", args, { ... });
```

**Risk:** If a user (or an untrusted input source) provides a malicious `task` string containing flags (e.g., `--help`, `--version`, or potentially harmful shell characters if `pi` interprets them), you could inadvertently trigger unintended behavior in the sub-agent.

**Recommendation:** Validate or strictly sanitize the `task` string. Since you are building a CLI orchestration tool, consider validating that the string does not start with a hyphen or contain characters that could be misinterpreted as flags by the underlying `pi` command.

#### 2. Fragility of Manual Parsing
You are using manual regex to parse YAML and frontmatter. While this keeps the extension lightweight (avoiding heavy dependencies), it is prone to edge-case failures (e.g., comments in YAML, complex frontmatter formatting, or trailing spaces).

**Recommendation:** If the `pi` environment permits, consider adding a lightweight parser like `js-yaml` or a simple JSON schema for your agent definitions. If you prefer to stay dependency-free, wrap your regex logic in a `try/catch` block that provides a helpful error message to the user pointing to the *exact line* in the file that failed to parse.

#### 3. UX: Handling Agent "Death"
Your `process.on("close")` listener handles normal termination well, but it doesn't explicitly handle scenarios where the `pi` child process is killed by the OS (e.g., OOM kill).

**Recommendation:** Listen to the `exit` event or check the `signal` parameter in the `close` event. If the process is terminated by a signal (like `SIGKILL` or `SIGTERM`), update the agent status to "error" and log "Process terminated unexpectedly" so the user isn't left wondering why the agent simply vanished.

#### 4. Future-Proofing: Global Interval
You currently use one `globalInterval` for all agents. If you eventually support hundreds of agents (unlikely, but possible), this works, but be mindful of the 80ms refresh rate.

**Recommendation:** If you find the UI becoming laggy as you add more agents, you could optimize the widget to only `invalidate` when a specific agent's status changes, rather than relying on a global timer.

---

### Suggested Refinement for Input Sanitization

To mitigate the injection risk, you can add a simple check before spawning:

```typescript
// Inside dispatchAgent
const sanitizedTask = task.trim();

// Basic protection: prevent passing flags as the start of the task
if (sanitizedTask.startsWith("-")) {
    return Promise.resolve({
        output: "Error: Task cannot start with a hyphen.",
        exitCode: 1,
        elapsed: 0,
    });
}

// ... proceed with args.push(sanitizedTask)
```

### Potential Feature Additions
* **Log Inspection:** Add a `/agents-logs <name>` command that allows the user to see the raw `stderr` or the last few lines of `stdout` for a specific agent that encountered an error. This is invaluable for debugging "Black Box" agents.
* **Configuration Schema:** Instead of just `.md` frontmatter, allow for a `config.json` that supports complex tool configuration, which might make parsing more reliable than your current regex-based approach.

Overall, this is a very high-quality extension. The logic is concise, and the TUI feedback loop is excellent. Are you planning on adding persistence for the agent session history (e.g., saving the conversation to a file so it survives a total app restart), or is the temporary `.json` storage sufficient for your use case? context bar
		_ctx.ui.setFooter((_tui, theme, _footerData) => ({
			dispose: () => {},
			invalidate() {},
			render(width: number): string[] {
				const model = _ctx.model?.id || "no-model";
				const usage = _ctx.getContextUsage();
				const pct = usage ? usage.percent : 0;
				const filled = Math.round(pct / 10);
				const bar = "#".repeat(filled) + "-".repeat(10 - filled);

				const left = theme.fg("dim", ` ${model}`) +
					theme.fg("muted", " · ") +
					theme.fg("accent", activeTeamName);
				const right = theme.fg("dim", `[${bar}] ${Math.round(pct)}% `);
				const pad = " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(right)));

				return [truncateToWidth(left + pad + right, width)];
			},
		}));
	});
}

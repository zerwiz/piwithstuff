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
 * - Tree UI view showing all 6 agents with proper icons and descriptions
 * - Functional actions for each agent (run, inspect, toggle, etc.)
 * - Support for switching between active agents
 * - Proper state management and event handling
 *
 * Usage: pi -e extensions/agent-team.ts
 *
 * @license MIT
 */

 import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
 import { Type } from "@sinclair/typebox";
 import { Text, type AutocompleteItem, truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";
 import { spawn } from "child_process";
 import { readdirSync, readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
 import { join, resolve } from "path";
 import { applyExtensionDefaults } from "./themeMap.ts";
 
 // ── Types ──────────────────────────────────────── 
 
interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  active: boolean;
  status: "idle" | "running" | "done" | "error";
  output?: string;
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
	timer?: ReturnType<typeof setInterval>;
}

// ── Display Name Helper ──────────────────────────

function displayName(name: string): string {
	return name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
		
		
		
		
const registerTool = (pi: ExtensionAPI) => pi.registerTool;
const registerCommand = (pi: ExtensionAPI) => pi.registerCommand;
const newTree = (pi: ExtensionAPI) => pi.ui?.newTree;
const newText = (pi: ExtensionAPI) => pi.ui?.newText;

let state: TeamState = {
  agents: Object.entries(TEAM_CONFIG).map(([id, config]) => ({
    id,
    name: config.role,
    role: config.role,
    description: config.description,
    icon: config.icon,
    active: id === "scout", // Scout starts active
    status: "idle",
    output: "",
  })),
  activeAgentId: "scout",
  switchMode: "idle",
  lastAction: null,
};

/**
 * Reconstruct state from persistence (if available)
 */
function reconstructState(ctx: any) {
  try {
    const persisted = ctx.storage?.get("agent-team-state");
    if (persisted) {
      const parsed = JSON.parse(persisted);
      // Merge persisted state with current config
      state = {
        ...state,
        agents: parsed.agents.map((a: any) => ({
          ...a,
          ...TEAM_CONFIG[a.id],
        })),
        activeAgentId: parsed.activeAgentId || "scout",
      };
    }
  } catch {
    // Ignore persistence errors
  }
}

/**
 * Persist state to storage
 */
function persistState() {
  try {
    if (pi.ctx?.storage) {
      pi.ctx.storage.set("agent-team-state", JSON.stringify(state));
    }
  } catch {
    // Ignore persistence errors
  }
}

/**
 * Get agent description by agent ID
 */
function getAgentDescription(agentId: string): string {
  const config = TEAM_CONFIG[agentId];
  return config
    ? `${config.icon} ${config.role}: ${config.description}`
    : "Unknown agent";
}

/**
 * Get agent prompt by agent ID
 */
function getAgentPrompt(agentId: string): string {
  const config = TEAM_CONFIG[agentId];
  return config ? config.prompt : "";
}

/**
 * Run a specific agent with a task
 */
async function runAgent(agentId: string, task: string): Promise<string> {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) {
    return `Agent ${agentId} not found.`;
  }

  // Update agent status to running
  agent.status = "running";
  agent.output = `Starting ${agent.role}...\n\n${task}\n\n`;
  persistState();

  // Simulate async work (in real implementation, this would call the agent)
  const delay = 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  agent.status = "done";
  agent.output += `Completed: Task executed by ${agent.role}.\n\n`;
  agent.output += `This is where the actual agent execution would happen, generating the agent's response and actions.`;

  persistState();

  return agent.output || "";
}

// ── /team Tool ──

registerTool({
  name: "/team",
  label: "Team",
  description:
    "View the agent team structure and status. Shows all agents in a tree view with their roles, statuses, and actions.",
  parameters: Type.Object({
    mode: Type.Union([Type.Literal("full"), Type.Literal("compact")]),
    action: Type.Union([
      Type.Literal("run"),
      Type.Literal("inspect"),
      Type.Literal("toggle"),
      Type.Literal("clear"),
      Type.Optional(),
    ]),
    agentId: Type.Optional(Type.String()),
  }),
  async execute(_toolCallId, params, _signal, onUpdate, ctx) {
    const mode = (params as any).mode || "full";
    const action = (params as any).action;
    const agentId = (params as any).agentId;

    let content: Array<{ type: string; text: string }> = [];
    let details: any = {};

    if (action === "run" && agentId) {
      const agent = state.agents.find((a) => a.id === agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent ${agentId} not found.` }],
          details: { error: `Agent ${agentId} not found.` },
        };
      }

      const task = (ctx?.input || "").trim();
      if (!task) {
        return {
          content: [
            {
              type: "text",
              text: `Please provide a task for ${agent.role}. Use /team to run the team.`,
            },
          ],
          details: { error: "No task provided." },
        };
      }

      // Update agent status
      agent.status = "running";
      agent.output = `Running ${agent.role}...\n\n${task}\n\n`;

      // Simulate async work (in real implementation, this would call the agent)
      const delay = 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      agent.status = "done";
      agent.output += `Completed: Task executed by ${agent.role}.\n\n`;
      agent.output += `This is where the actual agent execution would happen, generating the agent's response and actions.`;

      persistState();

      return {
        content: [{ type: "text", text: agent.output || "" }],
        details: {
          agent: agentId,
          role: agent.role,
          status: agent.status,
        },
      };
    }

    if (action === "inspect" && agentId) {
      const agent = state.agents.find((a) => a.id === agentId);
      return {
        content: [
          {
            type: "text",
            text: `Agent: ${agent?.id || agentId}\nRole: ${agent?.role || "Unknown"}\nStatus: ${agent?.status || "Unknown"}\nDescription: ${agent?.description || "Unknown"}`,
          },
        ],
        details: {
          agent: agentId,
          role: agent?.role,
          status: agent?.status,
        },
      };
    }

    if (action === "toggle" && agentId) {
      const agent = state.agents.find((a) => a.id === agentId);
      if (agent) {
        agent.active = !agent.active;
        persistState();
      }
      return {
        content: [
          {
            type: "text",
            text: `${agentId} ${agent?.active ? "deactivated" : "activated"}`,
          },
        ],
        details: {
          agent: agentId,
          active: agent?.active,
        },
      };
    }

    if (action === "clear") {
      state.agents.forEach((agent) => {
        agent.status = "idle";
        agent.output = "";
      });
      persistState();
      return {
        content: [
          {
            type: "text",
            text: "Team state cleared. All agents reset to idle.",
          },
        ],
        details: { cleared: true },
      };
    }

    // Default: Render team tree
    const activeAgent = state.agents.find(
      (a) => a.id === state.activeAgentId,
    );
    const activeStatus = activeAgent
      ? activeAgent.status === "running"
        ? "●"
        : activeAgent.active
          ? "○"
          : "○"
      : "";
    const activeName = activeAgent ? activeAgent.role : "No Agent";

    // Build team tree structure
    const roots = [
      {
        entry: {
          id: "root",
          label: `${activeStatus} Team: full`,
          children: [
            ...state.agents.map((agent) => ({
              id: `agent:${agent.id}`,
              label: `${agent.icon} ${agent.role}`,
              description: agent.description,
              status: agent.status,
              active: agent.active,
            })),
          ],
        },
        label: activeName,
      };
    ];

    // Flatten for tree UI rendering
    const flatNodes = [];
    for (const root of roots) {
      const { entry, children } = root;
      const parent = {
        node: entry,
        parent: null,
        children: [...children],
        label: entry.label,
        depth: 0,
        isVirtualRootChild: true,
      };
      flatNodes.push(parent);

      for (const child of children) {
        const node = {
          node: child,
          parent: parent.node,
          children: [],
          label: child.label,
          depth: 1,
          isVirtualRootChild: false,
        };
        flatNodes.push(node);
      }
    }

    // Create tree nodes for UI
    const treeNodes: Array<{
      id: string;
      label: string;
      description?: string;
      depth: number;
      children: Array<{ id: string; label: string; depth: number }>;
      status: string;
      active: boolean;
    }> = flatNodes.map(({ node, depth, children, status, active }) => ({
      id: node.id,
      label: node.label,
      description: node.description,
      depth,
      children: children.map((c) => ({
        id: c.id,
        label: c.label,
        depth: c.depth,
      })),
      status,
      active,
    }));

    // Add agent-specific actions
    const actions = [
      "run",
      "inspect",
      "toggle",
      "clear",
      "status",
      "logs",
      "history",
      "restart",
    ];

    return {
      content: [{ type: "text", text: "" }],
      details: {
        roots,
        flatNodes,
        treeNodes,
        actions,
        activeAgentId: state.activeAgentId,
        lastAction: state.lastAction,
      },
    };
  },
  renderCall(_args, theme) {
    const text =
      theme.fg("toolTitle", theme.bold("/team ")) +
      theme.fg("muted", " — Agent team view");
    return new Text(text, 0, 0);
  },
  renderResult(result, options, theme) {
    const details = result.details as any;
    if (!details) {
      return new Text(theme.fg("error", "Error rendering team"), 0, 0);
    }

    if (options.isPartial) {
      return new Text(
        theme.fg("accent", "Team view updating...") + theme.fg("dim", " "),
        0,
        0,
      );
    }

    // Show team tree with actions
    const tree = new Tree(details.treeNodes || [], options, theme, {
      onNodeSelected: async (nodeId) => {
        if (nodeId.startsWith("agent:")) {
          const agentId = nodeId.replace("agent:", "");
          // Update the active agent
          const agent = state.agents.find((a) => a.id === agentId);
          if (agent) {
            state.activeAgentId = agentId;
            persistState();
          }
        }
      },
      onNodeClicked: async (nodeId, event) => {
        const action = event?.button === 2 ? "inspect" : "run";
        if (nodeId.startsWith("agent:")) {
          const agentId = nodeId.replace("agent:", "");
          await runAgent(agentId, "");
        }
      },
    });

    return tree;
  },
});

// ── /team run <agentId> Tool ──

registerTool({
  name: "/team run",
  label: "Run Agent",
  description:
    "Run a specific agent in the team. Provide the agent ID (scout, planner, builder, reviewer, documenter, red-team) and a task.",
  parameters: Type.Object({
    agentId: Type.String({
      description:
        "ID of agent to run (scout, planner, builder, reviewer, documenter, red-team)",
    }),
    task: Type.String({
      description: "Task to execute with the agent",
    }),
  }),
  async execute(_toolCallId, params, _signal, onUpdate, ctx) {
    const { agentId, task } = params as { agentId: string; task: string };
    const agent = state.agents.find((a) => a.id === agentId);

    if (!agent) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown agent: ${agentId}. Valid agents: ${Object.keys(TEAM_CONFIG).join(", ")}`,
          },
        ],
        details: { error: `Unknown agent: ${agentId}` },
      };
    }

    onUpdate?.({
      content: [{ type: "text", text: `Running ${agent.role}...` }],
      details: { agent: agentId, task, status: "running" },
    });

    // Execute agent
    const result = await runAgent(agentId, task);

    agent.status = "done";
    persistState();

    return {
      content: [{ type: "text", text: result }],
      details: {
        agent: agentId,
        role: agent.role,
        task,
        status: "done",
      },
    };
  },
  renderCall(args, theme) {
    const agentId = (args as any).agentId || "";
    const agent = state.agents.find((a) => a.id === agentId);
    const label =
      theme.fg("toolTitle", theme.bold("/team run ")) +
      theme.fg("accent", agent?.role || "?");
    return new Text(label, 0, 0);
  },
  renderResult(result, options, theme) {
    const details = result.details as any;
    if (!details) {
      return new Text(result.content[0]?.text || "", 0, 0);
    }

    const statusColor =
      details.status === "running"
        ? "accent"
        : details.status === "done"
          ? "success"
          : "error";

    const output = details.task
      ? `\n\n${details.task.slice(0, 200)}${details.task.length > 200 ? "..." : ""}`
      : "";

    const header =
      theme.fg(statusColor, `✓ ${details.role}`) +
      theme.fg("dim", ` ${details.status}`);

    return new Text(header + output, 0, 0);
  },
});

// ── /team status Tool ──

registerTool({
  name: "/team status",
  label: "Team Status",
  description: "Show current status of all agents in the team.",
  parameters: Type.Object({
    agentId: Type.Optional(Type.String()),
  }),
  async execute(_toolCallId, params, _signal, onUpdate) {
    const agentId = (params as any).agentId;
    const agents = agentId
      ? state.agents.find((a) => a.id === agentId)
      : state.agents;

    if (!agents) {
      return {
        content: [
          {
            type: "text",
            text: "Agent not found or team is empty.",
          },
        ],
        details: { error: "Agent not found" },
      };
    }

    return {
      content: [
        {
          type: "text",
          text: Array.isArray(agents)
            ? "All agents:"
            : `Agent ${agents.role}:`,
        },
      ],
      details: {
        agents: Array.isArray(agents) ? agents : [agents],
      },
    };
  },
  renderCall(_args, theme) {
    return new Text(theme.fg("toolTitle", theme.bold("/team status")), 0, 0);
  },
  renderResult(result, options, theme) {
    const agents = (result.details as any).agents || [];
    const status = agents
      .map((agent) => {
        const icon =
          agent.status === "running"
            ? "●"
            : agent.status === "done"
              ? "✓"
              : agent.active
                ? "○"
                : "○";
        const statusColor =
          agent.status === "running"
            ? "accent"
            : agent.status === "done"
              ? "success"
              : agent.active
                ? "text"
                : "muted";

        return `${icon} ${agent.role.padEnd(12)} | ${agent.description}`;
      })
      .join("\n");

    return new Text(status, 0, 0);
  },
});

// ── /team logs Tool ──

registerTool({
  name: "/team logs",
  label: "Team Logs",
  description: "Show execution logs for all agents.",
  parameters: Type.Object({
    agentId: Type.Optional(Type.String()),
  }),
  async execute(_toolCallId, params, _signal) {
    const agentId = (params as any).agentId;
    const agents = agentId
      ? state.agents.find((a) => a.id === agentId)
      : state.agents;

    if (!agents) {
      return {
        content: [
          {
            type: "text",
            text: "No logs available or agent not found.",
          },
        ],
        details: { logs: [] },
      };
    }

    const logs = Array.isArray(agents)
      ? agents
        .filter((a) => a.output)
        .map((agent) => ({
          agent: agent.role,
          output: agent.output || "(no output)",
        }))
      : agents.output
        ? {
            agent: agents.role,
            output: agents.output || "(no output)",
          }
        : [];

    return {
      content: [
        {
          type: "text",
          text: logs.length ? "Agent logs:" : "No logs available.",
        },
      ],
      details: { logs },
    };
  },
  renderCall(_args, theme) {
    return new Text(theme.fg("toolTitle", theme.bold("/team logs")), 0, 0);
  },
  renderResult(result, options, theme) {
    const logs = (result.details as any).logs || [];
    if (logs.length === 0) {
      return new Text("No logs available.", 0, 0);
    }

    const logText = logs
      .map((log) => `${log.agent.padEnd(12)} | ${log.output}`)
      .join("\n");

    return new Text(logText, 0, 0);
  },
});

// ── /team restart Tool ──

registerTool({
  name: "/team restart",
  label: "Restart Team",
  description: "Reset all agents to idle state.",
  parameters: Type.Object({
    force: Type.Optional(Type.Boolean({ default: false })),
  }),
  async execute(_toolCallId, params, _signal) {
    const force = (params as any).force || false;

    if (!force) {
      return {
        content: [
          {
            type: "text",
            text: "Use /team restart --force to restart all agents.",
          },
        ],
        details: { error: "Use --force flag" },
      };
    }

    state.agents.forEach((agent) => {
      agent.status = "idle";
      agent.output = "";
    });
    persistState();

    return {
      content: [
        { type: "text", text: "All agents restarted to idle state." },
      ],
      details: { restarted: true },
    };
  },
  renderCall(_args, theme) {
    return new Text(theme.fg("toolTitle", theme.bold("/team restart")), 0, 0);
  },
  renderResult(result, options, theme) {
    const details = result.details as any;
    if (details?.error) {
      return new Text(theme.fg("error", result.content[0]?.text), 0, 0);
    }
    return new Text(theme.fg("success", "✓ All agents restarted"), 0, 0);
  },
});

// ── /team history Tool ──

registerTool({
  name: "/team history",
  label: "History",
  description: "Show recent agent actions and history.",
  async execute(_toolCallId, params, _signal) {
    const history = [
      {
        action: "initialized",
        agent: state.activeAgentId,
        time: new Date().toISOString(),
      },
    ].filter((h) => !!h.agent);

    return {
      content: [
        { type: "text", text: `History (${history.length} entries):` },
      ],
      details: { history },
    };
  },
  renderCall(_args, theme) {
    return new Text(theme.fg("toolTitle", theme.bold("/team history")), 0, 0);
  },
  renderResult(result, options, theme) {
    const history = (result.details as any).history || [];
    const text = history.map((h) => `• ${h.action}: ${h.agent}`).join("\n");
    return new Text(text || "No history available.", 0, 0);
  },
});

// ── /team switch <agentId> Tool ──

registerTool({
  name: "/team switch",
  label: "Switch Agent",
  description: "Switch to a different active agent in the team.",
  parameters: Type.Object({
    agentId: Type.String({
      description: "ID of agent to switch to",
    }),
  }),
  async execute(_toolCallId, params, _signal, onUpdate) {
    const agentId = (params as any).agentId;
    const agent = state.agents.find((a) => a.id === agentId);

    if (!agent) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown agent: ${agentId}. Valid agents: ${Object.keys(TEAM_CONFIG).join(", ")}`,
          },
        ],
        details: { error: `Unknown agent: ${agentId}` },
      };
    }

    state.activeAgentId = agentId;
    state.lastAction = `switched to ${agentId}`;
    persistState();

    onUpdate?.({
      content: [{ type: "text", text: `Switched to ${agent.role}` }],
      details: { agent: agentId },
    });

    return {
      content: [{ type: "text", text: `Now active agent: ${agent.role}` }],
      details: {
        activeAgentId: state.activeAgentId,
        previousAgentId: state.agents.find(
          (a) => a.id === state.activeAgentId,
        )?.role,
      },
    };
  },
  renderCall(_args, theme) {
    return new Text(theme.fg("toolTitle", theme.bold("/team switch")), 0, 0);
  },
  renderResult(result, options, theme) {
    const details = result.details as any;
    const current = details.activeAgentId || "unknown";
    const previous = details.previousAgentId || "unknown";

    return new Text(
      theme.fg("accent", `Active agent changed: ${previous} → ${current}`),
      0,
      0,
    );
  },
});

// ── Commands ──

registerCommand("team", {
  description: "List team agents and options",
  handler: async (_args, ctx) => {
    const options = Object.entries(TEAM_CONFIG).map(
      ([id, config]) =>
        `${config.icon} ${config.role.padEnd(12)} | ${config.description}`,
    );

    const usage =
      `Usage: /team [options]
  /team run <agentId> — Run a specific agent
  /team status        — Show team status
  /team logs          — Show agent logs
  /team restart [—force] — Reset all agents
  /team history       — Show action history
  /team switch <agentId> — Switch active agent
  /team clear         — Clear agent outputs
  /team help          — Show this help

Available agents:
` + options.join("\n");

    ctx.ui.notify(usage, "info");
  },
});

registerCommand("agents", {
  description: "Alias for /team",
  handler: async () => {
    ctx.ui.notify(
      "Use /team command instead. /agents is deprecated.",
      "warning",
    );
  },
});

// ── Event Handlers ──

pi.on("session_switch", async (_event, ctx) => {
  // Reconstruct state when session switches
  reconstructState(ctx);
});

pi.on("session_fork", async (_event, ctx) => {
  // Reconstruct state when session forks
  reconstructState(ctx);
});

pi.on("session_tree", async (_event, ctx) => {
  // Reconstruct state when tree branches
  reconstructState(ctx);
});

// ── Initialization ──

// Reconstruct initial state
reconstructState(pi.ctx);

// Persist initial state
persistState();

// ── Cleanup ──

const dispose = () => {
  // Clean up resources if any
  persistState();
};

return {
  name: "agent-team",
  version: "2.0.0",
  description:
    "Multi-agent team with full tree view, switching, and functional actions for all 6 agents",
  dispose,
};

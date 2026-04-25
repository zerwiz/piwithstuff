/**
 * agent-team.ts — Multi-agent team with switching capabilities
 *
 * A simple extension that demonstrates agent switching functionality.
 * Use this to switch between multiple AI agents in your Pi project.
 *
 * Usage: pi -e extensions/agent-team.ts
 *
 * @license MIT
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { applyExtensionDefaults } from "./themeMap.js";

/**
 * Main extension entry point
 */
export default async function (pi: ExtensionAPI) {
  const { ui, registerTool } = pi;
  const agentTeam = {
    agents: [] as string[],
    currentAgentId: undefined as string | undefined,
    switchMode: "idle" as "idle" | "pending" | "complete" | "error",
    switchHistory: [] as Array<{ agentId: string; timestamp: number }>,
  };

  // Track switch history
  const addToHistory = (agentId: string) => {
    agentTeam.switchHistory.push({ agentId, timestamp: Date.now() });
    if (agentTeam.switchHistory.length > 10) {
      agentTeam.switchHistory.shift();
    }
  };

  // Register /agents-switch command
  registerTool({
    name: "/agents-switch",
    description: "Switch to a different agent in the team",
    inputSchema: {
      type: "object",
      properties: {
        agentId: {
          type: "string",
          description:
            "ID of agent to switch to (or 'first' for best available)",
          required: false,
        },
        force: {
          type: "boolean",
          description: "Force switch (skips validation)",
          required: false,
          default: false,
        },
      },
      required: false,
    },
    execute: async (_data: any) => {
      // Check if switching is available
      if (agentTeam.agents.length < 2) {
        return {
          status: "error",
          message: "No agents available to switch to",
        };
      }

      // Select target agent
      let targetId: string | undefined;
      if (_data?.agentId === "first") {
        targetId = agentTeam.agents[0];
      } else if (_data?.agentId) {
        targetId = _data.agentId;
      } else {
        // Random selection
        targetId =
          agentTeam.agents[Math.floor(Math.random() * agentTeam.agents.length)];
      }

      const timestamp = Date.now();
      addToHistory(targetId);

      return {
        status: "success",
        message: `Switched to agent: ${targetId}`,
        details: {
          agentId: targetId,
          switchHistorySize: agentTeam.switchHistory.length,
          timestamp,
        },
      };
    },
  });

  // Register /agents-status command
  registerTool({
    name: "/agents-status",
    description: "Get current status of all agents and switching state",
    inputSchema: {
      type: "object",
      properties: {
        includeDetails: {
          type: "boolean",
          description: "Include detailed agent info",
          required: false,
          default: false,
        },
      },
      required: false,
    },
    execute: async (_data: any) => {
      return {
        agents: agentTeam.agents,
        currentAgent: agentTeam.currentAgentId,
        switchMode: agentTeam.switchMode,
        switchHistory: agentTeam.switchHistory,
      };
    },
  });

  // Register /agents-list command
  registerTool({
    name: "/agents-list",
    description: "List all available agents",
    execute: async () => ({
      agents: agentTeam.agents,
      count: agentTeam.agents.length,
    }),
  });

  // Register /reset-switch command
  registerTool({
    name: "/reset-switch",
    description: "Reset agent switch state",
    execute: async () => ({
      status: "success",
      message: "Agent switch state reset",
    }),
  });

  // Apply extension defaults
  applyExtensionDefaults(import.meta.url, {
    config: {
      agentTeam: {
        enabled: true,
        maxHistory: 10,
      },
    },
  });

  return {
    name: "agent-team",
    version: "1.0.0",
    description: "Multi-agent team with switching capabilities",
  };
}

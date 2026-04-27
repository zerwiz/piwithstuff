/**
 * Agent Catalog — Lists all loaded agents (team-aware)
 *
 * This system prompt is only applied to the PRIMARY agent (e.g. `planner`).
 * It describes the current team and available agents.
 *
 * Usage: pi -e agents/catalog.ts
 */

import { parseAgentFile, scanAgentDirs } from "./agents/util";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, readdirSync, readFileSync, join } from "fs";
import { resolve } from "path";

// ── System Prompt Template ───────────────────────────────────────────────────

const systemPromptTemplate = `You are a coding agent in the piwithstuff system. You are part of a team working together to accomplish tasks.

## Your Team
- You are currently assigned to a team of specialized agents.
- Each agent has access to specific tools relevant to their role.
- Collaborate with your team members to complete complex tasks.

## Current Team Members
${teamPrompt}

## How to Work
- Work with your team to accomplish tasks
- Use the tools available to you effectively
- Collaborate with other agents when appropriate
- Communicate clearly about progress and blockers

## Available Tools
See the tools listed above for what you can access.

## When to Use Tools
- Use the most appropriate tool for the task at hand
- Prefer specialized tools when available (e.g., use \`read\` for file reading, \`grep\` for searching)
- Be mindful of tool limits (e.g., \`read\` truncates to 2000 lines)
- Use \`find\` to locate files before trying to read them
- If a tool fails, try an alternative approach or different tool

Remember to use your team's strengths effectively!
`;

function loadAgentsFromDirs(cwd: string): Map<string, any[]> {
  const agents = new Map<string, any[]>();
  const dirs = [
    join(cwd, "agents"),
    join(cwd, ".claude", "agents"),
    join(cwd, ".pi", "agents"),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    try {
      for (const file of readdirSync(dir)) {
        if (!file.endsWith(".md")) continue;
        const fullPath = resolve(dir, file);
        const agentsDef = parseAgentFile(fullPath);
        if (agentsDef && agentsDef.name) {
          // Store each agent's tools
          const tools: any[] = [];
          for (const tool of agentsDef.tools.split(",")) {
            tools.push({
              name: tool.trim(),
              description: `Built-in ${tool.trim()}`,
            });
          }
          agents.set(agentsDef.name, tools);
        }
      }
    } catch {}
  }

  return agents;
}

export default function (pi: ExtensionAPI) {
  const agentDefs = loadAgentsFromDirs(pi.cwd);

  // Build team prompt
  let teamPrompt = "";
  if (agentDefs.size > 0) {
    for (const [name, tools] of agentDefs) {
      const toolNames = tools.map((t) => t.name).join(", ");
      teamPrompt += `- \`${name}\` — ${tools.length} tools: ${toolNames}\n`;
    }
    teamPrompt = `\n## Current Team:\n${teamPrompt}`;
  }

  const prompt = systemPromptTemplate.replace(
    "${teamPrompt}",
    teamPrompt || "",
  );

  pi.on("agent_start", async (_e, ctx) => {
    // Only apply if agent name matches expected catalog agents
    const agentName = ctx.agent.name;
    if (agentName) {
      const toolList = agentDefs.get(agentName.toLowerCase()) || [];
      ctx.ui.setStatus("system-prompt", prompt);
    }
  });
}

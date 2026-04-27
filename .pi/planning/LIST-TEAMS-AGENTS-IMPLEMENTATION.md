# Implementation Plan: List Teams and Agents Commands

## Overview
This document outlines the implementation of three new commands/tools for the agent-team extension:
1. `/list_teams` - Lists all teams from teams.yaml
2. `/list_agents` - Lists all agents from agents.yaml  
3. `/list_active_team` - Lists currently loaded agents in the active team

These commands will provide users with visibility into the available specialist resources and current team configuration.

## Files to Modify
- `/home/zerwiz/piwithstuff/extensions/agent-team.ts` - Main extension file

## Implementation Details

### 1. Parse Agents YAML Function
Add a helper function to parse the agents.yaml file format:

```typescript
/**
 * Robust YAML-lite parser for agents.yaml.
 */
function parseAgentsYaml(raw: string): Record<string, { name: string; description: string; tools: string }> {
  const agents: Record<string, { name: string; description: string; tools: string }> = {};
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
      agents[current][keyMatch[1] as "name" | "description" | "tools"] = keyMatch[2].trim();
    }
  }
  return agents;
}
```

### 2. List Teams Tool
Create a tool that reads teams.yaml and displays all teams with active team indicator:

```typescript
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
      new Text(theme.fg("toolTitle", theme.bold("list_teams")) + theme.fg("dim", " (from teams.yaml)"), 0, 0),
  });
```

### 3. List Agents Tool
Create a tool that reads agents.yaml and displays all agents with active indicators:

```typescript
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
      new Text(theme.fg("toolTitle", theme.bold("list_agents")) + theme.fg("dim", " (from agents.yaml)"), 0, 0),
  });
```

### 4. List Active Team Tool
Create a tool that shows currently loaded agents in the active team:

```typescript
pi.registerTool({
    name: "list_active_team",
    label: "List Active Team",
    description: "List agents currently loaded in the active team.",
    parameters: Type.Object({}),
    async execute(_id, _params, _sig, _upd, _ctx) {
      const members = Array.from(agentStates.values()).map(s => {
        const model = s.def.model ? ` (${s.def.model})` : "";
        return `- **${s.def.name}**${model} — ${s.def.description} [${s.status}]`;
      }).join("\n");

      return {
        content: [{
          type: "text",
          text: `### Active Team: ${activeTeamName}\n\n${members || "No agents loaded."}`
        }]
      };
    },
    renderCall: (_args, theme) =>
      new Text(theme.fg("toolTitle", theme.bold("list_active_team")) + theme.fg("dim", " (loaded agents)"), 0, 0),
  });
```

### 5. Update Active Tools
Add the new tools to the active tools list:

```typescript
pi.setActiveTools(["dispatch_agent", "manage_team", "switch_team", "list_active_team", "list_teams", "list_agents", "save_memory"]);
```

## Commands Registration
Optionally, register these as slash commands for easier access:

```typescript
pi.registerCommand("list-teams", {
    description: "List all available teams",
    handler: async (_args, ctx) => {
      // Could invoke the list_teams tool internally
      ctx.ui.notify("Use /list_teams command", "info");
    }
});

pi.registerCommand("list-agents", {
    description: "List all available agents", 
    handler: async (_args, ctx) => {
      // Could invoke the list_agents tool internally
      ctx.ui.notify("Use /list_agents command", "info");
    }
});

pi.registerCommand("list-active-team", {
    description: "List currently loaded agents",
    handler: async (_args, ctx) => {
      // Could invoke the list_active_team tool internally
      ctx.ui.notify("Use /list_active_team command", "info");
    }
});
```

## Testing Plan
1. Verify the extension compiles without errors
2. Test each tool individually:
   - `/list_teams` should show all teams from teams.yaml
   - `/list_agents` should show all agents from agents.yaml
   - `/list_active_team` should show currently loaded agents
3. Test switching teams and verify the indicators update correctly
4. Verify the tools appear in the agent's available tools list

## Dependencies
- Uses existing `parseTeamsYaml` function
- Uses existing `safeReadFile` function
- Uses existing `agentStates` and `teams` state variables
- Uses existing `activeTeamName` variable

## Estimated Effort
- Implementation: 2-3 hours
- Testing: 1-2 hours
- Documentation: 30 minutes

## Notes
- The implementation follows the existing patterns in the agent-team.ts file
- Error handling uses the existing safeReadFile utility
- Output formatting follows the existing style in the extension
- All tools are read-only and safe to execute
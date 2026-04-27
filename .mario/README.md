# Mario Agents Extension Setup ✓

## Overview
This is a team-aware Pi agent system where agents are organized into teams.

## Setup
1. The `agent-team.ts` extension is automatically applied via `.pi/extensions/`
2. Define your team in `.pi/agents/teams.yaml`
3. Add specialist agents to `.claude/agents/` or `.pi/agents/` in markdown format
4. Agents are automatically discovered and catalogued
5. The system prompt is applied to primary agents (planner, etc.)

## Commands
- `/agents-team` — Switch active team
- `/agents-list` — List active agents and status
- `/agents-team scout` — Quick team switch to scout

## Example Team (`.pi/agents/teams.yaml`)
```yaml
scout:
  - scout
  - documenter
  - session-manager

plan-build:
  - planner
  - developer
  - reviewer
  - session-manager
```

## Adding Agents
Create markdown files in `.claude/agents/` or `.pi/agents/` with frontmatter:
```markdown
---
name: custom-agent
description: Your custom agent here
tools: read,grep,find,ls,write_file,write_file_async,execute
---

Your system prompt goes here...
```

## Usage
```bash
pi -c .pi/agents/teams.yaml      # Specify team
pi -e extensions/agent-team.ts   # Enable team system
```

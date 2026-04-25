# PI Agent System - Session Management Guide

## Quick Answers

### 1. Where Should Agents Be Located?

Agents are stored in **`/home/zerwiz/piwithstuff/.pi/agents/`**

- Individual agent definitions: `{agent-name}.{md|yaml|ts}`
- Team configurations: `teams.yaml`
- Agent chain definitions: `{name}.yaml`

### 2. Agent Definition File Format

Agent files (`.md`, `.yaml`, `.ts`) have this structure:

```yaml
---
name: agent-name
description: Brief description of agent purpose
models: opus
color: {color}
skills:
  - skill-one
  - skill-two
---

# Title

## Purpose
Agent role and responsibilities

## Workflow
Step-by-step process for agent operation

## Capabilities
List of what the agent can do
```

**Frontmatter (YAML between `---`):**
- `name`: Agent identifier
- `description`: Purpose summary
- `models`: Model configuration (e.g., "opus")
- `color`: Visual identifier
- `skills`: Array of skill names

**Markdown Body:**
- Documentation for agent behavior
- Workflow instructions
- Capability descriptions

### 3. How to Define Tools and Capabilities

**Tools (Skills)** are referenced by name in the `skills` array.

Each skill should:
1. Be defined in `/home/zerwiz/piwithstuff/.pi/skills/` (if exists)
2. Be available as a tool call in the agent workflow
3. Reference existing functionality or system capabilities

**Agent Chains** use multi-agent workflows:

```yaml
full-review:
  description: "End-to-end pipeline"
  steps:
    - agent: scout
      prompt: "Explore: $INPUT"
    - agent: planner
      prompt: "Plan based on exploration:\n$INPUT"
    - agent: builder
      prompt: "Implement this plan:\n$INPUT"
    - agent: reviewer
      prompt: "Review the implementation:\n$INPUT"
```

**Prompt Variables:**
- `$INPUT` - Original user input
- `$SESSION_ID` - Current session ID
- `$ORIGINAL` - Original request (in multi-turn flows)

### 4. Directory Structure

```
/home/zerwiz/piwithstuff/.pi/
├── agents/
│   ├── scout.md                    # Individual agent definitions
│   ├── planner.md
│   ├── builder.md
│   ├── reviewer.md
│   ├── documenter.md
│   ├── red-team.md
│   ├── session-manager.md          # Session management agent
│   ├── teams.yaml                  # Team configurations
│   └── agent-chain.yaml            # Agent chain definitions
├── agent-sessions/                   # Session files (JSONL format)
│   └── {session-id}.json            # Or builder.json
├── sessions/                          # Alternative session storage
├── skills/                            # Tool definitions (if used)
├── docs/                              # Documentation
├── README.md                         # Main project readme
└── settings.json                     # Global settings
```

---

## Session Management Agent Created

I've created **`session-manager.md`** and **`session-manager.yaml`** that can:

- **List all sessions** - Enumerate available sessions with metadata
- **Query session data** - Retrieve specific session content
- **Manage session lifecycle** - Activate, deactivate, export sessions
- **Filter sessions** - Filter by criteria (date, status, etc.)
- **Track usage** - Monitor session statistics

### Session Data Format

Sessions are stored as **JSONL** files in `/home/zerwiz/piwithstuff/.pi/agent-sessions/`:

```json
{"type":"session","id":"xxx","timestamp":"2026-04-17T..."}
{"type":"message","id":"xxx","message":{"role":"user","content":[]}}
{"type":"message","id":"xxx","message":{"role":"assistant","content":[]}}
{"type":"toolCall","id":"xxx","name":"tool-name","arguments":{}}
{"type":"toolResult","toolCallId":"xxx","content":[]}
```

**Key fields:**
- `type`: "session" or "message" or "toolCall"
- `id`: Unique identifier
- `timestamp`: ISO timestamp
- `message`: User/assistant message content
- `toolCall`: Tool invocation
- `toolResult`: Tool response

---

## Next Steps

1. **Register agent**: Add `session-manager` to `teams.yaml`
2. **Create skills**: Define session tools in skills directory
3. **Configure workflows**: Add session management to agent chains
4. **Initialize sessions**: Run first session and store as JSONL

---

## Example Usage

```bash
# List sessions
session-manager list

# Query session
session-manager query --session-id builder

# Manage session
session-manager manage --action export --output sessions-export.jsonl
```


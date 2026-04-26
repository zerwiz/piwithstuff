# Adding New Agents

To ensure a new specialist agent is fully adopted by the Pi orchestrator system (Team, Chain, and Subagent extensions), follow these steps.

## 1. Create the Agent Definition (.md)

Create a Markdown file in one of these directories:
- `./agents/` (Project-specific)
- `./.pi/agents/` (System-standard)
- `~/.pi/agents/` (Global)

### File Format
The file must include YAML frontmatter and a System Prompt.

**Example: `agents/security-expert.md`**
```markdown
---
name: security-expert
description: Specialized in vulnerability scanning and security audits.
tools: read, grep, bash, find
---
You are a Security Expert. Your goal is to identify security flaws in code.
You have access to the codebase and can run non-destructive audit commands.
Always prioritize OWASP standards.
```

### Frontmatter Fields:
- `name`: (Required) The unique ID used for dispatching.
- `description`: (Required) Used by the dispatcher to decide when to use this agent.
- `tools`: (Optional) Comma-separated list of tools. Defaults to `read,grep,find,ls`.

---

## 2. Add to Teams (.pi/agents/teams.yaml)

To make the agent part of a selectable group in the **Agent Team** UI, add its name to a category in your teams configuration.

```yaml
security-ops:
  - scout
  - planner
  - security-expert # Your new agent
```

*Note: The dispatcher can still use `manage_team` to add agents dynamically even if they aren't in the YAML.*

---

## 3. Add to Pipelines (.pi/agents/agent-chain.yaml)

If this agent should be part of a sequential workflow, add it as a step in a chain.

```yaml
audit-flow:
  description: "Complete security audit pipeline"
  steps:
    - agent: scout
      prompt: "Map the authentication logic in $INPUT"
    - agent: security-expert
      prompt: "Perform a deep audit on the files found by scout: $INPUT"
```

---

## 4. Memory Integration

The system automatically creates a persistent memory directory for your agent at:
`.pi/agent-memory/<agent-name>/`

- If the agent has `write`, `edit`, or `bash` tools, it will have **Read/Write** access to its memory.
- Otherwise, it will have **Read-Only** access.
- Knowledge persists across all extensions (Team, Chain, and Subagents).

---

## 5. Security & Damage Control

If your agent uses `bash` or `write` tools, ensure it is aware of the **Damage Control** rules:
- It cannot write outside the project root (if Isolation is active).
- It will require your permission for any `rm` (deletion) commands.
- It is blocked from accessing sensitive files like `.env`.

---

## 6. Verification

To confirm the system has adopted your agent:
1. Run `/agents-reload` in the chat to refresh YAML configs.
2. Run `/agents-list` to see if your agent appears in the registry.
3. Try a direct dispatch: `subagent_create({ task: "security-expert: audit package.json" })`

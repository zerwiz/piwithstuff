---
description: Fully integrate new agents into the Pi orchestrator system using the Universal Agent Template.
---
# Skill: Agent Adoption

This skill provides the protocol for fully integrating a new agent into the Pi orchestrator system using the Universal Agent Template.

## Adoption Workflow

1.  **Read Template:** Load `.pi/agents/agenttemplate.md` to use as the structural blueprint.
2.  **Generate Definition:** Create the agent's `.md` file in `agents/` or `.pi/agents/`.
    *   **YAML Header:** Include `name`, `description`, `models`, and `tools`.
    *   **Protocols:** MUST include "Mandatory Operational Protocol", "Strict Edit Protocol", and "Termination Protocol".
    *   **Signals:** Use `[SIGNAL_COMPLETE]` for internal task completion and `[AGENT_ADOPTION_COMPLETE]` for the builder's final output.
3.  **Team Registration:** Append the agent's name to the appropriate team(s) in `.pi/agents/teams.yaml`.
4.  **Pipeline Integration:** If the agent is part of a workflow, add it to `.pi/agents/agent-chain.yaml` or `.pi/agents/session-manager.yaml`.
5.  **Validation:**
    *   Run `/agents-reload` to verify the system picks up the new config.
    *   Confirm registration with `/agents-list`.

## Strict Template Rules
- **Atomic Execution:** Only one agent adoption per run.
- **Forbidden Overwrites:** Never overwrite existing agent files unless explicitly requested.
- **Backup Rule:** Follow the "The Backup & Git Rule" from the template if modifying core system files.
- **Final Signal:** Output `[AGENT_ADOPTION_COMPLETE]` only after the file is written AND the YAMLs are updated.

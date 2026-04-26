---
name: planner
description: Architecture and implementation planning
models: 
tools: read,grep,find,ls,write
---

You are the Planning agent. Your objective is to design implementation strategies that are grounded in reality, risk-aware, and actionable.

## MISSION: MODEL CONFIGURATION FEATURE IMPLEMENTATION PLAN

## Overview
Implement per-agent model specification in the agent-team.ts dispatcher system, allowing each specialist agent to define its own LLM model in its markdown frontmatter, overriding the default model inherited from the parent Pi session.

## Current State Analysis

**Existing Implementation:**
- `extensions/agent-team.ts:694-696` determines model at dispatch time:
  ```typescript
  const model = ctx.model
    ? `${ctx.model.provider}/${ctx.model.id}`
    : "openrouter/google/gemini-3-flash-preview";
  ```
- `AgentDef` interface (line 49-56) has: `name`, `description`, `tools`, `systemPrompt`, `file`
- `parseAgentFile` (line 299-324) reads YAML frontmatter but does NOT extract a `models` field
- Agent files like `.pi/agents/developer.md`, `planner.md`, `scout.md` already have `models:` fields (empty or populated) in their frontmatter

**Target State:**
- Each agent can specify `models:` in its frontmatter (string value)
- If specified, dispatcher uses that model string directly
- If absent/empty, falls back to parent session model
- The `models` field is optional for backward compatibility

## Step-by-Step Implementation Plan

### Phase 1: Core Extension Modifications
- **Task 1.1:** Add `models?: string` to `AgentDef` interface at line 53
- **Task 1.2:** Update `parseAgentFile` to read `frontmatter.models` and include in AgentDef return object
- **Task 1.3:** Modify `dispatchAgent` model selection logic (lines 696-700) to:
  1. Check `state.def.models?.trim()` first
  2. Fall back to `ctx.model` if not set
  3. Fall back to default if neither available

**Validation:**
- Ensure TypeScript compilation succeeds (`tsc --noEmit`)
- Verify agents without `models` field still work (backward compatibility)
- Verify agents with `models: "nemotron-cascade-2:30b"` use that exact model string

### Phase 2: Agent File Model Population
- **Task 2.1:** Review all `.pi/agents/*.md` files for existing `models:` frontmatter
- **Task 2.2:** For agents with empty `models:` (like `developer.md` line 4), populate with appropriate model strings based on agent role
  - Developer/Coder: Code-specialized model (e.g., `nemotron-cascade-2:30b` or maintainer's preference)
  - Scout/Explorer: Fast reasoning model
  - Reviewer: Balanced reasoning
  - Documenter: Long-context model
- **Task 2.3:** Confirm `planner.md` and `scout.md` already have `models: nemotron-cascade-2:30b`

**Decision Point:** Actual model assignment requires user input on which model strings to use per agent type. For now, the field can be empty and inherit parent context.

### Phase 3: Integration Testing
- **Task 3.1:** Run `pi -e extensions/agent-team.ts` and switch to a team
- **Task 3.2:** Dispatch an agent with explicit model and verify subprocess receives `--model` flag correctly
- **Task 3.3:** Dispatch an agent without explicit model and verify it uses parent's model
- **Task 3.4:** Check session files in `.pi/agent-sessions/` to confirm model recorded in logs

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Model string format mismatch (parent vs child) | High | Low | Use same `provider/id` format; validate with existing default pattern |
| Agent file frontmatter parsing failure | Medium | Low | `parseAgentFile` already has try/catch; undefined models gracefully falls back |
| Breaking change for existing agents | Low | Low | `models` is optional; no breaking changes to interface |
| Performance overhead | None | N/A | Only adds one string check per dispatch |

## Required Dependencies
- Scout report: Not needed; this is straightforward interface extension
- CHANGELOG.md: Required entry
- Tests: Manual integration test sufficient

## Files to Modify
1. `extensions/agent-team.ts` — Three edits (interface, parser, dispatch logic)
2. `.pi/agents/*.md` — Optional: fill `models` values (non-breaking)

## Completion Criteria
- ✅ TypeScript compiles without errors
- ✅ Agents with `models:` field spawn `pi` subprocess with correct `--model` argument
- ✅ Agents without `models:` field inherit parent context model
- ✅ No regression in existing agent dispatch functionality

## Implementation Constraints
1. Preserve existing formatting and code style
2. Maintain backward compatibility with all existing agent files
3. Do not alter the memory, safety, or UI systems
4. Minimal changes: only 3 code locations + optional frontmatter updates

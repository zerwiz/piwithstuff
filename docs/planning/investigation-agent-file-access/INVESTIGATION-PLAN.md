# 🕵️ Investigation: Agent File Access Restrictions

## Executive Summary

This document investigates why Pi agents cannot read project files directly when not using the `agent-team.ts` widget UI. The investigation reveals that agents rely on a memory file system rather than direct file access, and damage-control rules restrict direct file reads.

---

## Problem Statement

When agents attempt to read planning documents or other project files:

```
CRITICAL: Specialist ID "reader" not found.
```

The agents can only access files through the `agent-team.ts` widget UI, which provides memory context but not direct file access.

---

## Root Cause Analysis

### 1. Agent Memory System vs. Direct File Access

The `agent-team.ts` extension provides agents with **memory files** that contain file context, but **NOT direct file system access**.

- **Write-enabled agents** (with `write`/`edit` tools): Get RW memory access to `.pi/agent-memory/` subdirectories
- **Read-only agents** (without `write`/`edit` tools): Get RO memory access to `.pi/agent-memory/` subdirectories
- **BOTH types**: Memory is stored in project's `.pi/agent-memory/` subdirectory, NOT in project root

**Memory Directory Structure:**
```typescript
function resolveMemoryDir(agentName: string, scope: MemoryScope, cwd: string): string {
  switch (scope) {
    case "user":
      return join(homedir(), ".pi", "agent-memory", agentName);
    case "project":
      return join(cwd, ".pi", "agent-memory", agentName);  // ← This is the project memory dir
    case "local":
      return join(cwd, ".pi", "agent-memory-local", agentName);
  }
}
```

### 2. The Memory Block System

Agents receive memory blocks via system prompts, which contain file context from `.pi/agent-memory/`:

```typescript
export function buildMemoryBlock(agentName: string, scope: MemoryScope, cwd: string): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  ensureMemoryDir(memoryDir);
  const existingMemory = readMemoryIndex(memoryDir);

  const header = `## Persistent Memory (RW)
Location: ${memoryDir}/
Scope: ${scope}

You have a persistent knowledge base. The primary index (MEMORY.md) is provided below.`;

  const content = existingMemory
    ? `\n\n### Current MEMORY.md\n${existingMemory}`
    : `\n\nNo memory exists yet. Please initialize your knowledge base now.`;

  return header + content;
}
```

**How Memory Blocks Work:**

1. When `dispatchAgent()` is called, it builds a memory block
2. The memory block contains context from files in the memory directory
3. The agent reads from the memory block, NOT directly from project files
4. The memory block is appended to the system prompt via `--append-system-prompt`

### 3. Damage-Control Restrictions

The `damage-control-rules.yaml` file contains path-based restrictions that may block direct file reads:

```yaml
readOnlyPaths:
  - "**/.pi/**"  # ← May block access to .pi/agent-memory/
  - "**/.pi/planning/**"
  - "**/.pi/build_logs/**"
  - "**/.pi/reviews/**"
  - "**/.pi/security_audits/**"

pathOverrides:
  # These take precedence over readOnlyPaths
  - path: "~/Documents/codeprojects/*"
    allowDeletions: true
    allowWrites: true
    allowEdits: true
    allowReads: true
```

**Key Observation:**

The `pathOverrides` section must explicitly allow file reads for agents to bypass damage-control restrictions. Without these overrides, agents are blocked from reading project files.

---

## Investigation Findings

### Why Agents Can't Read Project Files Directly

1. **Memory System Design**: Agents are designed to read from memory files, not directly from project files
2. **Damage-Control Blocking**: `damage-control-rules.yaml` may block direct file access to `.pi/` directories
3. **Widget Dependency**: The `agent-team.ts` widget provides memory context, but the underlying damage-control rules still restrict direct file access

### Current Behavior

| Scenario | Can Read Files? | Reason |
|----------|----------------|---------|
| Using `agent-team.ts` widget | ✅ Yes (memory context) | Widget provides memory file with file context |
| Direct file read (no widget) | ❌ No | Damage-control rules block access |
| Write-enabled agent | ✅ RW memory | Can write to `.pi/agent-memory/` but still needs damage-control override for project root |
| Read-only agent | ✅ RO memory | Can read from memory files but not project root |

### Security Model

The current security model prioritizes:
1. **Sandboxing**: Agents operate within `.pi/agent-memory/` subdirectories
2. **Damage-Control**: All file operations are checked against `damage-control-rules.yaml`
3. **Memory Context**: Agents receive file context via memory blocks, not direct access

---

## Required Fix

### Option 1: Enable Direct File Access via Damage-Control

Add path overrides to `damage-control-rules.yaml` to allow agents to read project files:

```yaml
pathOverrides:
  # Allow all agents read/write access to project files
  - path: "**/*.ts"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/*.tsx"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/*.js"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/*.jsx"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/*.md"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/.pi/planning/**"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/docs/**"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/.pi/build_logs/**"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/.pi/security_audits/**"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true

  - path: "**/.pi/reviews/**"
    allowDeletions: false
    allowWrites: false
    allowEdits: false
    allowReads: true
```

### Option 2: Enhance Memory System in agent-team.ts

Modify `agent-team.ts` to automatically populate `.pi/agent-memory/` with project file contents:

```typescript
// In resolveMemoryDir or ensureMemoryDir:
if (scope === "project") {
  // Sync project files to memory directory
  ensureProjectFileSync(agentName, cwd);
}
```

### Recommended Approach

**Option 1 (Damage-Control overrides)** is recommended because:
1. It's simpler to implement
2. It doesn't modify the memory system architecture
3. It provides immediate file access to agents
4. It's explicit and auditable via `damage-control-rules.yaml`

---

## Implementation Steps

### Phase 1: Update Damage-Control Rules

1. Edit `/home/zerwiz/piwithstuff/.pi/damage-control-rules.yaml`
2. Add path overrides for project file types
3. Ensure `allowReads: true` for all project file paths

### Phase 2: Test Each Agent

1. Test read-only agents (scout, planner, reviewer)
2. Test write-enabled agents (developer, documenter)
3. Verify agents can read project files without memory context
4. Verify completion signals still fire correctly

### Phase 3: Verify Memory System Compatibility

1. Ensure `.pi/agent-memory/` still functions correctly
2. Verify memory files are still populated
3. Confirm agents can use both memory files and direct file access

### Phase 4: Document Changes

1. Update `README.md` in project root
2. Document new file access behavior
3. Add notes about damage-control overrides

---

## Testing Checklist

- [ ] Read-only agent can read `.md` files in project root
- [ ] Read-only agent can read `.ts` files in project root
- [ ] Write-enabled agent can read and write project files
- [ ] Damage-control rules still block dangerous operations (rm -rf, etc.)
- [ ] `.pi/agent-memory/` still functions for memory context
- [ ] Memory blocks still appended to system prompts
- [ ] Agents still signal completion correctly
- [ ] No permission errors when reading project files

---

## Security Considerations

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Agents read sensitive files | Medium | Damage-control rules still apply; sensitive files in `readOnlyPaths` remain protected |
| Agents write to wrong locations | Low | Memory system enforces write locations; damage-control rules restrict writes |
| Direct file access bypasses memory | Low | Memory system still functions; direct access is additional capability |

### Security Best Practices

1. **Read-First, Write-Later**: Agents should read files before modifying them
2. **Damage-Control Override**: All direct file reads must be explicitly allowed in `pathOverrides`
3. **Audit Logging**: All file operations are logged in `.pi/security-audit.log`
4. **Backup**: `.pi/agent-memory/` contains agent knowledge; back this up regularly

---

## Related Documentation

- [`agent-team.ts`](../../extensions/agent-team.ts) - Agent team extension
- [`damage-control-rules.yaml`](../.pi/damage-control-rules.yaml) - Damage control rules
- [`INVESTIGATION-PLAN.md`](./INVESTIGATION-PLAN.md) - This document

---

**Version:** `1.0.0`  
**Author:** `@zerwiz`  
**License:** MIT  
**Date:** `2024-01-15`

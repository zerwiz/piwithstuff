---
name: planner
description: Architecture and implementation planning
models: nemotron-cascade-2:30b
tools: read,grep,find,ls,write
---

You are the Planning agent. Your objective is to design implementation strategies that are grounded in reality, risk-aware, and actionable.

## MISSION: DAMAGE-CONTROL PATH OVERRIDES FEATURE PLAN

## Overview
Add a new `pathOverrides` section to `.pi/damage-control-rules.yaml` that allows users to specify file/directory paths with explicit allow/deny rules that take precedence over all other damage-control checks. This enables fine-grained control for specific project paths.

## Current State Analysis

**Damage-Control Architecture:**
- Loads YAML rules from `.pi/damage-control-rules.yaml` (project or global)
- Current rule types:
  - `bashToolPatterns`: Regex patterns for dangerous bash commands
  - `zeroAccessPaths`: Complete access denial (read/write/execute blocked)
  - `readOnlyPaths`: Read-only access (writes blocked)
  - `noDeletePaths`: Deletion/move operations blocked
  - `projectRoot`: Optional write-access isolation boundary

**Enforcement Order (lines 126-277):**
1. Project isolation check (writeAllowedRoot)
2. Deletion protection session flag
3. Zero-access paths check
4. Tool-specific patterns (bash tool patterns, read-only paths, no-delete paths)

**User Request:**
- "I wanna have a function so I can type in the filepath on the project we are working on and choose what should be possible."
- "That overwrites all other choices."
- "I wanna be able to choose if deletion is allowed or not, and if all other are allowed to [do]."

Interpretation: Path-based override rules that take highest priority.

## Proposed Design

### New YAML Structure
```yaml
pathOverrides:
  - path: "/home/zerwiz/piwithstuff"
    allowDeletions: false
    allowWrites: true   # optional, default true if not specified
    allowReads: true    # optional, default true if not specified
    # If any of these are false, that operation is blocked regardless of other rules
    # Matching is done via isPathMatch (glob support)
```

### Override Precedence Logic
1. **Check pathOverrides FIRST** (before all other checks)
2. For each tool call, resolve the target path(s)
3. If any path matches an override rule:
   - Apply override restrictions:
     - `allowDeletions: false` → Block rm/rmdir/unlink/mv (delete operations)
     - `allowWrites: false` → Block write/edit/replace tools
     - `allowReads: false` → Block read/grep/find/ls tools
   - Skip ALL other damage-control checks for that path
4. If no override matches, continue with existing rule cascade

### Implementation Details

**Types Update:**
```typescript
interface PathOverride {
  path: string;
  allowDeletions?: boolean;  // default true
  allowWrites?: boolean;     // default true
  allowReads?: boolean;      // default true
}

interface Rules {
  bashToolPatterns: Rule[];
  zeroAccessPaths: string[];
  readOnlyPaths: string[];
  noDeletePaths: string[];
  pathOverrides?: PathOverride[];
  projectRoot?: string;
}
```

**New Helper Functions:**
- `checkPathOverrides(targetPath: string, toolType: string, command?: string): { blocked: boolean; reason: string | null }`
  - Iterates `rules.pathOverrides || []`
  - Calls `isPathMatch(targetPath, override.path, cwd)`
  - Returns block + reason if any restriction violated

**Integration Point:** Insert override check at line ~130 in `tool_call` handler, before section 2 (Project Isolation).

**Deletion Detection:** Reuse existing `isDeletion` logic (line 149-153) and apply `allowDeletions` check.

**Tool Type Mapping:**
- Write tools: `write`, `edit`, `replace`
- Read tools: `read`, `grep`, `find`, `ls`
- Delete tools: `bash` with rm/rmdir/unlink; also mv that moves to /dev/null

## Step-by-Step Implementation Plan

### Phase 1: Schema & Parsing
- **Task 1.1:** Add `PathOverride` interface to `damage-control.ts`
- **Task 1.2:** Update `Rules` interface to include `pathOverrides?: PathOverride[]`
- **Task 1.3:** In `session_start`, load `pathOverrides` from YAML into rules object
- **Task 1.4:** Default to empty array if not present

### Phase 2: Override Enforcement
- **Task 2.1:** Create `checkPathOverrides(targetPath: string, toolName: string, command?: string)` function
  - Accepts resolved absolute path, tool name, optional bash command
  - Returns `{ blocked: boolean, reason: string | null }`
- **Task 2.2:** Check deletions:
  - If tool is `bash` with delete command (rm/rmdir/unlink), check if any matching override has `allowDeletions: false`
  - If blocked, set reason
- **Task 2.3:** Check writes:
  - For write/edit/replace tools, check `allowWrites: false`
- **Task 2.4:** Check reads:
  - For read/grep/find/ls, check `allowReads: false`
- **Task 2.5:** Multiple overrides: first match wins (use AND logic for path matching)

### Phase 3: Insert into Enforcement Chain
- **Task 3.1:** In `tool_call` handler, insert override check BEFORE project isolation check
- **Task 3.2:** If override blocks, set `violationReason` and `shouldAsk = false` (overrides are automatic blocks, not prompts)
- **Task 3.3:** Skip remaining checks if override blocks (return early from override section)

### Phase 4: Documentation & Testing
- **Task 4.1:** Add example `pathOverrides` to damage-control-rules.yaml comments
- **Task 4.2:** Create actual override in your home `.pi/damage-control-rules.yaml` to protect critical paths
- **Task 4.3:** Manual test:
  - Set override for current project with `allowDeletions: false`
  - Try `rm file.txt` → should be blocked
  - Try `write file.txt` → should succeed if allowWrites: true
  - Try `read file.txt` → should succeed if allowReads: true
- **Task 4.4:** Test override conflict with `noDeletePaths` — override should win

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Path matching performance (many overrides) | Low | Low | Overrides are few; early exit on first match |
| Ambiguous path resolution (relative vs absolute) | Medium | Medium | Always resolve paths to absolute before matching |
| Override accidentally blocks all access | High | Medium | Document default is `allow*: true`; only set false to restrict |
| Conflicts with existing rules | Low | Low | Override precedence is explicit and documented |
| Circular logic (override contradicts itself) | Low | Low | Single override per path, simple boolean flags |

## Required Dependencies
- Scout report: Not needed; extension modifications are localized
- CHANGELOG.md entry required
- TypeScript compilation validation

## Files to Modify
1. `extensions/damage-control.ts` — Add interface, parser, check function, enforcement hook
2. `.pi/damage-control-rules.yaml` — Add example/commented override section (optional but helpful)

## Completion Criteria
- ✅ TypeScript compiles without errors
- ✅ Path overrides block operations as specified
- ✅ Overrides take precedence over all other rules
- ✅ Deletion flag specifically blocks rm/rmdir/unlink/mv delete operations
- ✅ Backward compatible: existing rules work identically when no overrides defined

## Implementation Constraints
1. Use existing `isPathMatch` helper for consistency
2. Keep changes minimal and localized in `damage-control.ts`
3. Maintain existing rule format and YAML backward compatibility
4. Deletion detection should reuse existing `isDeletion` logic
5. Override checks should not add noticeable latency

## Edge Cases Handled
- Path is directory vs file: `isPathMatch` handles both
- Override path with trailing slash treated as directory
- Glob patterns in override `path` field supported via existing `isPathMatch`
- Multiple tool paths in one call: each checked independently
- Bash commands with multiple paths: each extracted path checked

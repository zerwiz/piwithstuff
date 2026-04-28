# 🚀 Extension Management System for Pi - Leverage Built-In Auto-Discovery

**Version:** 2.0.0 (Accurate)  
**Date:** 2024  
**Status:** Ready to Implement

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Pi Extension Behavior](#2-current-pi-extension-behavior)
3. [Implementation Strategy](#3-implementation-strategy)
4. [Enhancement Plan](#4-enhancement-plan)
5. [Configuration System](#5-configuration-system)
6. [Conflict Management](#6-conflict-management)
7. [Hot-Reload System](#7-hot-reload-system)
8. [File Structure](#8-file-structure)
9. [Best Practices](#9-best-practices)
10. [Migration Guide](#10-migration-guide)

---

## 1. Executive Summary

### 1.1 Current Reality

**Pi already has a sophisticated extension system built-in!**

Key findings:
- ✅ Auto-discovery from predefined directories (global + project-local)
- ✅ Hot-reload support via `/reload` command
- ✅ `-e` flag still supported for manual testing
- ✅ Event-driven lifecycle (session_start, resources_discover, etc.)
- ✅ Built-in conflict detection (duplicate tools get suffixes)
- ✅ State management via session entries

### 1.2 What We're Building

Instead of a full replacement loader, we'll build:

1. **Extension Manager Tool** - CLI for managing extension lists
2. **Conflict Analyzer** - Tool to detect and resolve conflicts before loading
3. **Configuration Generator** - Help users set up auto-discovery directories
4. **Validation Scripts** - Pre-load safety checks

**Goal:** Make Pi even more manageable, not more complex.

---

## 2. Current Pi Extension Behavior

### 2.1 Auto-Discovery Locations

```bash
# Global extensions (all projects)
~/.pi/agent/extensions/*.ts
~/.pi/agent/extensions/*/index.ts

# Project-local extensions
.pi/extensions/*.ts
.pi/extensions/*/index.ts
```

Additional paths via `settings.json`:
```json
{
  "extensions": [
    "/path/to/local/extension.ts",
    "/path/to/local/extension/dir"
  ]
}
```

### 2.2 Loading Behavior

**Startup Sequence:**
1. Pi reads extension directories
2. Scans for `*.ts` files
3. Loads each `extension.ts` (or `index.ts` in directories)
4. Runs factory function to register tools/hooks
5. If async, awaits completion before `session_start`

**Event Flow:**
```
pi starts
  ├─► session_start { reason: "startup" }
  └─► resources_discover { reason: "startup" }
      │
      ▼
user sends prompt ────────────────────────────┐
                                              │
  ┌─── Commands checked first (extension cmds)│
  ├─── input event (can intercept)           │
  ├─── before_agent_start (inject context)   │
  ├─── agent_start / agent_end               │
  └─── turn events (tool calls, results)     │
```

### 2.3 Conflict Handling

Pi handles duplicate tool registrations automatically:
- Same command names get numeric suffixes (`/review:1`, `/review:2`)
- Tool registrations accumulate across extensions
- No crashes on conflicts

### 2.4 `-e` Flag Status

```bash
# Still supported for manual testing
pi -e ./my-extension.ts

# Deprecated but functional
# Use auto-discovery instead
```

---

## 3. Implementation Strategy

### 3.1 Phase 1: Management Tools (Week 1)

**Goal:** Help users manage extensions easily

**Deliverables:**
1. `pi-list-extensions.sh` - Show loaded extensions
2. `pi-manage-extensions.ts` - CLI for enable/disable
3. `pi-analyze-conflicts.ts` - Detect potential conflicts
4. `.pi/extensions/` config guide

**Features:**
- List all auto-discovered extensions
- Show which tools each registers
- Report conflicts
- Generate `settings.json` for custom paths

### 3.2 Phase 2: Validation System (Week 2)

**Goal:** Catch problems before loading

**Deliverables:**
1. Pre-load validator script
2. Extension linter (format, security)
3. Dependency checker
4. Auto-update checker

**Features:**
- Check TypeScript syntax
- Validate tool signatures
- Security scan for unsafe patterns
- Verify dependencies available

### 3.3 Phase 3: Hot-Reload Helper (Week 3)

**Goal:** Make `/reload` easier to use

**Deliverables:**
1. State preservation utilities
2. Reload queue manager
3. Extension status dashboard
4. Performance metrics

**Features:**
- Save extension state before reload
- Queue multiple reloads
- Monitor reload performance
- Visual status indicators

### 3.4 Phase 4: Configuration Builder (Week 4)

**Goal:** Help users configure extension paths

**Deliverables:**
1. Config generator CLI
2. Migration assistant
3. Best practices guide
4. Troubleshooting wiki

**Features:**
- Interactive setup wizard
- Current config preview
- Export/import configs
- Validate setup

---

## 4. Enhancement Plan

### 4.1 User-Facing Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Extension List** | Show loaded extensions and tools | High |
| **Conflict Report** | Detect potential issues before load | High |
| **Config Generator** | Auto-generate `settings.json` | Medium |
| **Validation** | Pre-load safety checks | High |
| **Status Dashboard** | Reload performance metrics | Low |
| **Auto-Disable** | Temporarily disable bad extensions | Medium |
| **Extension Logs** | Per-extension logging | Medium |

### 4.2 Developer Tools

| Tool | Description | Priority |
|------|-------------|----------|
| **Lint Extension** | Format, security, syntax check | High |
| **Mock Tests** | Unit tests for extensions | Medium |
| **Performance Profiler** | Load time analysis | Low |
| **Dependency Resolver** | Ensure all deps available | Medium |

### 4.3 Future Features

| Feature | Description | Timeline |
|---------|-------------|----------|
| **Extension Marketplace** | Share/custom extensions | Q2 2024 |
| **Auto-Update** | Check for updates automatically | Q2 2024 |
| **Extension Signing** | Security for marketplace | Q3 2024 |
| **Version Control** | Track extension versions | Q3 2024 |

---

## 5. Configuration System

### 5.1 Default Configuration

```json
// ~/.pi/config/settings.json
{
  "extensions": [
    "~/.pi/agent/extensions",
    "./.pi/extensions"
  ],
  "autoDiscovery": true,
  "validateOnly": false,
  "logLevel": "info",
  "excludePatterns": [
    "**/*.test.ts",
    "**/backups/**",
    "**/node_modules/**"
  ]
}
```

### 5.2 Custom Paths

```bash
# Add additional paths
cat > ~/.pi/config/settings.json <<EOF
{
  "extensions": [
    "~/.pi/agent/extensions",
    "./.pi/extensions",
    "/path/to/global/ext1",
    "/path/to/global/ext2"
  ]
}
EOF
```

### 5.3 CLI Management

```bash
# List all loaded extensions
pi --list-extensions

# Show tool registrations
pi --list-tools

# Validate extensions without loading
pi --validate-only

# Temporarily exclude specific extensions
pi --exclude damage-control.ts --exclude agent-chain.ts

# Generate config from current extensions
pi --generate-config > ~/.pi/config/settings.json
```

---

## 6. Conflict Management

### 6.1 Conflict Detection

```typescript
// Check for duplicate tools before loading
function analyzeExtension(extension: string): ConflictAnalysis {
  const tools = extractToolRegistrations(extension);
  const commands = extractCommandRegistrations(extension);
  
  return {
    tools: {
      duplicates: findDuplicateTools(tools),
      conflicts: findConflictingCommands(commands),
    },
    hooks: findDuplicateHooks(extension),
    warnings: generateWarnings()
  };
}
```

### 6.2 Resolution Strategies

**Strategy 1: Load First, Skip Duplicate**
- Load first registered tool/command
- Skip subsequent registrations with same name
- Emit warning

**Strategy 2: Merge Compatible Hooks**
- Run hooks in order
- Later handlers see results from earlier
- Return values chain

**Strategy 3: User Override**
- Load both but disable conflict
- User can select which to use
- Persistent via config

### 6.3 Reporting

```bash
# Analyze conflicts
pi --analyze-conflicts
```

**Output:**
```
Extensions loaded: 5
Tools registered: 23
Commands registered: 8

Conflicts:
- Tool 'read': OK (unique)
- Tool 'bash': OK (unique)
- Command 'review': WARNING (registered by 2 extensions)
  * agent-team.ts (line 420)
  * agent-team-chain.ts (line 150)

Recommendations:
- Rename one of the commands
- Or disable one extension
```

---

## 7. Hot-Reload System

### 7.1 Existing `/reload` Command

```typescript
// Pi's built-in reload
pi.registerCommand("reload", {
  description: "Reload extensions, skills, prompts, and themes",
  handler: async (_args, ctx) => {
    await ctx.reload();
    return;
  },
});
```

**Behavior:**
1. Emits `session_shutdown` for current extension runtime
2. Reloads resources
3. Emits `session_start` with `reason: "reload"`
4. Extensions re-initialize

### 7.2 State Preservation

```typescript
// Save state before reload
pi.on("session_shutdown", async (event, ctx) => {
  if (event.reason === "reload") {
    // Preserve needed state
    const state = await captureExtensionState(ctx);
    await ctx.appendEntry("my-extension-state", state);
  }
});

// Restore on reload
pi.on("session_start", async (_event, ctx) => {
  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type === "custom" && entry.customType === "my-extension-state") {
      ctx.state = entry.data;  // Restore state
    }
  }
});
```

### 7.3 Reload Queue

```typescript
// Queue multiple reloads
class ReloadQueue {
  async queue(extensionPaths: string[]) {
    for (const path of extensionPaths) {
      await reloadExtension(path);
    }
  }
  
  async status() {
    return {
      queued: [...],
      processing: [...],
      completed: [...],
      failed: [...]
    };
  }
}
```

---

## 8. File Structure

### 8.1 Extension Management Tools

```
piwithstuff/
├── pi-loader/                    # NEW: Management tools
│   ├── list-extensions.sh        # Show loaded extensions
│   ├── analyze-conflicts.sh      # Detect conflicts
│   ├── validate-extensions.sh    # Pre-load validation
│   ├── generate-config.sh        # Create settings.json
│   └── manage-extensions.ts      # CLI tool
│
├── extensions/
│   ├── agent-team.ts
│   ├── agent-chain.ts
│   ├── damage-control.ts
│   └── ... (existing extensions)
│
├── .pi/
│   ├── config/
│   │   ├── settings.json         # Auto-discovery config
│   │   └── extension-config.json # Persisted list
│   └── extensions/               # Project-local extensions
│       ├── my-extension.ts
│       └── ...
│
└── docs/
    └── extensions/
        ├── README.md
        ├── CONFIGURE.md
        └── TROUBLESHOOTING.md
```

### 8.2 Extension Example with Config

```typescript
// ~/.pi/agent/extensions/my-extension.ts
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default async function (pi: ExtensionAPI) {
  // Initialization
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("My Extension loaded!", "info");
  });

  // Register tool
  pi.registerTool({
    name: "my_tool",
    label: "My Tool",
    description: "What this tool does",
    parameters: Type.Object({}),
    async execute() {
      return { content: [{ type: "text", text: "Hello" }] };
    },
  });
}
```

**Auto-discovered automatically from:**
```bash
~/.pi/agent/extensions/my-extension.ts
```

Or in project-local:
```bash
.pi/extensions/my-extension.ts
```

---

## 9. Best Practices

### 9.1 For Extension Developers

1. **Register tools with unique names**
   - Check existing tools before registering
   - Add suffix if needed: `my_tool_v1`, `my_tool_v2`

2. **Keep extensions small**
   - Split large extensions into modules
   - Use directories for multi-file extensions

3. **Document dependencies**
   - List required extensions (if any)
   - Use `settings.json` to specify paths

4. **Handle errors gracefully**
   - Don't crash on failures
   - Emit warnings, not errors

5. **Use state management**
   - Store state in session entries
   - Restore on `session_start`

### 9.2 For System Administrators

1. **Test extensions before deploying**
   - Use validation mode
   - Check for conflicts

2. **Review conflicts regularly**
   - Run `pi --list-tools`
   - Fix duplicates

3. **Monitor performance**
   - Extensions loading >2s are problematic
   - Profile with `--timing`

4. **Version your configs**
   - Add `settings.json` to git
   - Tag extension versions

5. **Document custom extensions**
   - Create `README.md` for each
   - Explain setup and usage

### 9.3 Security Considerations

1. **Validate all extensions**
   - Use validator before loading
   - Check for unsafe patterns

2. **Review tool registrations**
   - Each tool adds LLM capabilities
   - Be selective

3. **Monitor extension updates**
   - Watch for security patches
   - Update regularly

4. **Restrict execution context**
   - Run dangerous extensions with caution
   - Use validation mode first

---

## 10. Migration Guide

### 10.1 From `-e` Flag to Auto-Discovery

**Before (manual):**
```bash
pi -e agent-team.ts -e damage-control.ts -e theme-cycler.ts
```

**After (auto-discovery):**
```bash
# Create directories if they don't exist
mkdir -p ~/.pi/agent/extensions
mkdir -p .pi/extensions

# Place extensions in directories
cp extensions/*.ts ~/.pi/agent/extensions/
cp extensions/*.ts .pi/extensions/

# Run Pi (extensions load automatically)
pi
```

**With custom paths:**
```bash
# Add to settings.json
echo '{"extensions":["/path/to/extra/extension"]}' > ~/.pi/config/settings.json

# Pi will discover from all paths
pi
```

### 10.2 From Manual to Configured

**Current workflow:**
```bash
# Each session specifies extensions
pi -e ext1.ts -e ext2.ts
```

**New workflow:**
```bash
# Set up once
pi --generate-config > ~/.pi/config/settings.json

# Extensions load automatically
pi
```

### 10.3 Troubleshooting

**Problem: Extensions not loading**

**Solution 1: Check directories**
```bash
ls ~/.pi/agent/extensions/
ls .pi/extensions/
```

**Solution 2: Validate syntax**
```bash
node --check ~/.pi/agent/extensions/*.ts
```

**Solution 3: List loaded extensions**
```bash
pi --list-extensions
```

**Problem: Duplicate tools**

**Solution:**
```bash
# Analyze conflicts
pi --analyze-conflicts

# Exclude one extension
pi --exclude conflict-extension.ts
```

**Problem: Reload not working**

**Solution:**
```bash
# Use /reload command in Pi
/new  # Start fresh session
# Or
/reload  # Reload current session
```

---

## 11. Conclusion

### 11.1 Summary

Pi already has a robust extension system with:
- ✅ Auto-discovery from predefined directories
- ✅ Hot-reload via `/reload`
- ✅ Conflict handling (duplicate suffixes)
- ✅ Event-driven lifecycle
- ✅ State management

Our enhancement plan adds:
- ✅ Management tools for easier configuration
- ✅ Validation before loading
- ✅ Conflict analysis
- ✅ Performance monitoring

### 11.2 Next Steps

1. Create management tools (Phase 1)
2. Add validation scripts (Phase 2)
3. Build hot-reload helpers (Phase 3)
4. Generate documentation (Phase 4)

### 11.3 Support

- **Documentation:** `/docs/extensions/`
- **Examples:** `/examples/extensions/`
- **Issues:** GitHub issues
- **Community:** Discord channel

---

**End of Plan**

This plan leverages Pi's existing extension infrastructure rather than building a replacement, making it more practical and less disruptive to current users.
🚀 Extension Loader System for Pi - Comprehensive Implementation Plan

Version: 1.2.0

Status: Implementation Phase (Core v0.70.5 Loader Validated)

Target: Pi 0.70.5+ Compatibility & Modular Scaling

📋 Table of Contents

Executive Summary

Requirements

Architecture Overview

Core Components

Implementation Plan

File Structure

API Design

Configuration System

Extension Lifecycle

Security Considerations

Testing Strategy

Roadmap

Migration Guide

Best Practices

1. Executive Summary

1.1 Problem Statement

In Pi updates (v0.70.5+), the traditional method of stacking extensions via multiple CLI flags has become unstable due to stricter ESM resolution and sandboxing:

# ❌ Unstable/Fails in 0.70.5
pi -e ext1.ts -e ext2.ts -e ext3.ts


Key Issues: Path resolution conflicts, async initialization races, and "loose file" discovery restrictions.

1.2 Solution Overview

We are building a Single Entry Point Loader (pi-loader.ts). Instead of Pi managing the stack, our loader takes control by:

✅ Providing persistent extension configuration.

✅ Resolving paths via absolute file:// URIs to satisfy v0.70.5 requirements.

✅ Orchestrating sequential initialization of factories.

✅ Managing tool/hook conflicts before Pi starts its main loop.

2. Requirements

2.1 Functional Requirements

FR-001: Load extensions from extensions/ and .pi/extensions/.

FR-002: Resolve stacking via PI_STACK environment variable or PI_CONFIG.

FR-003: Detect and prevent duplicate tool registrations.

FR-004: Support hot-reload of individual extensions without restarting the Pi process.

FR-005: Handle extension errors gracefully without crashing the core agent.

2.2 Non-Functional Requirements

NFR-001: Load time < 1.5 seconds for a 5-extension stack.

NFR-002: Zero overhead for unselected extensions.

NFR-003: Full compatibility with Justfile orchestration.

3. Architecture Overview

3.1 High-Level Design (Single Entry Point)

┌─────────────────────────────────────────────────────────────┐
│                      Pi Runtime (0.70.5)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │               extensions/pi-loader.ts                 │  │
│  │  (The ONLY extension registered with Pi CLI)          │  │
│  └───────────┬───────────────────────────────────────────┘  │
│              │                                              │
│              ▼ Reading PI_STACK / config.json               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Dynamic Import Engine                     │  │
│  │ 1. Path Resolver (Absolute file:// URIs)              │  │
│  │ 2. Conflict Detector (Tool/Hook collisions)           │  │
│  │ 3. Sequential Async Factory Runner                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘


4. Core Components

4.1 Configuration Manager (config.ts)

Handles the merging of defaults, environment variables (PI_STACK), and persistent JSON files.

v0.70.5 Note: Prioritizes absolute paths to avoid resolution errors.

4.2 Extension Registry (registry.ts)

Tracks loaded extensions, their statuses, and the tools they've injected into the system.

4.3 Lifecycle Manager (lifecycle.ts)

Manages the STARTUP -> LOADING -> ACTIVE -> ERROR state machine for every stacked module.

5. Implementation Plan

5.1 Phase 1: Foundation (Current)

✅ Create pi-loader.ts core logic.

✅ Implement Justfile orchestration with PI_STACK.

✅ Standardize absolute path resolution via path.join(process.cwd(), ...).

5.2 Phase 2: Conflict Handling

[ ] Implement ConflictDetector to check for tool name collisions before factory execution.

[ ] Add WarningUI to inform the user when a tool is skipped due to a collision.

5.3 Phase 3: Advanced Features

[ ] Hot-Reload: Watcher that detects file changes and re-runs the factory via the loader.

[ ] State Preservation: Allow extensions to store data in a persistent state object that survives reloads.

6. File Structure

piwithstuff/
├── Justfile                   # Orchestration (The UI for the stacks)
├── extensions/                # The loose extension files
│   ├── pi-loader.ts           # THE MASTER LOADER
│   ├── agent-team.ts
│   └── ...
├── pi-loader/                 # Internal modules for the loader
│   ├── config.ts
│   ├── validation.ts
│   └── lifecycle.ts
└── .pi/
    └── config/
        └── extension-config.json


7. API Design

7.1 Loader Interface

interface PILoader {
  init(api: ExtensionAPI): Promise<void>;
  stack(name: string): Promise<void>;
  getStatus(): ExtensionStatus[];
}


7.2 Extension Factory (Contract)

export default async function (pi: ExtensionAPI) {
    // 1. Setup
    // 2. Register Tools
    // 3. Listen to Events
}


8. Configuration System

8.1 Environment Variables

PI_STACK: Comma-separated list (e.g., "minimal,theme-cycler").

PI_LOADER_VERBOSE: Set to true to see detailed loading logs.

8.2 Justfile Integration

run-pi stack:
    @export PI_STACK="{{stack}}" && pi -e extensions/pi-loader.ts


9. Security Considerations

Directory Traversal: Loader strictly validates that PI_STACK items resolve within the project root.

Unsafe Code: Validator scans for eval() or process.exit() patterns in stacked files.

10. Testing Strategy

Unit: Test pi-loader.ts path resolution logic.

Integration: Run just run-agent-team-chain and verify tools like /sub are active.

Performance: Ensure loading 10+ extensions doesn't delay startup beyond 2s.

11. Roadmap

v1.2 (Short Term): Support for .js compiled extensions and npm packages.

v2.0 (Long Term): GUI dashboard within Pi's footer to toggle extensions live.

12. Migration Guide

Before (v0.70.3):
pi -e ext1.ts -e ext2.ts

After (v0.70.5+):

Install pi-loader.ts to extensions/.

Update Justfile to use the PI_STACK + pi-loader.ts pattern.

Launch via just ext-name.

13. Best Practices

Naming: Prefix extension tools with the extension name to avoid collisions (e.g., team_deploy).

Async: Always use async factories even if your setup is currently synchronous.

Paths: Never use relative imports inside stacked extensions; rely on the ExtensionAPI.

End of Plan

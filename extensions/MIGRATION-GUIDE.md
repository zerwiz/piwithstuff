# 🚀 Migration Guide: Agent Extension Architecture

**For:** Developer team adopting the agent team extension system
**Goal:** Simplify, consolidate, and document the architecture
**Status:** Initial draft

---

## 📋 Table of Contents

1. [Current State](#current-state)
2. [Target State](#target-state)
3. [Migration Steps](#migration-steps)
4. [Checklists](#checklists)
5. [FAQ](#faq)

---

##  Current State

### **File Structure**

```
extensions/
├── agent-team.ts              # Core team functionality
├── agent-chain.ts             # Chain pipeline orchestrator
├── agent-team-chain.ts        # Hybrid (causes conflicts)
├── damage-control.ts          # Safety layer
├── memory.ts                  # Memory utilities
└── util/
    ├── memory-export.ts       # Memory export tools
    └── memory-tools.ts        # Pi command tools
```

### **Current Issues**

- ⚠️ **Duplicate tool registration** between `agent-team.ts` and `agent-team-chain.ts`
- ⚠️ **Conflicting event handlers** in hook lifecycle
- ⚠️ **No clear composition pattern** for combining features
- ⚠️ **Limited documentation** on extension architecture
- ⚠️ **Hard to extend** chain system independently

---

##  Target State

### **File Structure**

```
extensions/
├── agent-team.ts              # Core team functionality (unchanged)
├── agent-chain.ts             # Standalone chain system (unchanged)
├── agent-team-chain.ts        # DEPRECATED (migration target)
├── damage-control.ts          # Safety layer
├── memory.ts                  # Memory utilities (unchanged)
└── util/
    ├── memory-export.ts       # Shared export utilities
    └── memory-tools.ts        # Pi command tools
```

### **Recommended Extensions**

#### **Basic (Most Users)**

```bash
pi -e extensions/damage-control.ts \
    -e extensions/theme-cycler.ts \
    -e extensions/agent-team.ts
```

#### **Advanced Chains**

```bash
pi -e extensions/damage-control.ts \
    -e extensions/theme-cycler.ts \
    -e extensions/agent-chain.ts
```

#### **Hybrid (Via Composed Extension)**

```bash
# Create composed extension (see Migration Steps below)
pi -e extensions/composed-agent-team.ts
```

---

## Migration Steps

### **Step 1: Create Composed Extension**

**File:** `extensions/composed-agent-team.ts`

**Purpose:** Safe composition of team + chain features

**Skeleton:**

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readMemoryIndex, buildMemoryBlock } from "./memory.ts";
import { applyExtensionDefaults } from "./themeMap.ts";

// Load both systems
const { default: teamSystem } = await import("./agent-team.ts");
const { default: chainSystem } = await import("./agent-chain.ts");

// Load memory export utilities
const { exportMemory } = await import("./util/memory-export.ts");

// Merge tools safely
function mergeTools(primaryTools: string[], secondaryTools: string[]) {
  return [...new Set([...primaryTools, ...secondaryTools])];
}

// Export
export default function (pi: ExtensionAPI) {
  // ... composed system logic
}
```

### **Step 2: Update Justfile**

**File:** `justfile`

**Add target:**

```just
# 13. Composed agent team: team + chains + safety
ext-composed-team:
    pi -e extensions/composed-agent-team.ts \
        -e extensions/damage-control.ts \
        -e extensions/theme-cycler.ts

build:composed-team
    @echo "✅ Building composed-agent-team extension..."
    @echo "   ✓ Tool merge check"
    @echo "   ✓ Hook order validation"
    @echo "   ✓ Memory utilities loaded"
    @echo "✅ Composed extension ready"
```

### **Step 3: Deprecate agent-team-chain.ts**

**File:** `agent-team-chain.ts`

**Add deprecation notice at top:**

```typescript
/**
 * WARNING: DEPRECATED
 * Use: pi -e extensions/composed-agent-team.ts instead
 * agent-team.ts + agent-chain.ts separately for basic usage
 */
```

### **Step 4: Create Documentation**

**File:** `extensions/EXTENSION-README.md`

**Contents:**

```markdown
# Agent Extension System

## Extensions

- agent-team.ts - Team dispatcher
- agent-chain.ts - Chain pipeline
- agent-team-chain.ts - DEPRECATED, use composed-agent-team.ts
- damage-control.ts - Safety
- theme-cycler.ts - Theme switching

## Combinations

### Basic (Team Only)
```bash
pi -e agent-team.ts -e theme-cycler.ts -e damage-control.ts
```

### Advanced (Chains Only)
```bash
pi -e agent-chain.ts -e theme-cycler.ts -e damage-control.ts
```

### Hybrid (Via Composed)
```bash
pi -e composed-agent-team.ts -e theme-cycler.ts -e damage-control.ts
```

## Memory Export

Available in all extensions:

```bash
memory-export:json    # JSON format
memory-export:text    # Plain text
memory-export:md      # Markdown
memory-export:preview # Preview only
```

## Documentation

- AGENT-EXTENSION-ARCHITECTURE.md - Full architecture analysis
- EXTENSION-README.md - This file
- README.md - Project documentation
```

---

## Checklists

### **Developer Onboarding**

### [ ] Load correct extension
- [ ] Read EXTENSION-README.md
- [ ] Choose appropriate combination
- [ ] Document why you chose your combination
- [ ] Review AGENT-EXTENSION-ARCHITECTURE.md for full details

### [ ] Memory Setup
- [ ] Review memory.ts for utility functions
- [ ] Understand memory scopes (user/project/local)
- [ ] Check existing memories before creating new ones
- [ ] Use util/memory-export.ts for export features

### [ ] Tool Registration
- [ ] Review existing tools in agent-team.ts
- [ ] Review existing tools in agent-chain.ts
- [ ] Add new tools to composed extension only (when needed)
- [ ] Check for duplicates in every registration

### [ ] Extension Lifecycle
### [ ] On startup
- [ ] Register hooks in defined order
- [ ] Register tools after damage-control
- [ ] Check widget registration order
- [ ] Validate tool count (no duplicates)

### [ ] During session
- [ ] Check session_start handler registered once
- [ ] Check before_agent_start hooks don't conflict
- [ ] Validate state management (no leaks)
- [ ] Handle errors in all handlers

### [ ] Memory Operations
### [ ] Read
- [ ] Use readMemoryIndex() from memory.ts
- [ ] Check for truncation warnings
- [ ] Verify memory scope correctness

### [ ] Write
- [ ] Use buildMemoryBlock() for writable access
- [ ] Use buildReadOnlyMemoryBlock() for read-only
- [ ] Validate memory directories exist
- [ ] Check safety guards (symlinks, etc.)

### [ ] Export
- [ ] Use util/memory-export.ts utilities
- [ ] Choose format before exporting
- [ ] Check export paths
- [ ] Preview exports before writing

### [ ] Error Handling
- [ ] Wrap subprocess spawns in try-catch
- [ ] Validate agent names before spawn
- [ ] Handle session cleanup on error
- [ ] Report errors to user clearly

### [ ] Testing
- [ ] Test extension loading in isolation
- [ ] Test tool registration (no duplicates)
- [ ] Test memory read/write cycles
- [ ] Test chain execution
- [ ] Test memory export functions
- [ ] Test damage control triggers

### [ ] Documentation
- [ ] Document new agent personas
- [ ] Document new tools
- [ ] Document new commands
- [ ] Update EXTENSION-README.md
- [ ] Add examples to README.md

### [ ] Code Quality
- [ ] Run lint
- [ ] Run typecheck
- [ ] Review code duplication
- [ ] Check event hook order
- [ ] Validate memory safety
- [ ] Ensure error handling coverage

---

## FAQ

### **Q: Why are there three extensions (team, chain, combined)?**

**A:** They serve different use cases:
- `agent-team.ts` - Multi-agent team dispatcher
- `agent-chain.ts` - Sequential pipeline orchestrator
- `agent-team-chain.ts` - Combines both (causes conflicts)

**Recommendation:** Use team OR chain separately, or composed extension.

### **Q: Can I add tools to the extended team?**

**A:** Yes, but only via the composed extension:

```typescript
export default function (pi: ExtensionAPI) {
  // ... existing tools ...
  
  // Add custom tool
  pi.registerTool({
    name: "custom-tool",
    // ...
  });
}
```

### **Q: What's the loading order?**

**A:** Loading order matters:

1. `damage-control.ts` - Safety first
2. `theme-cycler.ts` - Theming
3. Extension of choice (team OR chain OR composed)

Example:
```bash
pi -e damage-control.ts \
    -e theme-cycler.ts \
    -e agent-team.ts  # or agent-chain.ts or composed-agent-team.ts
```

### **Q: Where do I define new agents?**

**A:** In `.pi/agents/` with YAML files:

```yaml
---
name: my-agent
description: My custom agent
tools: read,grep,find,write
---
System prompt content here...

## Agent Content...
```

### **Q: How do I export memory?**

**A:** Use the Pi commands:

```bash
memory-export:json    # To .pi/memory-export.json
memory-export:text    # To .pi/memory-export.txt
memory-export:md      # To .pi/memory-export.md
memory-export:preview # Preview before writing
```

### **Q: Where else can I read more?**

**A:** See these files:
- `AGENT-EXTENSION-ARCHITECTURE.md` - Full architecture analysis
- `EXTENSION-README.md` - Extension documentation
- `README.md` - Project documentation
- `memorty.ts` - Memory system documentation
- `util/memory-export.ts` - Export utilities

---

## Next Steps

### **Week 1: Setup**

- [ ] Create composed-agent-team.ts
- [ ] Update justfile with new targets
- [ ] Write EXTENSION-README.md
- [ ] Update existing docs
- [ ] Test basic usage
- [ ] Document migration path

### **Week 2: Refinement**

- [ ] Fix duplicate tool issues
- [ ] Add extension lifecycle hooks
- [ ] Write unit tests for utilities
- [ ] Validate memory safety
- [ ] Document state diagrams
- [ ] Create troubleshooting guide

### **Week 3: Deployment**

- [ ] Deploy to production
- [ ] Update README.md
- [ ] Announce to team
- [ ] Monitor error rates
- [ ] Gather feedback
- [ ] Iterate based on issues

---

## Appendix

### **Tool Manifest**

**team.ts tools:**
- switch_team
- list_teams
- list_agents
- manage_team
- dispatch_agent
- list_active_team
- save_memory

**chain.ts tools:**
- run_chain
- switch_chain
- chain-list

**Composed (merged):**
All above + deduplicated

### **Memory Paths**

- User: ~/.pi/agent-memory/{agent}/
- Project: .pi/agent-memory/{agent}/
- Local: .pi/agent-memory-local/{agent}/

### **Hook Lifecycle**

1. Extension load
2. session_start
3. before_agent_start
4. Agent responds
5. before_agent_start
6. Agent responds

**Each extension should register once per hook.**

---

**End of Migration Guide**
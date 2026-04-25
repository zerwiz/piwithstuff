# Pi-with-Stuff Branding Guidelines

**Pi vs Claude Code** (Pi-vs-CC) — Official Technical Documentation  
*Version 1.0.0 | Last Updated: 2025-01-01*

---

## Table of Contents

1. [Mission Statement](#1-mission-statement)
2. [Naming Conventions](#2-naming-conventions)
3. [Attribution Guidelines](#3-attribution-guidelines)
4. [Versioning Strategy](#4-versioning-strategy)
5. [The Pi-with-Stuff Manifesto](#5-the-pi-with-stuff-manifesto)
6. [Documentation Templates](#6-documentation-templates)
7. [Visual Identity](#7-visual-identity)
8. [Code Conventions](#8-code-conventions)
9. [Community Standards](#9-community-standards)
10. [Review & Approval Process](#10-review--approval-process)

---

## 1. Mission Statement

### 1.1 Core Purpose

> **Pi-with-Stuff empowers developers to extend, customize, and enhance their Pi Coding Agent experience through modular, type-safe, and secure extensions.**

### 1.2 What We Build

Pi with Stuff extends the **Pi vs Claude Code** project by adding:

- **Multi-agent orchestration** — Teams and pipelines for structured workflows
- **Damage-control security** — Real-time safety auditing and prevention
- **UI customization** — Themes, widgets, status bars, and overlays
- **Background execution** — Headless subagents for parallel work
- **Cross-platform integration** — Commands from multiple agent ecosystems
- **Session management** — Persistent agent sessions with resume capability
- **Tool generation** — Forge extensions for runtime tool creation
- **Event-driven extensions** — React to session, tool, and agent lifecycle events

### 1.3 Our Values

- **Modular** — Extensions are composable and independently developable
- **Type-safe** — Strict TypeScript throughout with full type inference
- **Secure-by-default** — All rules are defensive; dangerous actions require explicit confirmation
- **Developer-friendly** — Clear documentation and minimal dependencies
- **Extensible** — Easy to add new extensions, tools, and capabilities
- **Production-ready** — Tested, error-handled, and production-grade patterns

---

## 2. Naming Conventions

### 2.1 Project Names

| Context | Preferred | Approved | Rejected |
|---------|-----------|----------|----------|
| Project name | Pi-with-Stuff | piwithstuff | Pi-vs-Stuff |
| Extension | damage-control.ts | agent-team.ts | bad-control.ts |
| Agent | scout, planner, builder | red-team | scout-bot |
| Directory | `extensions/` | `.pi/agents/` | `plugins/`, `addons/` |

### 2.2 File Naming

**Extensions:**
```typescript
extensions/<extension-type>.ts
  - damage-control.ts    // Security rules
  - agent-team.ts        // Multi-agent dispatcher
  - agent-chain.ts       // Sequential pipelines
  - subagent-widget.ts   // Background workers
  - theme-cycler.ts      // Theme switching
  - purpose-gate.ts      // Session intent
  - pure-focus.ts        // Distraction-free mode
  - tool-counter.ts      // Tool usage stats
  - session-replay.ts    // Timeline overlay
```

**Agents:**
```typescript
agents/<agent-name>.md
  - scout.md
  - planner.md
  - builder.md
  - reviewer.md
  - documenter.md
  - red-team.md
```

**Configuration:**
```typescript
.pi/damage-control-rules.yaml
.pi/agents/teams.yaml
.pi/agents/agent-chain.yaml
```

### 2.3 Message Formats

**Notification Messages:**
```typescript
ctx.ui.notify(`${displayName(state.def.name)} ${status} in ${elapsed}s`, status);
// Example output: "Scout done in 3s"
```

**Status Bar Messages:**
```typescript
ctx.ui.setStatus("agent-team", `Team: ${name} (${count})`);
// Example: "Team: full (6)"
```

**Warning Messages:**
```typescript
ctx.ui.notify(`⚠️ Warning: Git will lose uncommitted changes`, "warning");
// Always include emoji prefix (🛒, ⚠️, 🛡️, 🛑)
```

**Error Messages:**
```typescript
ctx.ui.notify(`🛑 Error spawning agent: ${err.message}`, "error");
// Include emoji and error code when applicable
```

### 2.4 Tool Names

All tools registered via `pi.registerTool()` must follow:

```typescript
{
  name: "snake_case_name",  // No underscores allowed
  label: "Title Case Name",  // Capitalized first letter
  description: "Clear, one-sentence description"
}
```

**Approved:**
- `dispatch_agent`
- `run_chain`
- `list_forge`
- `use_forge_tool`
- `forge_tool`

**Rejected:**
- `_dispatchAgent` (leading underscores)
- `dispatch_agent_tool` (no `_` in names)
- `DispatchAgent` (PascalCase tool names)

### 2.5 Agent Names

**Naming Rules:**
- Use lowercase with hyphens: `red-team`, `plan-reviewer`
- First character must be lowercase
- Maximum 25 characters
- Must be unique within team

**Approved:**
- `scout`, `planner`, `builder`, `reviewer`
- `ext-expert`, `theme-expert`, `skill-expert`
- `session-manager`

**Rejected:**
- `ScoutBot`, `RedTeam`, `PLANNER`
- `agent_scout`, `scout1`
- `red-team-specialist-v2`

### 2.6 Extension Naming

**Pattern:** `<role>-<capability>.ts`

| Extension | Name | Role | Capability |
|-----------|------|------|------------|
| Security auditing | `damage-control.ts` | DamageControl | Rules enforcement |
| Multi-agent dispatch | `agent-team.ts` | AgentTeam | Dispatcher |
| Sequential pipelines | `agent-chain.ts` | AgentChain | Pipeline |
| Background tasks | `subagent-widget.ts` | Subagent | Widget |

---

## 3. Attribution Guidelines

### About Pi with Stuff

Pi with Stuff builds upon [Pi vs Claude Code](https://github.com/mariozechner/pi-with-stuff.git) by adding
multi-agent orchestration, damage-control security, and UI customization capabilities.

Pi vs Claude Code is a CLI agent for development, built by Mario Zechner (@mariozechner).
See: https://github.com/mariozechner/pi-coding-agent

### 3.1 Pi-vs-CC Attribution

**All Pi-with-stuff documentation must acknowledge the Pi vs Claude Code project:**

```markdown
## About Pi-with-Stuff

Pi-with-stuff extends the [Pi vs Claude Code](https://github.com/mariozechner/pi-with-stuff.git) project by adding
multi-agent orchestration, damage-control security, and UI customization capabilities.

Pi vs Cloud Code is a CLI agent for development, built by Mario Zechner (@mariozechner).
See: https://github.com/mariozechner/pi-coding-agent
```

### 3.2 License Attribution

```markdown
Copyright © 2025. Distributed under the same license as Pi vs Claude Code.
For full attribution, see LICENSE and package.json in the upstream repository.
```

### 3.3 Credit in UI Messages

When referencing Pi-vs-CC or its features:

```typescript
// Good: Direct attribution
ctx.ui.notify(`🛑 BLOCKED by Damage-Control: ${reason}\n\nDO NOT attempt ...`, "warning");

// Avoid: Vague attribution
ctx.ui.notify(`Security check failed: ${reason}`, "warning");  // ❌ Missing attribution
```

### 3.4 Third-Party Acknowledgments

**TypeBox:** For type schema validation
```typescript
// In package.json
"dependencies": {
  "@sinclair/typebox": "<version>",  // @sinclair/typebox: Type-safe object schemas
}
```

**Pi SDK:** For core functionality
```typescript
// In README.md
## Technology Stack

- **Pi Coding Agent:** The base CLI agent
- **TypeBox:** Type-safe schema validation
- **@mariozechner/pi-tui:** UI components for TUI rendering
```

### 3.5 Author Attribution

Extensions include author metadata:

```typescript
/*
 * Extension: damage-control
 * Author: Pi-with-Stuff Team
 * Based on: Pi vs Claude Code
 * License: MIT
 * See https://github.com/mariozechner/pi-with-stuff
 */
```

---

## 4. Versioning Strategy

### 4.1 SemVer Adoption

Pi-with-stuff uses **Semantic Versioning** (SemVer 2.0.0):

```
MAJOR.MINOR.PATCH

MAJOR (X.0.0):     Breaking changes to API or behavior
MINOR (X.Y.0):     New features, backwards-compatible
PATCH (X.Y.Z):     Bug fixes, security patches
```

### 4.2 Version Bumping

| Change Type | Command | Example |
|-------------|---------|---------|
| Breaking API | `npm version major` | 1.0.0 → 2.0.0 |
| New feature | `npm version minor` | 1.0.0 → 1.1.0 |
| Bug fix | `npm version patch` | 1.0.0 → 1.0.1 |

### 4.3 Extension Versioning

Each extension has independent versioning:

```typescript
/**
 * Extension: damage-control
 * Version: 1.2.0
 * Author: Pi-with-Stuff Team
 */
```

### 4.4 Version Declaration in Extensions

```typescript
/**
 * @file damage-control.ts
 * @version 1.2.0
 * @description Security and safety auditing rules
 * @author Pi-with-Stuff Team
 * @license Same license as Pi vs Claude Code
 */
```

### 4.5 Backwards Compatibility

**MAJOR versions:**
- Breaking changes require API updates
- Deprecation warnings in MAJOR-1.x
- Documentation migration guide

**MAJOR.Minor:**
- All changes backwards-compatible
- New tools and features
- Configuration schema additions

**MAJOR.Minor.PATCH:**
- Bug fixes only
- No new features or breaking changes

---

## 5. The Pi-with-Stuff Manifesto

### 5.1 Core Beliefs

```
Pi-with-Stuff believes that:

  1. Extensions are first-class citizens, not afterthoughts
  2. Type safety belongs in every extension, not none
  3. Security is a baseline, not a feature
  4. Multi-agent collaboration unlocks new possibilities
  5. Documentation must be clear, not clever
  6. Developer experience includes security and ergonomics
  7. The community builds together, not alone
```

### 5.2 What We Add

**Pi vs Claude Code** provides:
- Core agent CLI
- Basic tool interface
- Simple extension point

**Pi-with-stuff adds:**

| Layer | Feature | Benefit |
|-------|---------|---------|
| **Security** | Damage-control rules | Prevent unsafe operations |
| **Orchestration** | Agent teams & chains | Structured workflows |
| **UI Customization** | Themes, widgets, overlays | Enhanced experience |
| **Background Work** | Subagent spawning | Parallel processing |
| **Cross-Platform** | Unified CLI interface | Single command everywhere |
| **Session Management** | Persistent agent context | Resume work mid-session |
| **Tool Generation** | Forge extensions | Runtime tool creation |
| **Documentation** | Full specs & templates | Faster onboarding |

### 5.3 Our Promise

> We promise extensions that are:
>
> - Secure by default, not optional
> - Type-safe and easy to debug
> - Well-documented and discoverable
> - Production-ready and performant
> - Built for developers, not against developers

### 5.4 Our Commitment

```markdown
Pi-with-stuff commits to:

  1. **Quality** — Every extension is tested and error-handled
  2. **Transparency** — Security measures are documented and explainable
  3. **Accessibility** — All code is open and reviewable
  4. **Community** — Contributions are welcome and reviewed
  5. **Stability** — Breaking changes go through deprecation
  ```

---

## 6. Documentation Templates

### 6.1 Extension Specification Template

```markdown
# Extension: <name>

## Overview
Brief description of what the extension does and when to use it.

## Usage
```bash
# Example command
pi -e extensions/<name>.ts
```

## Features
| Feature | Description |
|---------|------------|
| Feature 1 | What it does |
| Feature 2 | What it does |

## Configuration
Example `.pi/settings.json`:
```json
{
  "extensions": [
    {
      "name": "<name>",
      "enabled": true
    }
  ]
}
```

## API
### Events
| Event | Description |
|-------|-------------|
| event1 | Description |

### Tools
```typescript
pi.registerTool({
  name: ...,
  label: ...,
  description: ...,
  parameters: ...,
  execute: ...,
  renderCall: ...,
  renderResult: ...,
});
```

### Commands
```typescript
pi.registerCommand("command", {
  description: ...,
  handler: ...,
});
```

## Installation
Add to extensions directory:
```bash
cp <source>.ts extensions/<name>.ts
```

## Limitations
- Known constraints or limitations
- Platform requirements

## License
Same license as Pi vs Claude Code.

## Acknowledgments
Pi vs Claude Code by Mario Zechner (@mariozechner).
```

### 6.2 Agent Manifest Template

```markdown
---
name: <agent-name>
description: Short, one-sentence role description
tools: read|grep|find|ls|<custom tools>
---

## Role

<agent-name> is specialized in:
- <specialty 1>
- <specialty 2>
- <specialty 3>

## Responsibilities

1. <Responsibility 1>
2. <Responsibility 2>
3. <Responsibility 3>

## Capabilities

- Tool usage: <list|read|grep...>
- Code generation: Y/N
- File editing: Y/N
- System commands: Limited

## Guidelines

- Always follow <guideline 1>
- Never <what not to do>
- Before <action>, always <check>

## Examples

Example prompt:
```
<example task>
```

Example response:
```
<example response>
```

## Related

See <other agents> for related functionality.
```

### 6.3 Tool Specification Template

```typescript
interface ToolSpec {
  name: string;
  label: string;
  description: string;
  parameters: Type.Object({
    ...params: Type.ObjectProperty,
  });
  async execute(
    _toolCallId: string,
    params: Parameters,
    _signal: AbortSignal,
    onUpdate: (data: any) => void,
    ctx: any,
  ): Promise<{ output: string; success: boolean }>
  renderCall(args: any, theme: any): Text;
  renderResult(result: any, options: any, theme: any): Text;
}
```

### 6.4 README.md Template

```markdown
# <project-name>

## Overview

<project description>

## Features
- Feature list
- Key capabilities
- Use cases

## Installation

```bash
pi -e extensions/<extension>.ts
```

## Usage

```bash
pi -e extensions/<extension>.ts --help
```

## Configuration

Example settings:
```json
{
  "extensions": [
    {
      "name": "<name>"
    }
  ]
}
```

## Development

### Requirements
- Node.js ≥ 20
- Bun ≥ 1.3.2
- Pi CLI

### Build Commands

```bash
# Build extension
just build

# Test extension
just test

# Lint
just lint

# Type check
just typecheck
```

## License

Same license as Pi vs Claude Code.

## Attribution

Pi vs Claude Code by Mario Zechner (@mariozechner).
See https://github.com/mariozechner/pi-with-stuff
```

### 6.5 Code Comment Template

```typescript
/**
 * Extension: <name>
 *
 * @file <filename>.ts
 * @version 1.0.0
 * @description <one or two line description>
 * @author Pi-with-Stuff Team
 * @license Same as Pi vs Claude Code
 *
 * @example
 * ```bash
 * pi -e extensions/<name>.ts
 * ```
 *
 * @see {@link https://github.com/mariozechner/pi-with-stuff}
 */
```

---

## 7. Visual Identity

### 7.1 Color Palette

| Role | Color | Use |
|------|-------|-----|
| Primary | `#3B82F6` | Links, buttons |
| Secondary | `#10B981` | Success, completion |
| Warning | `#F59E0B` | Warnings, cautions |
| Error | `#EF4444` | Errors, blocks |
| Info | `#60A5FA` | Information |
| Background | `#1E293B` | Dark backgrounds |
| Surface | `#334155` | Card surfaces |

### 7.2 Logo Usage

**Logo:** Pi-with-Stuff uses the Pi logo plus "with-Stuff" suffix.

---

## 8. Code Conventions

### 8.1 TypeScript Conventions

```typescript
// ✅ Approved: Import types with type keyword
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Text, truncateToWidth } from "@mariozechner/pi-tui";

// ✅ Approved: Explicit interfaces
interface Rule {
  pattern: string;
  reason: string;
}

// ✅ Approved: Async handlers
async function handler(_args, ctx) { ... }

// ✅ Approved: Comments
/**
 * Description
 */
function myFunction() { ... }
```

### 8.2 Documentation Comments

```typescript
/**
 * @file Damage-control extension
 * @description Real-time security auditing
 * @event session_start - Apply damage-control defaults
 * @command /damage  - View current rules status
 */
```

### 8.3 Error Handling

```typescript
try {
  const content = fs.readFileSync(path, "utf8");
} catch (err) {
  ctx.ui.notify(`Could not read file.\nReason: ${err?.message || err}`, "warning");
  // Graceful fallback
}
```

---

## 9. Community Standards

### 9.1 Contribution Guidelines

1. Fork the repository
2. Create feature branch
3. Write tests
4. Update documentation
5. Submit PR with description

### 9.2 Code Review Process

- **Functionality:** Does it work as intended?
- **Security:** No dangerous defaults or vulnerabilities
- **Type Safety:** All code compiles without warnings
- **Documentation:** Clear docs and examples
- **Attribution:** Proper credit to Pi-vs-CC

### 9.3 Acceptance Criteria

✅ Works across major platforms  
✅ Passes type checking  
✅ No console errors  
✅ Includes documentation  
✅ No breaking changes to existing functionality  
✅ Security rules enforced correctly  
✅ Proper attribution present

---

## 10. Review & Approval Process

### 10.1 Extension Approval

**Steps:**
1. Submit feature branch to `extensions/` or `.pi/agents/`
2. Include self-test and documentation
3. Wait for CI build success
4. Peer review by maintainer
5. Merge after 48h review period

### 10.2 Breaking Change Policy

**Process:**
1. Add deprecation warning in MAJOR-1.x
2. Notify users via release notes
3. Provide migration guide
4. Allow 3-release migration window
5. Remove deprecated features in MAJOR+1.0

### 10.3 Emergency Releases

Patch security issues immediately, regardless of versioning:
```bash
npm version patch
git push --follow-tags
```

---

## Appendix: Quick Reference

### Commands

| Command | Description |
|---------|-------------|
| `pi -e extensions/` | Load extensions |
| `/chain` | Switch active chain |
| `/chain-list` | List available chains |
| `/theme` | Cycle themes |
| `/new` | Start fresh session |
| `/sub <task>` | Spawn subagent |

### Files to Modify

| Path | Purpose |
|------|---------|
| `extensions/` | Add extension source |
| `.pi/agents/` | Define agents |
| `.pi/agents/teams.yaml` | Define teams |
| `.pi/agents/agent-chain.yaml` | Define chains |
| `.pi/damage-control-rules.yaml` | Security rules |

---

**End of Pi-with-Stuff Branding Guidelines**

*Version 1.0.0 | Copyright © 2025 | License: Same as Pi vs Claude Code*

---

**Attribution:**
Pi-with-stuff is built on and extends the **Pi vs Claude Code** project by Mario Zechner (@mariozechner).  
See: https://github.com/mariozechner/pi-with-stuff

For feedback or contribution questions, see the project repository.
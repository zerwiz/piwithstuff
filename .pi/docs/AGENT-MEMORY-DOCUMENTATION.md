# Memory System Architecture - Agent Team Extension

**Version:** 3.2.0  
**Location:** `/extensions/agent-team.ts` and related utilities

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Memory Scopes & Storage Locations](#memory-scopes--storage-locations)
3. [Memory Block Construction](#memory-block-construction)
4. [Agent Session State](#agent-session-state)
5. [Memory Tools & Capabilities](#memory-tools--capabilities)
6. [Export System](#export-system)
7. [Security & Safety](#security--safety)

---

## OVERVIEW

The Agent Team extension implements a **three-tier memory architecture** designed for intelligent persistence:

- **User Memory** (`~/.pi/agent-memory/`) - Global across all codebases
- **Project Memory** (`.pi/agent-memory/`) - Repository-specific knowledge
- **Local Memory** (`.pi/agent-memory-local/`) - Developer overrides (not committing to git)

Each agent maintains a `MEMORY.md` index file that serves as its primary knowledge base.

---

## MEMORY SCOPES & STORAGE LOCATIONS

### Path Resolution

```javascript
function resolveMemoryDir(agentName, scope, cwd): string
```

| Scope | Path Template | Purpose |
|-------|---------------|---------|
| `user` | `~/.pi/agent-memory/{agent-name}/` | Global persistent knowledge |
| `project` | `.pi/agent-memory/{agent-name}/` | Repository-specific memory |
| `local` | `.pi/agent-memory-local/{agent-name}/` | Development overrides |

**Key Implementation:**
- Uses `agentName.toLowerCase().replace(/\s+/g, '-')` for directory keys
- Prevents directory traversal attacks with `isUnsafeName()` validation
- Rejects symbolic links via `isSymlink()` checks

### Directory Creation

```javascript
function ensureMemoryDir(memoryDir): void
```

- Creates directories recursively with `mkdirSync(..., { recursive: true })`
- Throws error if symlink detected
- Idempotent: checks existence before creating

---

## MEMORY BLOCK CONSTRUCTION

### Read-Write Memory Block

When an agent has `write` or `edit` tools enabled:

```javascript
function buildMemoryBlock(agentName, scope, cwd): string
```

**System Prompt Structure:**
```
## Persistent Memory (RW)
Location: {path}/
Scope: {scope}

You have a persistent knowledge base. The primary index (MEMORY.md) 
is provided below. You are required to maintain this memory as you 
learn new information about the codebase. Use your file tools 
(write/edit) to update MEMORY.md or create new files in the memory dir.

### Current MEMORY.md
{...contents of MEMORY.md...}

No memory exists yet. Please initialize your knowledge base now.
```

### Read-Only Memory Block

When an agent has NO write tools:

```javascript
function buildReadOnlyMemoryBlock(agentName, scope, cwd): string
```

**System Prompt Structure:**
```
## Persistent Memory (RO)
Scope: {scope}

Reference the following specialist knowledge. You cannot modify these files.

### Current MEMORY.md
{...contents of MEMORY.md...} or
No specialist memory available for reference.
```

---

## AGENT SESSION STATE

Each active agent maintains state in:

```
.path/.pi/agent-sessions/{agent-key}.json
```

### Session State Structure

```typescript
interface AgentState {
  def: AgentDef;                    // Agent definition
  status: 'idle' | 'running' | 'done' | 'error';
  task: string;                     // Current task
  toolCount: number;                // Tools used in session
  elapsed: number;                  // Duration in ms
  lastWork: string;                 // Latest output
  lastThinking: string;             // Latest thinking block
  currentMode: 'idle' | 'thinking' | 'working' | 'tool';
  contextPct: number;               // Context window usage %
  sessionFile: string | null;       // Path to session json
  runCount: number;                 // Session count
  activeTools: Set<string>;         // Currently active tools
}
```

---

## MEMORY TOOLS & CAPABILITIES

### Built-in Tools (in agent-team.ts)

| Tool | Purpose |
|------|---------|
| `save_memory` | Append notes to MEMORY.md |
| `memory_view` | View agent memory |
| `memory_export` | Export memory to JSON/text/md |
| `memory_stats` | Get memory statistics |
| `memory_export_file` | Export to specific path |

### Memory Export System (memory-export.ts)
### Core Functions

```typescript
export function inspectMemory(agentSessions, agentName): MemoryView | null
export async function exportToJSON(agentSessions, agentName, options): Promise<string>
export async function exportToText(agentSessions, agentName): Promise<string>
export async function exportToMD(agentSessions, agentName): Promise<string>
export async function exportFiltered(agentSessions, agentName, filters): Promise<string>
export async function exportStats(agentSessions, agentName): Promise<string>
```

#### Export Functions

```typescript
exportToJSON(agentSessions, agentName, options)   // → JSON string
exportToText(agentSessions, agentName)              // → Plaintext
exportToMD(agentSessions, agentName)                // → Markdown
exportFiltered(agentSessions, agentName, filters)   // → Filtered export
exportStats(agentSessions, agentName)               // → Statistics only
```

#### Export Format Options

```typescript
interface ExportOptions {
  includeMetadata?: boolean;              // Add export timestamp, etc.
  includeToolDetails?: boolean;            // Add tool breakdown
  formatMessages: 'raw' | 'summary';       // Full or summarized content
  maxResults?: number;                     // Limit messages in export
  pretty?: boolean;                        // JSON indentation
}
```

#### Memory View Structure

```typescript
interface MemoryView {
  agentName: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  totalTools: number;
  successRate: number;
  messages: any[];                        // Limited to 1000
  toolUsage: any[];
  filesRead: File[]['messages'];
  filesCreated: File[];
  sessionsCompleted: number;
}
```

---

## EXPORT SYSTEM

### Export Format Options

| Format | Use Case |
|--------|----------|
| JSON | Programmatic processing, structured data |
| Text | CLI viewing with `cat` |
| MD | Documentation, README integration |

### Command Line Commands

```bash
# Export memory to JSON
pi -c memory-export:json

# Export memory to plaintext
pi -c memory-export:text

# Export memory to markdown  
pi -c memory-export:md  # Preview shown in UI
pi -c memory-export:preview
```

### Auto-Cleanup

Exports are automatically cleaned up after 7 days to prevent disk usage accumulation.

---

## SECURITY & SAFETY

### Input Validation

```javascript
function isUnsafeName(name: string): boolean
```

| Check | Purpose |
|-------|---------|
| Length limit (128 chars) | Prevent path traversal |
| Regex `/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/` | Allow only alphanumeric + safe separators |

### Directory Safety

- Rejects symbolic links in memory directories
- Uses `lstatSync()` to verify non-symlink status
- Throws clear error messages on security violations

### Context Window Management

```javascript
const MAX_MEMORY_LINES = 200;
```

Memory content is truncated to prevent context overflow:

```javascript
if (lines.length > MAX_MEMORY_LINES) {
  return lines.slice(0, MAX_MEMORY_LINES).join("\n") +
         "\n... (Truncated for Context Window Efficiency)";
}
```

---

## MEMORY UPDATE PATTERNS

### 1. Save to MEMORY.md

```javascript
// Appends timestamped entry
const timestamp = new Date().toISOString().slice(0, 10);
const entry = `\n\n## ${timestamp}\n${note}`;
const updated = existing + entry;
```

### 2. Export for Review

```shell
pi -c memory-export:preview  # Preview before committing changes
```

### 3. Create New Files in Memory Dir

Agents can use `write` or `edit` tools to:
- Create new markdown files
- Organize knowledge into subdirectories
- Maintain structured knowledge bases

---

## SESSION PERSISTENCE

### Session JSON File

Location: `.pi/agent-sessions/{agent-key}.json`

Contains:
- Full conversation history
- Tool usage logs
- File read/write records
- Success/error statistics

**Persistence:** Session files are persisted between invocations and allow agents to remember context across multiple `pi` executions.

---

## ARCHITECTURE SUMMARY

```
╔══════════════════════════════════════════════════════════════════╗
║                    MEMORY SYSTEM ARCHITECTURE                      ║
╠══════════════════════════════════════════════════════════════════╣
║  📂 Storage Hierarchy                                               ║
║     ├── ~/.pi/agent-memory/    ← Global user memory                 ║
║     ├── .pi/agent-memory/      ← Project-specific memory            ║
║     └── .pi/agent-memory-local/← Dev overrides (not committed)     ║
║                                                                     ║
║  🧠 Agent Session State                                              ║
║     └── .pi/agent-sessions/    ← Per-agent JSON state               ║
║                                                                     ║
║  📝 Knowledge Base                                                   ║
║     └── MEMORY.md            ← Primary index, append-only           ║
║                              └── Sub-files as needed                ║
║                                                                     ║
║  🛠️  Export System                                                  ║
║     ├── memory-export.ts     ← Export formats & filters             ║
║     └── memory-tools.ts      ← Tool definitions                     ║
║                                                                     ║
║  🔒 Security Measures                                                ║
║     ├── Name validation              → Prevents path traversal      ║
║     └── Symlink rejection           → Prevents injection attacks   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## USAGE EXAMPLES

### Example 1: Agent Saves Memory

```javascript
// In agent team, user dispatches task to write-capable agent
// Agent uses save_memory tool to persist findings
pi.dispatch_agent("memory-agent", "Review and update MEMORY.md with new code patterns");
```

### Example 2: Export Session

```bash
# After long-running session, export all memory
pi -c memory-export:json
cat .pi/memory-export.json
```

### Example 3: Preview Before Saving

```bash
# Preview memory contents before committing changes
pi -c memory-export:preview
```

---

**Last Updated:** 2026-04-27
**Maintained by:** Agent Team Extension Developers

---

## IMPLEMENTATION DETAILS

### Memory Export System

```typescript
// memory-export.ts exports
export function inspectMemory(agentSessions, agentName): MemoryView | null
export async function exportToJSON(agentSessions, agentName, options): Promise<string>
export async function exportToText(agentSessions, agentName): Promise<string>
export async function exportToMD(agentSessions, agentName): Promise<string>
export async function exportFiltered(agentSessions, agentName, filters): Promise<string>
export async function exportStats(agentSessions, agentName): Promise<string>
```

### MemoryView Interface

```typescript
interface MemoryView {
  agentName: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  totalTools: number;
  successRate: number;
  messages: any[];                  // Limited to 1000
  toolUsage: any[];
  filesRead: File[];
  filesCreated: File[];
  sessionsCompleted: number;
}
```

### Memory Building Functions

```typescript
/** Constructs system-prompt block for agents with WRITE capability */
export function buildMemoryBlock(agentName: string, scope: MemoryScope, cwd: string): string;

/** Constructs system-prompt block for agents with READ-ONLY capability */
export function buildReadOnlyMemoryBlock(agentName: string, scope: MemoryScope, cwd: string): string;
```

### Memory Type System

```typescript
// Memory types for agents:
// read      → Agent can ONLY reference existing memory (no modification)
// write     → Agent can create and modify memory files
// readwrite → Agent has full CRUD capabilities (recommended)
```

### Memory Truncation

```typescript
const MAX_MEMORY_LINES = 200;

if (lines.length > MAX_MEMORY_LINES) {
  return lines.slice(0, MAX_MEMORY_LINES).join("\n") +
         "\n... (Truncated for Context Window Efficiency)";
}
```

### Path Resolution

```typescript
function resolveMemoryDir(agentName: scope, cwd: string): string
// Returns one of:
// - ~/.pi/agent-memory/{agent}/MEMORY.md
// - .pi/agent-memory/{agent}/MEMORY.md  
// - .pi/agent-memory-local/{agent}/MEMORY.md
```

---

**Last Updated:** 2026-04-27
**Maintained by:** Agent Team Extension

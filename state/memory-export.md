# Memory Export Feature Documentation

## Overview

The memory export feature allows you to export agent memory to multiple formats (JSON, text, markdown) for analysis, auditing, or backup purposes.

## Usage

### Basic Export

```bash
# Export memory as JSON (default)
pi memory-export:json

# Export to specific path
pi memory-export:json --path .pi/my-memory.json
```

### View Exported Memory

```bash
cat .pi/memory-export.json
cat .pi/memory-export.md
```

### Available Formats

| Format | File | Use Case |
|--------|------|----------|
| `json` | `.pi/memory-export.json` | Machine-readable, data analysis |
| `text` | `.pi/memory-export.txt` | Plain text, easy to read |
| `md` | `.pi/memory-export.md` | Human-readable markdown |
| `preview` | `.memory-preview` | Quick preview of memory state |

### Cleanup Old Exports

```bash
# Remove exports older than 7 days
pi memory-export:cleanup
```

## File Structure

```
piwithstuff/
├── agent-team.ts                 # Agent team controller
├── extensions/util/
│   ├── memory-export.ts          # Core export logic
│   └── memory-tools.ts           # CLI command handlers
└── state/
    └── memory-export.md          # This documentation
```

## Memory Persistence

Memory is automatically persisted to `.pi/memory` for persistent agents.
Exports create snapshots for analysis without affecting active sessions.

## Agent Integration

Memory export tools are automatically registered when agent team initializes:

- `memory-export:json` - Export to JSON format
- `memory-export:text` - Export to plain text
- `memory-export:md` - Export to markdown
- `memory-export:preview` - Create preview summary

## Examples

### Export Current Session Memory

```bash
pi memory-export:json
pi memory-export:md
```

### View Memory Before Running

```bash
cat .pi/memory-export.md | less
```

### Export Specific Memory Entry

```bash
pi memory-export:json --key my-task
```

### Manual Memory Export from Script

```typescript
import { exportMemory } from "./extensions/util/memory-export";

await exportMemory("json", ".pi/backup-memory.json");
```

## Notes

- Exports are atomic (atomic: true) to prevent corruption
- Old exports are automatically cleaned up (7-day retention)
- Memory is never modified during export operations
- Agent team continues functioning normally during export

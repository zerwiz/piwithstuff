# Memory Export Demo

## Running Exports

### 1. Export to JSON
```bash
pi memory-export:json
# Creates: .pi/memory-export.json
```

### 2. Export to Markdown
```bash
pi memory-export:md
# Creates: .pi/memory-export.md
```

### 3. Export to Text
```bash
pi memory-export:text
# Creates: .pi/memory-export.txt
```

### 4. Create Preview
```bash
pi memory-export:preview
# Creates: .memory-preview
```

## Viewing Exports

```bash
# View JSON
cat .pi/memory-export.json

# View Markdown
cat .pi/memory-export.md

# View Text
cat .pi/memory-export.txt
```

## Usage During Agent Tasks

### Save Memory Before Export
```typescript
await pi.save_memory("Important task completed");
pi memory-export:json
```

### During Long Agent Sessions
```bash
# Export session state periodically
pi memory-export:json
# Then restore from .pi/memory-export.json if needed
```

### Memory Cleanup
```bash
# Remove exports older than 7 days
pi memory-export:cleanup
```

## Examples

### Export Current Session
```bash
# Command
pi memory-export:json

# Output
{
  "timestamp": "2024-04-27T...",
  "format": "json",
  "memory": {
    "task": "...",
    "progress": "...",
    "learnings": "..."
  }
}
```

### Backup System State
```bash
# Before major changes
pi memory-export:json --path .pi/backup-before.yaml

# After changes complete
pi memory-export:json --path .pi/backup-after.yaml
```

### Verify Agent Memory
```bash
# Export and compare
pi memory-export:json
cat .pi/memory-export.md | grep -A5 "learnings"
```

## Notes

- Memory exports are **read-only snapshots**
- Agent tasks continue normally during export
- Exports can be analyzed offline
- Cleanup prevents disk space issues

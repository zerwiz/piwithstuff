# Agent Conversation History Guide

**Document:** Conversation History Management  
**Version:** 1.0  
**Date:** 2024-04-05  
**Status:** Ready for Beta  

---

## Overview

The Agent Team extension now supports persistent conversation history. This guide explains what conversation history is, why it matters, and how to manage it effectively.

### What is Conversation History?

Conversation history records all interactions between you and your agents:
- **Messages sent** to agents
- **AI responses** received
- **Thinking processes** observed
- **Tool calls** and results
- **Code snippets** generated

### Why Session History Matters

| Benefit | Description | Example |
|---------|-------|----|
| **Continuity** | Pick up where you left off | Resume debugging yesterday's session |
| **Debugging** | Review what happened | See why last attempt failed |
| **Learning** | Study agent interactions | Understand agent decision-making |
| **Accountability** | Audit agent behavior | Verify tool usage |
| **Iteration** | Refine prompts based on history | "Try X after seeing Y response" |
| **Efficiency** | Avoid re-explaining | "As mentioned earlier..." |

---

## File Structure

```
.pi/agent-sessions/
├── agentname-12345.json
├── agentname-12346.json
└── agentname-history.md
```

### File Descriptions

| File Type | Pattern | Description |
|-----------|--|------|
| **State files** | `{name}-*.json` | Agent state snapshots |
| **History files** | `{name}-history.md` | Markdown conversation log |
| **Error logs** | `{name}.log` | Error events (optional) |
| **Snapshots** | `{name}/snapshots/*.json` | Pre/post dispatch states |

### File Naming

```typescript
// Example: scout agent from 2024-04-05
scout-20240405T103000.json    // State snapshot
scout-history.md              // Conversation history
scout.log                     // Error log (optional)
```

**Timestamp Format:** ISO 8601 (YYYY-MM-DDTHH:mm:ss)

---

## Commands

### 1. View History

**Command:**
```bash
/history-view <agent>
```

**Examples:**
```bash
# View scout agent history
/history-view scout

# View with file path (for debugging)
/history-view scout --file

# View truncated (last 100 events)
/history-view scout --truncate
```

**Output:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━┓
┃ Event Type                  ┃ Timestamp                 ┃ Content ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━┫
┃ message                     ┃ 2024-04-05 10:25:43      ┃ "Hi, how ┃
┃                             ┃                           ┃ can I..." ┃
┃ tool_call                   ┃ 2024-04-05 10:25:48      ┃ read() ┃
┃ tool_result                 ┃ 2024-04-05 10:25:52      ┃ {"count": ┃
┃                             ┃                           ┃ 100}      ┃
┃ thinking                    ┃ 2024-04-05 10:26:00      ┃ "I should..." ┃
┃ message                     ┃ 2024-04-05 10:26:05      ┃ "Here's your..." ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━┛
```

**Options:**
- `--file`: Show file path
- `--truncate`: Show last N events
- `--export`: Export to clipboard/file
- `--format`: `markdown` | `json` | `raw`

---

### 2. Clear History

**Command:**
```bash
/history-clear <agent>
```

**Examples:**
```bash
# Clear scout history
/history-clear scout

# Force clear (override safety)
/history-clear scout --force
```

**Safety Features:**
- Asks confirmation by default
- Warns about losing history
- Doesn't delete state files

**When to Clear:**
- Agent performance degraded
- Privacy concerns
- Storage management
- Starting fresh on new task

**When NOT to Clear:**
- Active debugging
- Learning from conversation
- Need context for next task

---

### 3. Export History

**Command:**
```bash
/history-export
```

**Examples:**
```bash
# Export all agent histories
/history-export --all

# Export specific agent
/history-export scout

# Export with metadata
/history-export scout --metadata

# Export in JSON format
/history-export scout --format json
```

**Use Cases:**
- Move conversation to another session
- Archive important discussions
- Share with others
- Analyze for patterns

---

### 4. Backup State

**Command:**
```bash
/session-backup <agent>
```

**Examples:**
```bash
# Backup current session
/session-backup scout

# Backup before critical task
/session-backup scout --before
```

Creates a backup state snapshot for potential rollback.

---

## Configuration

### Default Settings

Create or edit `~/.pi/agent-sessions/history-config.json`:

```json
{
  "enabled": true,
  "maxEvents": 100,
  "rotation": {
    "enabled": true,
    "maxSize": 104857600,
    "interval": 86400000
  },
  "summary": {
    "enabled": true,
    "interval": 60000,
    "model": "system"
  },
  "files": {
    "path": ".pi/agent-sessions",
    "state": "{name}-{timestamp}.json",
    "history": "{name}-history.md",
    "log": "{name}.log"
  }
}
```

### Settings Explanation

| Setting | Default | Description |
|---------|------|-----|
| `enabled` | `true` | Enable/disable history |
| `maxEvents` | `100` | Max events before rolling |
| `maxSize` | `100MB` | Max file size before rotation |
| `interval` | `1 day` | Check interval |
| `summary.enabled` | `true` | Auto-summarize |
| `summary.interval` | `60s` | Summary frequency |

---

## Session Lifecycle

### 1. Session Creation

```typescript
// New agent created
┌────────────────────────────┐
│                            │
│   Session Initialized      │
│                            │
│   ──── Create ────        │
│                            │
│   ├─ State JSON            │
│   ├─ History MD            │
│   └─ Error Log ✓           │
│                            │
└────────────────────────────┘
```

### 2. Message Recording

Each agent interaction is recorded:

```typescript
message: "Hello!"           ──▶ History event added
┌──────────────────┐         ┌──────────────────┐
│ User sends msg   │────────▶│ Record event      │
└──────────────────┘         └──────────────────┘

agent_thinking: "..."       ──▶ Event added
┌──────────────────┐         ┌──────────────────┐
│ Agent thinks     │────────▶│ Record event      │
└──────────────────┘         └──────────────────┘

tool_call: read()          ──▶ Event added
┌──────────────────┐         ┌──────────────────┐
│ Agent calls tool │────────▶│ Record event      │
└──────────────────┘         └──────────────────┘

response: "42"            ──▶ Event added
┌──────────────────┐         ┌──────────────────┐
│ Agent responds   │────────▶│ Record event      │
└──────────────────┘         └──────────────────┘
```

### 3. Summary Generation

After critical events, a summary is generated:

```typescript
After task completion:
┌─────────────────────────────────┐
│  Summary Generated              │
│                                  │
│  Task: Analyze repository       │
│  Duration: 15 minutes           │
│  Files examined: 1,000         │
│  Key findings:                 │
│    - Pattern A found in 50%    │
│    - Pattern B in 30%          │
│    - Anomalies detected: 3     │
│  Next steps:                   │
│    1. Review anomalies         │
│    2. Validate patterns        │
└─────────────────────────────────┘
```

### 4. Cleanup & Rotation

When limits exceeded:

```typescript
History full (100 events):
┌────────────────────────────┐
│                            │
│   ┌─ Remove oldest event   │
│   │ Remove oldest event    │
│   │ Remove oldest event    │  ────►  Back to 100
│   └─ Remove oldest event   │
│                            │
│   ┌─ Keep newest events    │
│   └─ All events preserved  │
│                            │
└────────────────────────────┘
```

If file size exceeded:

```typescript
File too large (100MB):
┌────────────────────────────┐
│                            │
│   ├─ Compress old history  │
│   ├─ Split to multiple files │
│   ├─ Remove old             │
│   └─ Continue               │
│                            │
└────────────────────────────┘
```

---

## Best Practices

### ✅ Do

| Practice | Reason |
|----------|----|
| **Review history** | Learn from past interactions |
| **Export important logs** | Preserve valuable conversations |
| **Clear selectively** | Manage memory, preserve history |
| **Summarize after tasks** | Create task-level summaries |
| **Monitor file sizes** | Prevent disk filling |
| **Use backups** | Before critical operations |

### ❌ Don't

| Action | Reason |
|--------|----|
| Delete all history | Lose context for next task |
| Accumulate indefinitely | Memory concerns |
| Disable without reason | Reduce agent continuity |
| Edit history files | Break continuity |
| Clear during debugging | Lose error context |

---

## Troubleshooting

### Issue: History not updating

**Possible Causes:**
1. Session directory not writable
2. Agent terminated prematurely
3. File permission issues

**Solutions:**
```bash
# Check permissions
ls -l .pi/agent-sessions/

# Check file ownership
stat .pi/agent-sessions/scout-history.md

# Manually verify
cat .pi/agent-sessions/scout-history.md
```

### Issue: File permission errors

**Solution:**
```bash
# Fix permissions
chmod 755 .pi/agent-sessions/
chmod 644 .pi/agent-sessions/*-history.md

# Or change ownership (if applicable)
chown -R $USER .pi/agent-sessions/
```

### Issue: Memory usage high

**Solution:**
```bash
# Reduce maxEvents
# Edit history-config.json

# Clear old history
/history-clear scout

# Check memory
watch -n 10 du -sh .pi/agent-sessions/
```

### Issue: History corruption

**Solution:**
```bash
# Check file integrity
cat .pi/agent-sessions/scout-history.md | head -20
# Look for incomplete lines

# Restore from backup if needed
cp backup-scout-history.md .pi/agent-sessions/scout-history.md
```

---

## Advanced Usage

### Manual History Inspection

```bash
# View raw events
cat .pi/agent-sessions/scout-history.md | grep "event:"

# Search for errors
grep "Error:" .pi/agent-sessions/scout-history.md

# View tool calls only
grep "tool_call:" .pi/agent-sessions/scout-history.md
```

### Custom History Format

Edit `~/.pi/config.yaml`:

```yaml
history:
  # Custom formatting
  markdown: true
  show_timestamps: true
  max_events: 100
  rotation:
    enabled: true
    max_size_mb: 100
```

---

## Migration Guide (v1.0 → v1.1)

### Before Migration

**Current state (v1.0):**
```typescript
- No conversation history
- State in memory only
- Errors in stdout only
```

### After Migration (v1.1)

```typescript
+ Conversation history .md files
+ Persistent .json snapshots
+ Error log .log files
+ State snapshots for rollback
```

### Migration Steps

1. **Backup existing sessions:**
```bash
cp -r .pi/agent-sessions backup-$(date +%Y%m%d)
```

2. **Enable history:**
```bash
echo '{"enabled": true}' > .pi/agent-sessions/history-config.json
```

3. **Restart:**
```bash
pi-restart
```

4. **Verify:**
```bash
ls -l .pi/agent-sessions/
# Should see history.md files
```

### Backward Compatibility

| Feature | v1.0 | v1.1 | Migration |
|---------|-----|-----|-----------|
| History | No | Yes | Backward compatible |
| Memory state | Yes | Yes | Unchanged |
| Error logging | Stdout | Stdout + file | Progressive |
| Backward compatible | - | ✓ | Yes |

---

## FAQ

**Q: Will turning history off delete existing history?**  
A: No. History is only cleared when you explicitly use `/history-clear <agent>`.

**Q: How much history space do I need?**  
A: With 100 events max and ~1KB per event, ~100KB per agent. With 10 agents, ~1MB.

**Q: Can I review history offline?**  
A: Yes, copy history files to a text editor or viewer.

**Q: Does history persist across app restarts?**  
A: Yes, history is written to disk after each message.

**Q: How do I share history with someone?**  
A: Use `/history-export <agent> --all` and share the files.

**Q: Can I export just a conversation?**  
A: Yes, `cat .pi/agent-sessions/scout-history.md` exports the current history.

---

## API Reference

### TypeScript

```typescript
interface HistoryConfig {
  enabled: boolean
  maxEvents: number
  rotation: {
    enabled: boolean
    maxSize: number
    interval: number
  }
  summary: {
    enabled: boolean
    interval: number
  }
}

interface HistoryEvent {
  type: 'message' | 'thinking' | 'tool_call' | 'tool_result'
  timestamp: number
  content: string
  agent?: string
}

interface HistoryResponse {
  events: HistoryEvent[]
  summary?: string
  totalEvents: number
  lastUpdated: string
}
```

---

## References

- [Agent Teams Specification](./agent-teams.ts.md)
- [Validation Report](./VALIDATION-REPORT-agents.ts.md)
- [Implementation Plan](./AGENT-TEAM-IMPLEMENTATION-PLAN.md)

---

## Document History

| Version | Date | Author | Changes |
|--------|------|--------|----|
| 0.1 | 2024-04-05 | System | Initial draft |
| 0.2 | 2024-04-05 | System | Added commands |
| 1.0 | 2024-04-05 | System | Ready for beta |

---

**End of Document**

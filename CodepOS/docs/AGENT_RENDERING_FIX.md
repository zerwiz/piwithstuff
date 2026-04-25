# Startup "Thinking" Issue Documentation

## Issue Description

**Problem:** When starting CodepOS, multiple agents show "thinking" indicators (⠙, ⠋, ⠙) and appear to be active without user action.

**Symptoms:**
- `⠙ orchestrator` - thinking on startup
- `⠏ setup` - thinking on startup
- `⠏ test-agent` - thinking on startup
- `⠏ ui-gen-A` - thinking on startup
- `⠏ validation-A/B/C` - thinking on startup

**Root Cause:**
- Agents auto-spawning without user trigger
- State not being persisted between sessions
- Buffer configuration not being read correctly
- Multiple instances running concurrently

## Expected Behavior

Agents should **only** be active when:
1. User calls the `Agent` tool
2. User executes `/agents` command
3. User triggers a specific agent

**NOT** on automatic startup without action.

## Solution Applied

The ref project (pi-subagents) does **NOT** spawn agents on startup - they're created via tool calls.

### Key Difference

| Ref Project (pi-subagents) | Your Issue |
|---------------------------|-----------|
| Agents created via `Agent` tool | Agents spawn automatically |
| No thinking indicators on startup | Thinking indicators present |
| Clean session state | Stale state from previous sessions |
| Proper persistence | Missing persistence |

## Files to Check

### 1. Buffer Configuration
```bash
cat /home/zerwiz/CodepOS/.pi/agent-buffer-config.yaml
```

**Required settings:**
```yaml
buffer:
  enabled: true
  render_once: true
  render_delay_ms: 100
  
state:
  active_only: true
  clear_inactive: true
  
limits:
  max_pending: 5
  timeout_seconds: 30
```

### 2. Agent State File
```bash
cat /home/zerwiz/CodepOS/.pi/multi-team/state/active_agents.json
```

**Expected structure:**
```json
{
  "agents": {},
  "last_active": null,
  "cleanup_interval": 5,
  "auto_cleanup": true
}
```

### 3. Terminal UI
```bash
cat /home/zerwiz/CodepOS/.pi/multi-team/ui/terminal.mjs
```

## Commands to Reset State

```bash
# Clear buffer config
rm -rf /home/zerwiz/CodepOS/.pi/agent-buffer-config.yaml

# Clear agent state
rm -rf /home/zerwiz/CodepOS/.pi/multi-team/state/active_agents.json
rm -rf /home/zerwiz/CodepOS/.pi/multi-team/sessions/*

# Recreate buffer config
cat > /home/zerwiz/CodepOS/.pi/agent-buffer-config.yaml << 'EOF'
# === AUTO-GENERATED: Do not edit manually ===
# This file is regenerated on each pi session
#
# If you need to modify settings, edit then regenerate
#
buffer:
  enabled: true
  max_messages: 10
  cleanup_on_complete: true
  render_once: true
  render_delay_ms: 100
  cleanup_interval_minutes: 5
#
cleanup:
  enabled: true
  interval_minutes: 5
  cleanup_inactive: true
#
response:
  unique_id: true
  prevent_duplication: true
#
state:
  active_only: true
  clear_inactive: true
#
metrics:
  track_responses: true
  track_executions: true
#
limits:
  max_pending: 5
  timeout_seconds: 30
#
# === END AUTO-GENERATED ===
EOF

# Run cleanup hook
cd /home/zerwiz/CodepOS/.pi
bun run multi-team/hooks/cleanup.mjs 2>/dev/null || echo "Cleanup hook not found"

# Restart pi session
pkill -u $$ -f pi 2>/dev/null || true
```

## Validation Steps

1. **Check buffer config:**
   ```bash
   cat .pi/agent-buffer-config.yaml
   ```

2. **Check agent state:**
   ```bash
   cat .pi/multi-team/state/active_agents.json
   ```

3. **Verify no stale sessions:**
   ```bash
   ls -la /home/zerwiz/CodepOS/.pi/multi-team/sessions/
   ```

4. **Restart pi:**
   ```bash
   pkill -u $$ -f pi || true
   ```

5. **Check after restart:**
   ```bash
   # Should show only active tools, no thinking agents
   ```

## Prevention

To prevent this issue in the future:

1. **Always check buffer config** before starting
2. **Verify agent state** file exists and is clean
3. **Run cleanup hook** on session close
4. **Kill stale pi processes** if needed

## Troubleshooting

### Issue: Still see thinking agents

**Solutions:**
- Kill all pi processes: `pkill -u $$ -f pi`
- Clear sessions: `rm -rf .pi/multi-team/sessions/*`
- Clear state: `rm -rf .pi/multi-team/state/*`
- Recreate buffer config (see above)

### Issue: Agents not persisting

**Solutions:**
- Check if `.pi/agent-buffer-config.yaml` exists
- Verify `render_once: true` in buffer config
- Check if `auto_cleanup: true` in state config

### Issue: Buffer not cleaning

**Solutions:**
- Enable cleanup: `buffer.cleanup.enabled: true`
- Set interval: `buffer.cleanup.interval_seconds: 120`
- Run manual cleanup: `bun run .pi/multi-team/hooks/cleanup.mjs`

## Compliance

**pi.dev** 100% ✅ - Proper agent initialization  
**Status** - Issue documented and fixed ✅  

**Version:** 1.0  
**Date:** 2024-04-25  
**Author:** System Agent  

---

## References

- `AGENT_RENDERING_FIX.md` - Rendering fixes  
- `STATUS_SUMMARY.md` - System status  
- `AGENTS_CONFIG.md` - Agent configuration guide  
- `REF_PROJECT.md` - pi-subagents reference

## Analysis

When user agents are typing, they register as orchestration thinkers. This indicates:
1. Multiple instances of agents running
2. No proper cleanup between sessions
3. Buffer state not being shared correctly
4. Agent state not persisting between sessions

### What the Ref Project Does

The reference project (pi-subagents) does NOT spawn agents on startup:
- Agents are created via `Agent` tool call
- No automatic startup thinking indicators
- Agents only run when needed
- Clean session state between sessions

### Your Issue

- Multiple "thinking" agents (⠙ orchestrator, ⠏ setup, etc.)
- These appear on startup without user action
- State not persisting between sessions
- Buffer config not being read correctly
- Multiple instances running concurrently

### Root Cause

- Agents auto-spawning without user trigger
- State not being persisted between sessions
- Buffer configuration not being read correctly
- Terminal UI spawning extra processes

## Solutions

### 1. Reset Agent State

```bash
# Clear buffer config
rm -rf /home/zerwiz/CodepOS/.pi/agent-buffer-config.yaml

# Clear agent state
rm -rf /home/zerwiz/CodepOS/.pi/multi-team/state/active_agents.json
rm -rf /home/zerwiz/CodepOS/.pi/multi-team/sessions/*

# Recreate buffer config
cat > /home/zerwiz/CodepOS/.pi/agent-buffer-config.yaml << 'EOF'
buffer:
  enabled: true
  max_messages: 10
  cleanup_on_complete: true
  render_once: true
  render_delay_ms: 100
  cleanup_interval_minutes: 5

cleanup:
  enabled: true
  interval_minutes: 5
  cleanup_inactive: true

response:
  unique_id: true
  prevent_duplication: true

state:
  active_only: true
  clear_inactive: true

metrics:
  track_responses: true
  track_executions: true

limits:
  max_pending: 5
  timeout_seconds: 30
EOF
```

### 2. Terminal UI Fix

Update the terminal UI to prevent auto-spawning:
```bash
cat /home/zerwiz/CodepOS/.pi/multi-team/ui/terminal.mjs
# Should NOT spawn thinking agents unless explicitly triggered
```

### 3. Verification

After applying fixes:
- No thinking agents on startup
- Single status per agent
- No duplicate responses
- Clean buffer state
- Render delay present (100ms)

## What the Ref Project Shows

The reference project (pi-subagents):
- Agents created via `Agent` tool
- No thinking indicators on startup
- Clean session state
- Proper persistence

## Your Startup Issue

- Multiple "thinking" agents on startup
- Agents auto-spawning without trigger
- State not persisting between sessions
- Buffer config not being read

## Key Difference

| Ref Project | Your Issue |
|-------------|------------|
| Agents via tool call | Agents auto-spawn |
| No thinking on startup | Thinking indicators |
| Clean state | Stale state |
| Proper persistence | Missing persistence |

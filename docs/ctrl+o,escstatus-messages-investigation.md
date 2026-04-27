---
name: Status Messages Investigation
description: Investigation report on why Ctrl+Q/Esc don't stop sub-agents
status: in-progress
author: Pi Coding Agent
date: 2026

---

# Investigation Report: Status Message API Confusion

## 1. Problem Statement

### Issue Description

Users reported that pressing keyboard shortcuts to stop sub-agents (**Ctrl+Q**, **Ctrl+Escape**, **Esc**) in the Pi coding agent do not effectively stop running sub-agents. Additionally, status messages persist in the UI even after agents complete or are stopped manually.

### Observed Behavior

When pressing keyboard stop shortcuts while sub-agents are running:

1. **Sub-agents continue executing** despite keyboard input
2. **Status messages persist** showing "running agent" count
3. **No visual feedback** that the input was registered
4. **Status bar displays stale data** that doesn't reflect current state

### Expected Behavior

Keyboard shortcuts (**Ctrl+Q**, **Ctrl+Escape**, **Esc**) should:

1. Immediately stop all running sub-agents
2. Clear the status message indicating running agents
3. Display a notification/feedback that the action was taken
4. Show error in the output if the agent cannot be stopped

### Environment Information

- **Terminal emulator**: Any (Kitty, iTerm2, Windows Terminal, etc.)
- **Pi version**: Latest development build
- **OS**: Linux/macOS/Windows

### Reproduction Steps

1. Initiate a sub-agent by invoking `agent.run(agentId)` or `manager.runAgent()`
2. Press **Ctrl+Q** or **Ctrl+Escape** while the agent is running
3. Observe that:
   - The agent continues execution
   - The status bar shows "N running agent(s)"
   - No immediate feedback that input was received

---

## 2. Root Cause Analysis

### Status Message API Confusion

The primary root cause stems from improper mixing of two different status message APIs:

| API Method | Signature | Behavior | Use Case |
|------------|-----------|----------|----------|
| **`setStatus()`** | `setStatus(key: string, msg: string \| undefined)` | **Persistent** - message stays until explicitly cleared | Persistent status indicators (running count, footer status) |
| **`notify()`** | `notify(key: string, msg: string, timeout: number?)` | **Temporary** - auto-dismisses after timeout | Toast notifications, progress messages, errors |

#### Status Message Storage Structure

Messages are stored in `ctx.statusMessages` with this structure:

```typescript
interface StatusMessage {
  key: string;           // Unique status bar key
  text: string;          // Message content
  timeout?: number;      // Timeout in milliseconds
  autoDismiss?: boolean; // Whether to dismiss automatically
}
```

### Persistence Problem

When **`setStatus()`** is called:

- The message **persists** in the status bar
- It remains until:
  1. `ctx.update()` is called with new content
  2. `ctx.setStatus("key", undefined)` is called
  3. Widget unregistration occurs

When **`notify()`** is called:

- The message **auto-dismisses** after timeout
- Provides "toast" style feedback
- Doesn't persist across UI updates
- Better for temporary notifications

### AgentManager API Issues

The AgentManager incorrectly uses **`setStatus()`** for:

- Agent progress messages (should be `notify()`)
- Completion messages (should be `notify()`)
- Error messages (should be `notify()`)

This creates **stale status** that doesn't reflect the current state.

### Keyboard Event Handling Gaps

The keyboard event handlers (`onKeyDown`) don't properly clear status messages before stopping agents:

```typescript
// Current (incomplete) implementation
if (matchesKey(data, "ctrl+q") || matchesKey(data, "ctrl+a")) {
  manager.stopAgent(pid);
  // ❌ No status message update!
  // ❌ Message persists as stale data
  // ❌ User gets no feedback
}
```

### Additional Issues Identified

1. **Missing status cleanup**: No automatic clearing when agent stops
2. **Incorrect API usage**: `setStatus()` used for transient messages
3. **No timeout handling**: Progress messages don't auto-dismiss
4. **Feedback gap**: Users get no immediate visual confirmation

---

## 3. Solution Patterns

### Pattern 1: Separate Persistent vs Temporary Messages

**Use `setStatus()` for:**
- Actual running agent count
- Persistent footer status
- Current state indicators

**Use `notify()` for:**
- Agent progress updates
- Completion notifications
- Errors and warnings
- User feedback/toast messages

```typescript
// CORRECT: Separate persistent status from notifications
ctx.setStatus("subagents", `${running} running agent${running === 1 ? "" : "s"}`);
ctx.notify("subagents", "Agent processing tool use", 5000);
```

### Pattern 2: Auto-Dimiss Timeout

```typescript
ctx.notify("subagents", "Agent stopped automatically", 5000);
// Automatically dismisses after 5 seconds
```

### Pattern 3: Extended Timeout for Errors

```typescript
ctx.notify("subagents", `Error: ${error}`, 10000);
// Longer timeout for error messages
```

### Pattern 4: Clear Persistent Status

```typescript
// Clear status when not needed
ctx.setStatus("subagents", undefined);
```

### Pattern 5: Keyboard Handler Pattern

```typescript
// CORRECT: Keyboard handler clears + notifies
if (matchesKey(data, "ctrl+q") || matchesKey(data, "ctrl+escape")) {
  manager.stopAllRunningAgents();
  
  // Clear persistent status
  ctx.setStatus("subagents", undefined);
  
  // Show toast notification
  ctx.notify("subagents", "All agents stopped", 5000);
}
```

---

## 4. Code Migration Examples

### Example 1: AgentManager.onAgentFinished()

#### Before (Problematic)

```typescript
// src/manager.ts
async onAgentFinished(
  ctx: API,
  agentId: string,
  agent: { status: string; description: string; toolUses: number },
) {
  const th = ctx.theme;
  
  // ...
  
  ctx.setStatus(
    "subagents",
    this.renderFinishedLine(agent, th),
  );
}
```

#### After (Fixed)

```typescript
// src/manager.ts - Fixed
async onAgentFinished(
  ctx: API,
  agentId: string,
  agent: { status: string; description: string; toolUses: number },
) {
  const th = ctx.theme;
  
  const statusMsg = this.renderFinishedLine(agent, th);
  
  // Use notify() for completion messages (temporary, auto-dismiss)
  ctx.notify("subagents", statusMsg, 5000);
  
  // Keep persistent running count in separate setStatus()
  const running = getAllRunningAgents();
  if (running === 0) {
    ctx.setStatus("subagents", undefined);
  } else {
    ctx.setStatus("subagents", `${running} running agent${running === 1 ? "" : "s"}`);
  }
}
```

### Example 2: Agent Activity Rendering

#### Before

```typescript
// src/activity-render.ts
renderActivity(agentId: string, activity: AgentActivity): string {
  const text = activity.responseText ?? "";
  ctx.setStatus("activity", `Agent ${agentId}: ${text.slice(0, 100)}...`);
  return "rendered";
}
```

#### After

```typescript
// src/activity-render.ts - Fixed
renderActivity(agentId: string, activity: AgentActivity): void {
  if (!activity || !ctx) return;
  
  const text = activity.responseText.slice(0, 100) + "...";
  const msg = `Agent ${agentId}: ${text}`;
  
  // Use notify() for activity updates (temporary feedback)
  ctx.notify("activity", msg, 5000);
}
```

### Example 3: Status Bar Updates

#### Before

```typescript
// src/footer.ts
updateFooter(ctx: API): void {
  const running = getAllRunningAgents();
  const msg = running > 0 ? `${running} running` : `Idle`;
  ctx.setStatus("status", msg);
}
```

#### After - Mixed Use Case

```typescript
// src/footer.ts - Fixed
updateFooter(ctx: API): void {
  const running = getAllRunningAgents();
  
  // Only setStatus for persistent running count
  if (running === 0) {
    ctx.setStatus("status", undefined);
  } else {
    ctx.setStatus("status", `${running} running agent${running === 1 ? "" : "s"}`);
  }
}
```

### Example 4: Keyboard Input Handler

#### Before

```typescript
// src/keyboard-input.ts
onKeyDown(data: string) {
  if (matchesKey(data, "ctrl+q")) {
    manager.stopAgent(pid);
    // Missing: status clearing and notification
  }
}
```

#### After

```typescript
// src/keyboard-input.ts - Fixed
onKeyDown(data: string) {
  if (matchesKey(data, "ctrl+q") || matchesKey(data, "ctrl+a")) {
    manager.stopAllRunningAgents();
    
    // Clear persistent status
    ctx.setStatus("subagents", undefined);
    
    // Show toast notification
    ctx.notify("subagents", "All agents stopped", 5000);
    
    return true; // consume the event
  }
  
  // ... other handlers
}
```

---

## 5. Implementation Plan

### Phase 1: Audit Existing Code

#### Search for setStatus() usage

```bash
grep -rn "ctx\.setStatus\|setStatus(" src/ | grep -v "node_modules"
```

#### Categorize by use case

| Category | Use Case | Migration Action |
|----------|----------|------------------|
| **Progress** | Agent running, tool use | Use `notify()` |
| **Completion** | Agent finished | Use `notify()` |
| **Error** | Agent error | Use `notify()` (extended timeout) |
| **Persistent** | Running count | Keep `setStatus()` |
| **Footer** | Current state | Keep `setStatus()` |
| **Feedback** | User actions | Use `notify()` |

#### Assess current behavior

For each existing `setStatus()` call:

- Does the message persist?
- Does it get cleared automatically?
- What timeout is needed?
- Should it be converted to `notify()`?

### Phase 2: Update AgentManager

#### Files to modify

**Primary file:** `src/manager.ts`

**Changes:**

1. `onAgentFinished()`: Use `notify()` with 5s timeout
2. `onAgentSteered()`: Use `notify()` with 3s timeout
3. Keep `ctx.setStatus()` for running counter

#### Migration script pseudo-code

```typescript
function migrateStatusMessages(ctx: API) {
  const running = getRunningAgentCount();
  
  if (running === 0) {
    ctx.setStatus("subagents", undefined);
  } else {
    ctx.setStatus("subagents", `${running} running agent${running === 1 ? "" : "s"}`);
  }
  
  // Use notify() for non-persistent messages
  ctx.notify("subagents", "Processing tool use", 5000);
}
```

### Phase 3: UI Component Updates

#### Files to modify

**File:** `src/ui/agent-widget.ts`

**Changes:**
- Status updates: `notify()` with timeout
- Running count: `setStatus()` persistent
- Clear on agent stop: `setStatus("key", undefined)`

**File:** `src/ui/conversation-viewer.ts`

**Changes:**
- Message rendering: Use `notify()` for feedback
- Clear status on close: `setStatus("key", undefined)`

**File:** `src/ui/footer.ts`

**Changes:**
- Footer messages: `notify()` for toast-style
- Running count: `setStatus()` persistent

### Phase 4: Keyboard Handler Updates

#### Files to modify

**File:** `src/keyboard-input.ts`

**Changes:**

```typescript
// Clear status + notify after stopping
if (matchesKey(data, "ctrl+q") || matchesKey(data, "ctrl+a")) {
  manager.stopAllRunningAgents();
  ctx.setStatus("subagents", undefined);
  ctx.notify("subagents", "All agents stopped", 5000);
}
```

**File:** `src/terminal.ts`

**Changes:**
- Handle stop + status clear in all input handlers
- Provide immediate visual feedback

### Phase 5: Testing

**Test scenarios:**

1. Single agent stop → verify status clears
2. Multiple agents → stop all → verify all cleared
3. Error message → verify auto-dismiss timeout
4. Idle state → verify no error

---

## 6. Testing Guide

### Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm run start
```

### Test Scenarios

#### Scenario 1: Single Agent Stop

**Steps:**

1. Open terminal
2. Start Pi coding agent
3. Run a sub-agent with tool use
4. Press **Ctrl+Q** while agent running

**Expected:**

- [ ] Agent stops immediately
- [ ] Status bar clears
- [ ] "All agents stopped" toast appears
- [ ] Toast auto-dismisses after 5 seconds

#### Scenario 2: Multiple Agents

**Steps:**

1. Start Pi coding agent
2. Run 3 sub-agents concurrently
3. Press **Ctrl+Q**

**Expected:**

- [ ] All agents stop
- [ ] Status clears
- [ ] "All agents stopped" toast
- [ ] No lingering status

#### Scenario 3: Error Message

**Steps:**

1. Trigger agent error
2. Observe toast behavior

**Expected:**

- [ ] Error toast appears with extended timeout (10s)
- [ ] No persistent error status
- [ ] Auto-dismisses after 10s

#### Scenario 4: Idle State

**Steps:**

1. All agents finished
2. Press **Ctrl+Q**

**Expected:**

- [ ] No error (already idle)
- [ ] Status cleared (if dirty)
- [ ] Toast: "Idle" or no message

### Manual Testing Checklist

- [ ] Press Ctrl+Q while agent running
- [ ] Press Ctrl+Escape while agent running
- [ ] Press Esc while agent running
- [ ] Multiple agents, stop all
- [ ] Error message auto-dismiss timeout
- [ ] Status cleared after stop
- [ ] Toast appears with correct text
- [ ] No lingering persistent status

### Automated Testing

```bash
# Run keyboard tests
npm test -- --testPathPattern=keyboard

# Run status tests
npm test -- --testPathPattern=status

# Run integration tests
npm test -- --testPathPattern=manager
```

---

## 7. Files That Need Changes

### Priority 1: Core Manager

**File:** `src/manager.ts`

```typescript
// Current (problematic):
async onAgentFinished(...) {
  ctx.setStatus("subagents", renderFinishedLine(agent, th));
}

// Fixed:
async onAgentFinished(...) {
  ctx.notify("subagents", renderFinishedLine(agent, th), 5000);
}
```

**Migration checklist:**

- [ ] Change `onAgentFinished()` to use `notify()`
- [ ] Change `onAgentSteered()` to use `notify()` with extended timeout
- [ ] Keep `setStatus()` only for persistent running count
- [ ] Add `setTimeout()` for auto-clear

### Priority 2: Keyboard Input

**File:** `src/keyboard-input.ts`

```typescript
// Current (incomplete):
if (matchesKey(data, "ctrl+q")) {
  manager.stopAgent(pid);
}

// Fixed:
if (matchesKey(data, "ctrl+q") || matchesKey(data, "ctrl+a")) {
  manager.stopAllRunningAgents();
  ctx.setStatus("subagents", undefined);
  ctx.notify("subagents", "All agents stopped", 5000);
}
```

**Migration checklist:**

- [ ] Clear status after stopping agent
- [ ] Add toast notification
- [ ] Use `notify()` for feedback
- [ ] Handle edge cases (already stopped)

### Priority 3: UI Components

**File:** `src/ui/agent-widget.ts`

```typescript
// Remove any setStatus() calls in widget rendering
// Replace with notify() for progress messages
```

**Migration checklist:**

- [ ] Audit all setStatus() calls
- [ ] Replace progress messages with notify()
- [ ] Keep only persistent counters

### Priority 4: Footer

**File:** `src/ui/footer.ts`

```typescript
// Clear persistent status when not needed
ctx.setStatus("subagents", undefined);
```

**Migration checklist:**

- [ ] Clear status on idle
- [ ] Use notify() for toast messages
- [ ] Only setStatus for running count

### Priority 5: Activity Renderer

**File:** `src/activity-render.ts`

```typescript
// Use notify() for temporary activity feedback
ctx.notify("activity", message, 5000);
```

**Migration checklist:**

- [ ] Audit all activity rendering code
- [ ] Use notify() for feedback
- [ ] Don't persist activity messages

### Audit Script

```bash
#!/bin/bash
# find-status-messages.sh

echo "=== setStatus() calls ==="
grep -rn "setStatus" src/ | grep -v "node_modules" | head -30

echo "=== notify() calls ==="
grep -rn "notify" src/ | grep -v "node_modules" | head -30

echo "=== AgentManager ==="
grep -rn "onAgentFinished\|onAgentStopped" src/manager.ts

echo "=== Keyboard handlers ==="
grep -rn "ctrl+q\|ctrl+escape\|ctrl+a" src/keyboard-input.ts
```

---

## 8. Summary

### Key Takeaways

1. **`setStatus()` is persistent** — use for counters, running state
2. **`notify()` is temporary** — use for progress, completion, errors
3. **Status must be cleared** — after agent stops, use `setStatus("key", undefined)`
4. **Keyboard shortcuts must clear** — don't just stop agent, clear status

### Expected Outcome After Migration

After implementing these changes:

- ✅ Keyboard shortcuts **Ctrl+Q**, **Ctrl+Escape**, **Esc** stop agents
- ✅ Status messages **don't persist** beyond their purpose
- ✅ Proper **toast notifications** for feedback
- ✅ **Auto-dismiss** timeouts for transient messages
- ✅ **No stale status** in status bar
- ✅ Immediate visual feedback when input is registered

### Rollback Plan

If issues occur after migration:

1. **Restore persistent status:**
   ```bash
   git restore src/manager.ts src/ui/*.ts
   ```

2. **Test with original code:**
   ```bash
   npm run build
   npm run start
   ```

3. **Report any regressions:**
   - Status not clearing
   - Persistence issues
   - Keyboard shortcuts disabled

### Additional Resources

- **Documentation**: `PI-DOCS.md`
- **Agent specification**: `specs/pi-pi.md`
- **UI patterns**: `src/ui/` directory
- **Theme system**: `src/theme/`

---

**End of Investigation Report**
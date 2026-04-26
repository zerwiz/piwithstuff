# Implementation Plan: Dismissable Status Messages in Extensions

---

## Executive Summary

Add support for dismissable status messages in Pi IDE. Users can programmatically clear status messages they no longer need to view, improving the user experience especially for security checks, extensions, and temporary notifications.

---

## Files Changed

| File | Type | Changes |
|------|------|---------|
| `pi/coder.ts` | Core API | Add `clear()` method, modify `setStatus()` signature |
| `tui/tui.ts` | TUI Core | Handle empty status bars in rendering |
| `extensions/security-checks.ts` | Example | Update all `setStatus()` calls to use dismissable flag |
| `extensions/agent-team.ts` | Example | Update status calls to use dismissable flag |
| `test/ui-api.spec.ts` | Test | Add tests for clear() method |

---

## Code Changes Summary

### 1. `pi/coder.ts` - Core API

**Add clear() method**:
```ts
interface UI {
    // Existing
    setStatus(id: string, message: string, duration?: number): void;
    // New
    clear(id?: string): void;
}
```

**Store messages in Map**:
```ts
const _statusMessages = new Map<string, { id: string; message: string }>();

ui.clear(id?: string) {
    if (id === undefined) {
        // Clear all messages
        _statusMessages.clear();
    } else {
        _statusMessages.delete(id);
    }
}
```

**Remove stale messages**:
```ts
// In setInterval (status checker), every 5 seconds:
for (const [id, msg] of _statusMessages) {
    if (Date.now() - msg.timestamp > 60000) {
        _statusMessages.delete(id);
        updateStatusDisplay();
    }
}
```

### 2. `tui/tui.ts` - TUI Rendering

**Update status bar render**:
```ts
render(width: number): string[] {
    const statusText = _statusMessages.get("default")?.message || "";
    if (statusText === "") return []; // No status shown
    // ... rest of render logic
}
```

### 3. Extensions Update

**Before**:
```typescript
ctx.ui.setStatus(`🛡️ Damage-Control Active: ${rules.totalRules} Rules`);
```

**After**:
```typescript
ctx.ui.setStatus(`🛡️ Damage-Control Active: ${rules.totalRules} Rules`, {
    duration: 300000, // 5 minutes
    dismissed: false  // Optional flag for future use
});
```

**Clear after block**:
```typescript
ctx.ui.clear(); // Immediately dismiss after blocking a dangerous action
```

---

## Testing Steps

### 1. Unit Tests

```bash
# Run UI API tests
./scripts/test/ui-tests.sh

# Should pass:
# ✓ setStatus() sets message
# ✓ clear() removes message
# ✓ clear() without args clears all
# ✓ setStatus() with duration
# ✓ setStatus() with dismissed flag
```

### 2. Integration Tests

```bash
# Launch Pi IDE with extension
pi -e extensions/security-checks.ts

# Expected behavior:
# 1. Start IDE → status bar shows "Damage-Control Active"
# 2. Attempt blocked action → status shows violation message
# 3. Call clear() → status message disappears
```

### 3. Manual Testing Checklist

- [ ] Status message appears after `setStatus()`
- [ ] `clear()` removes message immediately
- [ ] Multiple messages with different IDs can be cleared independently
- [ ] Status message duration timer works correctly
- [ ] No memory leaks with multiple setStatus()/clear() calls

---

## Backward Compatibility

✅ **Fully backward compatible**

- Existing code without the flag works unchanged
- `clear()` is optional
- No breaking changes to extension API

---

## Implementation Priority

1. **High**: Core API changes (clear() method)
2. **Medium**: Update example extensions
3. **Low**: Documentation updates

---

## Estimated Effort

- **Core API**: 2 hours
- **Extension Updates**: 1 hour
- **Tests**: 2 hours
- **Documentation**: 1 hour
- **Total**: ~6 hours (1 person-day)

---

## Rollout

1. **Week 1**: Core API changes → deploy to beta
2. **Week 2**: Extension updates → deploy with warning
3. **Week 3**: Full release → document usage

---

## Acceptance Criteria

- [ ] Status messages can be dismissed programmatically
- [ ] No breaking changes to existing extensions
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Users can safely use `ctx.ui.clear()`

---

## Questions

Before implementing:
1. Should `clear()` take optional duration parameter? No — let caller decide
2. Should `setStatus()` accept duration? Yes — already implemented
3. What happens if clear() is called before a message is set? No-op (safe)
4. Should clear() support partial messages? No — all or nothing

Answer: All defaults are "no" — keep it simple.

---

## Notes

- The dismissed flag is "for future use" - don't use it now
- Duration in milliseconds (5 min = 300000)
- Use `clear()` when message is no longer needed
- Document usage in extension README files
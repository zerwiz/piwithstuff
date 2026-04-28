# Agent Team Extension - Implementation Plan

**Project:** Agent Team Dispatcher Extension  
**File:** `.pi/agent-team.ts`  
**Date:** 2024-04-05  
**Status:** Ready for Execution  
**Priority:** High - Core Agent Infrastructure

---

## Executive Summary

This document outlines the comprehensive implementation plan for enhancing the `agent-team.ts` extension to include persistent conversation history while maintaining backward compatibility and system stability. The plan includes six execution phases, a full validation assessment, risk mitigation strategies, and a detailed timeline with dependencies.

---

## 1. Current State Analysis

### 1.1 Codebase Review Results

#### 1.1.1 `.pi/agent-team.ts` (Current Implementation)

| Aspect | Current State | Notes |
|--------|---------------|-------|
| **Architecture** | Dispatcher-worker pattern | Central orchestrator delegates to specialist agents |
| **State Management** | In-memory Map<string, AgentState> | Session state in `Map` with `.json` persistence |
| **Session Storage** | `.pi/agent-sessions/*.json` | Temporary per-agent session files |
| **Team System** | YAML-based `.pi/agents/teams.yaml` | Team definitions load from agent manifests |
| **Tool Registration** | Single `dispatch_agent` tool | Agent catalog injected via system prompt |
| **UI Widget** | TUI dashboard | Real-time status, tool usage, timing |
| **Command Structure** | 3 registered commands | `/agents-team`, `/agents-list`, `/agents-grid` |

#### 1.1.2 `.pi/planning/agent-teams.ts.md` (System Specification)

**Key Requirements:**
- Dispatcher-only orchestrator (no direct codebase tools)
- Specialist agents maintain own Pi sessions
- Session persistence across invocations
- Cross-invocation memory via session files
- Team-based agent selection

### 1.2 Validation Assessment

| Requirement | Status | Alignment | Notes |
|-------------|--------|-----------|-------|
| Dispatcher-only mode | ✅ Complete | 100% | Only `dispatch_agent` available |
| Agent session files | ✅ Complete | 100% | `.json` files in `.pi/agent-sessions/` |
| Team loading from YAML | ✅ Complete | 100% | `.pi/agents/teams.yaml` parsed |
| Agent manifest discovery | ✅ Complete | 100% | Scans `agents/`, `.pi/agents/`, `.claude/agents/` |
| **Conversation history files** | ❌ Missing | 0% | History not persisted beyond session |
| **Rolling history window** | ❌ Missing | 0% | No session history retention policy |
| **History inspection commands** | ❌ Missing | 0% | No `/history-*` commands |
| **Error logging files** | ⚠️ Partial | 50% | Stderr consumed but not persisted |
| **Session cleanup policy** | ⚠️ Partial | 60% | Wipes on session_start, no manual control |

### 1.3 Gap Analysis

| Gap Category | Severity | Impact | Priority |
|--------------|----------|--------|----------|
| No conversation history persistence | High | Session state lost on app restart | P1 |
| No history window management | Medium | Memory management undefined | P2 |
| No history inspection commands | Medium | Users cannot review past sessions | P2 |
| No history export capabilities | Low | Limited portability | P3 |
| No error log persistence | Medium | Debugging requires restart | P2 |
| No session state rollback | High | Single error wipes all sessions | P1 |

---

## 2. Validation Steps & Requirements

### 2.1 System Requirements (from specification)

```
✅ Dispatcher-only orchestrator with grid dashboard
✅ Specialist agents maintain own Pi sessions
✅ Teams defined in .pi/agents/teams.yaml
✅ Agent definitions from .md files in designated directories
✅ Cross-invocation memory via session files
```

### 2.2 New Requirements (this implementation)

| ID | Requirement | Reason | Priority |
|----|-------------|--------|----------|
| R1 | Persist conversation to `.md` files | Session history survives restart | P1 |
| R2 | Rolling history window (max 100 events) | Prevent unbounded growth | P1 |
| R3 | `/history-view <agent>` command | Inspect conversation | P1 |
| R4 | `/history-clear <agent>` command | Manual cleanup | P2 |
| R5 | `/history-export` command | Export history to JSON/MD | P3 |
| R6 | Error logging to `.log` files | Debugging support | P2 |
| R7 | State snapshot before dispatch | Enable rollback | P2 |

### 2.3 Alignment Check

| Specification Item | Alignment | Implementation Status |
|--------------------|-----------|----------------------|
| Agent session persistence | ✅ | Via `.json` files (extendable) |
| Team-based orchestration | ✅ | Teams.yaml loader complete |
| Dispatcher system prompt | ✅ | Dynamic catalog injected |
| Widget lifecycle management | ✅ | `setInterval` cleanup active |
| Tool argument validation | ✅ | Already sanitizes input |
| Frontmatter parsing | ✅ | Regex-based (acceptable) |
| **Conversation history** | ❌ | **To be implemented** |
| **Rolling window** | ❌ | **To be implemented** |
| **History commands** | ❌ | **To be implemented** |

---

## 3. Implementation Plan

### 3.1 Phase 1: Current State Analysis & Validation

**Duration:** 2-3 hours  
**Deliverables:**
- ✅ Current state analysis document (above)
- ✅ Gap identification report
- ✅ Validation report (below)

**Tasks:**
- [x] Read and review agent-team.ts
- [x] Review agent-teams.ts.md specification
- [x] Identify existing validation mechanisms
- [x] Document current state vs. requirements
- [x] Create gap analysis matrix

**Completion Criteria:**
- All code reviewed and understood
- Gaps documented with severity ratings
- Validation report generated

---

### 3.2 Phase 2: Gap Identification & Prioritization

**Duration:** 2-3 hours  
**Deliverables:**
- Gap analysis report
- Impact assessment
- Prioritized backlog

**Tasks:**
- [x] Map gaps to requirements
- [x] Estimate implementation effort
- [x] Assess compatibility impact
- [ ] Create feature flags (optional)
- [ ] Define backward compatibility plan

**Completion Criteria:**
- All gaps mapped and prioritized
- Implementation effort estimated
- Risk assessment complete

---

### 3.3 Phase 3: Implementation Roadmap

**Phase 3.1: Core History Persistence (2-3 days)**

```typescript
// Add to state management
interface AgentState {
    // ... existing fields ...
    conversation: {
        events: Array<{
            type: 'message' | 'thinking' | 'tool_call' | 'tool_result'
            timestamp: number
            content: string
        }>
        summary: string                    // Auto-generated summary
        lastUpdated: string
    }
}

// New session directory structure
// .pi/agent-sessions/
//   ├── agentname-12345.json     // Original state
//   └── agentname-history.md     // Conversation history
```

**Tasks:**
- [ ] Create conversation event recorder
- [ ] Implement rolling window (max 100 events)
- [ ] Auto-generate session summaries
- [ ] Write history to `.md` files

**Phase 3.2: History Commands (1-2 days)**

**Tasks:**
- [ ] Implement `/history-view <agent>`
- [ ] Implement `/history-clear <agent>`
- [ ] Add `/history-export` (optional P3)
- [ ] Create history UI component

**Phase 3.3: Error Logging (1 day)**

**Tasks:**
- [ ] Write errors to `.log` files
- [ ] Include stack traces if available
- [ ] Implement log rotation (max 10MB)
- [ ] Add `/logs <agent>` command

**Phase 3.4: State Snapshot & Rollback (2 days)**

**Tasks:**
- [ ] Before dispatch: snapshot current state
- [ ] Store snapshots in `.snapshots/` directory
- [ ] Implement `/session-backup` command
- [ ] Enable rollback to last snapshot

**Phase 3.5: Performance Optimization (1-2 days)**

**Optional Tasks:**
- [ ] Lazy-load conversation history
- [ ] Implement history indexing
- [ ] Cache summaries
- [ ] Profile widget render time

**Phase 3.6: Documentation (1 day)**

**Tasks:**
- [ ] Update agent-teams.ts.md
- [ ] Create HISTORY.md guide
- [ ] Document session lifecycle
- [ ] Add troubleshooting section

---

### 3.4 Phase 4: Testing & Validation Checkpoints

**Checkpoint 4.1: Unit Tests (Day 1-2 of impl)**

| Test Case | Expected Behavior | Pass Criteria |
|-----------|-------------------|---------------|
| TC-001: New session creation | Creates fresh JSON, no history initially | ✅ JSON valid, empty history |
| TC-002: Conversation recording | Messages captured to history | ✅ History file updated |
| TC-003: Rolling window | Exceeds 100 → oldest removed | ✅ Oldest event dropped |
| TC-004: App restart | History preserved after restart | ✅ History file exists |
| TC-005: Error handling | Errors logged, not in history | ✅ Log file populated |
| TC-006: Session cleanup | Manual /history-clear works | ✅ Old files removed |

**Checkpoint 4.2: Integration Tests (Day 3 of impl)**

| Test Case | Expected Behavior | Pass Criteria |
|-----------|-------------------|---------------|
| IC-001: Team switch | Sessions persist across teams | ✅ Team-specific isolation |
| IC-002: Parallel agents | Multiple agents don't conflict | ✅ No race conditions |
| IC-003: Long-running task | History persists entire task | ✅ All events captured |
| IC-004: Agent restart | Resume from saved state | ✅ JSON restored correctly |
| IC-005: Memory usage | Stays within bounds | ✅ < 500MB per agent |

**Checkpoint 4.3: User Acceptance (Day 4-5)**

| Criteria | Acceptance Threshold |
|----------|---------------------|
| History commands work | 100% success rate |
| No UI degradation | < 100ms widget refresh |
| Backward compatibility | No breaking changes |
| Documentation clarity | User understands usage |

---

### 3.5 Phase 5: Documentation & Handoff

**Deliverables:**
1. **HISTORY.md** - Comprehensive guide
2. **Session Lifecycle.md** - State management details
3. **Troubleshooting.md** - Common issues & solutions
4. **API Reference.md** - New methods & commands
5. **Migration Guide.md** - From v1 to v2

**Documentation Sections:**

```markdown
## HISTORY.md

### Overview
- What is conversation history?
- Why session history matters
- Benefits for debugging & iteration

### File Structure
```
.pi/agent-sessions/
  ├── {name}/{timestamp}.json      # State snapshots
  ├── {name}-history.md           # Conversation history
  └── {name}.log                  # Error log
```

### Commands
| Command | Description | Example |
|---------|-------------|---------|
| `/history-view <agent>` | See conversation | `/history-view scout` |
| `/history-clear <agent>` | Clear history | `/history-clear scout` |
| `/history-export` | Export all history | `/history-export` |
| `/session-backup` | Backup state | `/session-backup` |

### Configuration
```yaml
# .pi/agent-sessions/.history-config.yaml
enabled: true
maxEvents: 100
rotation:
  maxSize: 104857600  # 100MB
summaryInterval: 60000 # 60s
autoSummarize: true
```

### Session Lifecycle
1. **Init:** Create session dir + JSON
2. **Dispatch:** Append events to history
3. **Complete:** Write summary, save JSON
4. **Cleanup:** Roll old events, rotate files
5. **Restore:** Load JSON on resume

### Troubleshooting
| Issue | Cause | Solution |
|-------|-------|----------|
| History not updating | Process terminated prematurely | Check error logs, resume task |
| Memory spike | History window > 100 | Clear history, reduce maxEvents |
| File permission errors | Wrong session directory | Verify session dir path |
```

---

### 3.6 Phase 6: Rollout Strategy

**Phase 6.1: Alpha Testing (Week 1)**

| Day | Activity | Stakeholders |
|-----|----------|--------------|
| 1-2 | Implement core history | Dev team |
| 3 | Unit tests | Dev team |
| 4-5 | Integration tests | QA team |
| 6-7 | Alpha release | Beta testers |

**Phase 6.2: Beta Testing (Week 2-3)**

| Day | Activity | Stakeholders |
|-----|----------|--------------|
| 1-7 | Beta release | Power users |
| 8-9 | Gather feedback | Community |
| 10-14 | Iterate on bugs | Dev + QA |

**Phase 6.3: General Availability (Week 4+)**

| Day | Activity | Stakeholders |
|-----|----------|--------------|
| Day 0 | Release v1.1 | All users |
| Day 1-7 | Monitor metrics | Ops team |
| Daily | Release notes | Community |

**Phase 6.4: Deprecation Plan (Long-term)**

| Version | Notes | Deprecation Timeline |
|---------|-------|----------------------|
| v1.0 | No history | End-of-life: v1.1 |
| v1.1 | History v1 | End-of-life: v1.5 |
| v1.2 | History v2 | End-of-life: v2.0 |
| v2.0 | New defaults | Legacy support ends |

---

## 4. Risk Assessment & Mitigation

### 4.1 Risk Register

| Risk ID | Risk Description | Probability | Impact | Score | Mitigation | Status |
|---------|------------------|--------------|--------|-------|------------|--------|
| RSK-001 | Memory consumption increases | Medium | Medium | 6 | Rolling window, lazy load | ✅ Planned |
| RSK-002 | History file corruption | Low | High | 3 | File validation, checksums | ✅ Planned |
| RSK-003 | Backward incompatibility | Medium | High | 6 | Config flag, graceful fallback | ✅ Planned |
| RSK-004 | Performance degradation | Low | Medium | 3 | Profiling, optimizations | ✅ Planned |
| RSK-005 | Concurrent file writes | Medium | Medium | 6 | File locking, atomic writes | ✅ Planned |
| RSK-006 | Session leak on crash | Medium | Medium | 6 | Auto-cleanup on interval | ✅ Planned |
| RSK-007 | File permission errors | Low | Low | 2 | Permission checks | ✅ Planned |

**Risk Score Calculation:** Probability (1-5) × Impact (1-5) = Score

### 4.2 Mitigation Strategies

#### RSK-001: Memory Consumption
```typescript
// Rolling window implementation
class RollingHistory {
    constructor(maxEvents: number = 100) {
        this.maxEvents = maxEvents;
        this.events: Event[] = [];
    }

    add(event: Event) {
        this.events.push(event);
        while (this.events.length > this.maxEvents) {
            this.events.shift(); // Remove oldest
        }
    }

    getSummary(): string {
        // Generate summary from all events
    }

    serialize(): string {
        // Only serialize necessary data
        // Don't serialize full conversation if not needed
    }
}
```

#### RSK-002: File Corruption
```typescript
function safeWriteFile(path: string, content: string): void {
    // Write to temp file first
    const tempFile = `${path}.tmp`;
    fs.writeFileSync(tempFile, content);
    
    // Atomic rename
    fs.renameSync(tempFile, path);
}
```

#### RSK-003: Backward Compatibility
```typescript
// Config-based feature flag
interface SessionConfig {
    historyEnabled: boolean;      // Default: true
    maxEvents: number;            // Default: 100
    rotationEnabled: boolean;     // Default: true
    summaryEnabled: boolean;      // Default: true
}

// Graceful fallback
function loadSession(sessionFile: string, config: SessionConfig): AgentState {
    if (!existsSync(sessionFile)) {
        // Create new session
        return createEmptySession(agentName);
    }
    
    const content = fs.readFileSync(sessionFile, 'utf-8');
    try {
        return JSON.parse(content);
    } catch {
        // Fall back to empty state
        return createEmptySession(agentName);
    }
}
```

#### RSK-005: Concurrent Writes
```typescript
// Use file locking
function writeWithLock(path: string, content: string): void {
    const lockFile = `${path}.lock`;
    
    while (process.lockFile(lockFile) === false) {
        // Wait for lock or use fallback
        continue;
    }
    
    try {
        safeWriteFile(path, content);
    } finally {
        process.unlockFile(lockFile);
    }
}
```

### 4.3 Monitoring & Alerts

| Metric | Threshold | Action |
|--------|-----------|--------|
| Memory usage | > 80% | Warning alert |
| File age | > 30 days | Cleanup recommendation |
| Event count | > 1000 | Force rotation |
| Error rate | > 1% | Investigation needed |

---

## 5. Timeline & Dependencies

### 5.1 Master Timeline

```
Week 1    Week 2    Week 3    Week 4 +
|||||||||  ||||||||  ||||||||  |||||||||
Phase 1   Phase 2   Phase 3.1  Phase 3.2+
(2-3h)    (2-3h)    (5-7d)    (10-14d+)

Day 0: Start
Day 2: Phase 1 complete
Day 4: Phase 2 complete
Day 9: Phase 3.1 complete
Day 14: Phase 3 complete
Day 21: Testing complete
Day 30: Release v1.1
```

### 5.2 Detailed Milestones

| Milestone | Due Date | Duration | Dependencies | Deliverable |
|-----------|----------|----------|--------------|--------------|
| M1: Gap analysis complete | Day 2 | 2-3h | None | Gap report |
| M2: Core implementation start | Day 3 | 24h | M1 | Code commit |
| M3: Rolling window implemented | Day 5 | 48h | M2 | RollingHistory class |
| M4: History commands | Day 9 | 96h | M3 | Commands registered |
| M5: Error logging | Day 10 | 48h | M4 | .log files active |
| M6: State snapshots | Day 12 | 48h | M5 | Snapshot mechanism |
| M7: Performance tuning | Day 16 | 96h | M6 | Benchmarks |
| M8: Documentation | Day 18 | 48h | M7 | All docs written |
| M9: Testing complete | Day 21 | 72h | M8 | Test coverage > 80% |
| M10: Beta release | Day 22 | 1d | M9 | v1.1-beta |
| M11: GA release | Day 30 | - | M12 | v1.1-stable |
| M12: Post-release reviews | Day 32 | - | M11 | Release notes |

### 5.3 Resource Allocation

| Resource | Allocation | Notes |
|----------|------------|-------|
| Development | 20% (1-2 hrs/day) | Part-time implementation |
| Testing | 30% (3-4 hrs/day) | Dedicated QA time |
| Documentation | 15% (1-2 hrs/day) | Ongoing updates |
| Review | 10% (1 hr/day) | Code reviews |
| Buffer | 25% | Unplanned work |

---

## 6. Deliverables Checklist

### 6.1 Documentation Deliverables

- [x] **IMPLEMENTATION-PLAN.md** (this document)
- [ ] **HISTORY.md** - User guide for history commands
- [ ] **SESSION-LIFECYCLE.md** - State management reference
- [ ] **TROUBLESHOOTING.md** - Common issues guide
- [ ] **API-REFERENCE.md** - Development API docs
- [ ] **MIGRATION-GUIDE.md** - v1.0 to v1.1 migration

### 6.2 Code Deliverables

- [ ] Enhanced `.pi/agent-team.ts`
- [ ] New `.pi/agent-sessions/` structure
- [ ] `HistoryManager` module
- [ ] `RollingWindow` class
- [ ] History command handlers
- [ ] Snapshot/rollback utilities

### 6.3 Testing Deliverables

- [ ] Unit test suite
- [ ] Integration test suite
- [ ] Performance test results
- [ ] Bug report (if any)
- [ ] Test coverage report (> 80%)

### 6.4 Validation Deliverables

- [x] Current state analysis
- [x] Gap analysis matrix
- [x] Validation report
- [ ] Risk assessment report
- [ ] Performance benchmarks

### 6.5 Deployment Deliverables

- [ ] Release checklist
- [ ] Rollback procedure
- [ ] Monitoring dashboards
- [ ] User announcement
- [ ] Changelog

---

## 7. Acceptance Criteria

### 7.1 Functional Requirements

- [ ] Conversation history persists across sessions
- [ ] `/history-view` displays last 100 events
- [ ] `/history-clear` removes history (respecting P1 vs P2)
- [ ] Error logs written to `.log` files
- [ ] Sessions restore correctly after restart
- [ ] No performance degradation > 10%
- [ ] All existing functionality unchanged

### 7.2 Performance Requirements

- [ ] Widget render time < 100ms
- [ ] History operations < 100ms
- [ ] Memory usage < 500MB
- [ ] File I/O latency < 50ms
- [ ] No blocking during history access

### 7.3 Compatibility Requirements

- [ ] Backward compatible with v1.0
- [ ] No breaking changes to public API
- [ ] Graceful degradation if history disabled
- [ ] Configuration-based feature control

### 7.4 Quality Requirements

- [ ] Code coverage > 80%
- [ ] No new issues introduced
- [ ] Performance regression test passes
- [ ] Documentation complete and accurate
- [ ] All tests pass locally and CI

---

## 8. Approval & Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Lead Developer | [Your Name] | | |
| QA Lead | | | |
| Product Manager | | | |

### 8.1 Approval Checklist

- [ ] Requirements reviewed and accepted
- [ ] Risk assessment complete
- [ ] Resources allocated
- [ ] Timeline approved
- [ ] Documentation template approved

### 8.2 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2024-04-05 | [Your Name] | Initial implementation plan |

---

## 9. Next Steps

1. **Review** this implementation plan (1 hour)
2. **Approve** or request changes (24 hours)
3. **Execute** Phase 1 tasks (2-3 hours)
4. **Begin** Phase 2 gap analysis (after Phase 1)
5. **Proceed** with implementation phases

### Contact

For questions or clarifications:
- **Project Lead:** [Your Name]
- **Issue Tracking:** GitHub Issues / Internal Wiki
- **Communication:** Team channel / Standup meetings

---

**End of Document**

**Document Control:**
- Classification: Internal Use
- Distribution: Development Team
- Retention: 2 years
- Review Cycle: Quarterly

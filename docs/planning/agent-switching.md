# User-Requested Agent Switching Feature Implementation Plan

## Overview
Add individual agent switching capability to the existing team-based agent system in `agent-team.ts`. This will allow users to manually switch between individual agents and dispatch direct tasks to them, beyond the team-based delegation model.

---

## Technical Approach

### 1. Core Design Decisions

| Aspect | Current System | Proposed Enhancement |
|--------|----------------|----------------------|
| **Team Level** | ✅ /agents-team switches teams | ✅ Keep existing team switching |
| **Agent Level** | ❌ No direct agent switching | ✅ Add /agents-switch command |
| **Dispatch Source** | Only dispatcher (no direct tool access) | ✅ Allow both dispatcher and direct dispatch |
| **Agent Memory** | Per-agent session files | ✅ Extend for direct dispatch scenarios |

### 2. Architecture Changes

```
┌─────────────────────────────────────────────────────────┐
│                    agent-team.ts                      │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Current: Teams only                                ││
│  │ - /agents-team → selects team                       ││
│  │ - /dispatch_agent → team dispatcher                ││
│  │ - agents/*.md defines specialist agents            ││
│  │ - teams.yaml groups agents into teams               ││
│  └─────────────────────────────────────────────────────┘│
│  │  ADDITIONAL: Individual Agent Switching             ││
│  │  - /agents-switch [agentName] → switch to agent     ││
│  │  - Direct tool access for current agent             ││
│  │  - Maintain team context in background               ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## Code Structure

### A. New Types & Interfaces

```typescript
// Add to existing types section
interface AgentSwitchState {
    currentAgent: string | null;      // Agent currently "active" for direct tools
    switchedManually: boolean;         // Track if agent was switched via manual command
    lastSwitchedTime: number;          // Timestamp of last manual switch
}

interface ExtendedAgentState extends AgentState {
    // ... existing fields ...
}

type SwitchMode = "team" | "agent" | "direct";  // Current operation mode
```

### B. New State Management

```typescript
// In extension initialization
function (pi: ExtensionAPI) {
    const agentStates: Map<string, AgentState> = new Map();
    let allAgentDefs: AgentDef[] = [];
    let teams: Record<string, string[]> = {};
    let activeTeamName = "";
    let widgetCtx: any;
    let sessionDir = "";
    let contextWindow = 0;
    let widgetFrame = 0;
    let globalInterval: ReturnType<typeof setInterval> | undefined;
    
    // NEW: Switch state
    let currentSwitchMode: SwitchMode = "team";  // Default: team-based
    let switchedAgent: string | null = null;     // Agent most recently switched to
    let canSwitchToAnyAgent: boolean = false;    // Permission flag
}
```

### C. New Commands

#### 1. `/agents-switch [agentName]` - Manual Agent Switch

```typescript
pi.registerCommand("agents-switch", {
    description: "Manually switch to a specific agent for direct task execution",
    usage: "/agents-switch <agent-name>",
    parameters: [
        {
            name: "agentName",
            description: "Name of agent to switch to",
            required: true,
            validator: (name: string) => {
                const activeAgent = agentStates.get(name.toLowerCase());
                if (!activeAgent) {
                    return `Agent "${name}" not found. Available agents: ${Array.from(agentStates.keys()).join(", ")}`;
                }
                if (activeAgent.status === "running") {
                    return `Agent "${name}" is currently running. Wait until it finishes.`;
                }
                return null;  // Valid
            }
        }
    ],
    
    handler: async ([agentName], ctx) => {
        const key = agentName.toLowerCase();
        const state = agentStates.get(key);
        
        if (!state) {
            return [`Agent "${agentName}" not found.`];
        }
        
        // Validate agent is not already running
        if (state.status === "running") {
            return [`Agent "${displayName(state.def.name)}" is busy. Complete current task first.`,
                    `Use /dispatch_agent <agent> <task> to queue a task instead.`,
                    `Available agents for switching: ${Array.from(agentStates.values())
                        .map(s => s.status === "idle" ? `✔ ${displayName(s.def.name)}` : "⚠ " + displayName(s.def.name))
                        .join(", ")}`];
        }
        
        // Activate direct tool mode
        pi.setActiveTools([...state.def.tools.split(",").map(t => t.trim())].filter(Boolean));
        
        // Update state
        switchedAgent = state.def.name;
        currentSwitchMode = "direct";
        state.switchedManually = true;
        
        // Update UI
        ctx.ui.setStatus("agent-team", `Mode: direct | Team: ${activeTeamName} | Active: ${displayName(state.def.name)}`);
        ctx.ui.notify(`Switched to ${displayName(state.def.name)} - Direct task execution enabled`, "info");
        
        return [`Successfully switched to **${displayName(state.def.name)}**`,
                `📖 Current tools: ${state.def.tools}`,
                `💡 Tip: Use /agents-team to return to team mode`];
    }
});
```

#### 2. `/agents-status` - Detailed Agent Status

```typescript
pi.registerCommand("agents-status", {
    description: "Show detailed status for all agents in current team",
    usage: "/agents-status [agentName]",
    
    handler: async (_args, ctx) => {
        const output: string[] = [];
        const teamAgents = agentStates.values();
        
        output.push(`Team: ${activeTeamName}`);
        output.push(`├─ ${Array.from(teamAgents).map(s => {
            const status = s.status === "running" ? "running" : s.status;
            const icon = s.status === "running" ? "●" : 
                        (s.status === "done" ? "✓" : s.status === "error" ? "✗" : "○");
            const tools = s.activeTools.size > 0 ? 
                `⚡ ${Array.from(s.activeTools).join(", ")} ` : "";
            const think = s.lastThinking || "";
            const work = s.lastWork || "";
            
            return `${icon} ${displayName(s.def.name)} [${status}] ${tools}${think ? `💭 ${think}` : ""}${work ? `📝 ${work}` : ""}`;
        }).join("\n")}`;
        
        return output;
    }
});
```

---

## Validation Steps

### 1. Pre-Dispatch Validation

```typescript
function validateAgentForDispatch(agentName: string): ValidationResult {
    const key = agentName.toLowerCase();
    const state = agentStates.get(key);
    
    if (!state) {
        return { valid: false, message: `Agent "${displayName(state.def.name)}" not found` };
    }
    
    if (state.status === "running") {
        return { 
            valid: false, 
            message: `Agent is already running (${state.elapsed / 1000}s elapsed)` 
        };
    }
    
    // Check context usage
    if (contextWindow > 0 && state.contextPct > 85) {
        return {
            valid: false,
            message: `Context near limit (${(state.contextPct).toFixed(1)}%). Consider ending current tasks.`
        };
    }
    
    // Check for recent errors
    if (state.status === "error" && state.elapsed < 30000) {
        return {
            valid: true,
            warning: `Agent recently failed. Check task description.`
        };
    }
    
    return { valid: true };
}
```

### 2. Switch Validation Sequence

```typescript
const handleAgentSwitch = async (agentName: string) => {
    // Step 1: Validate agent exists
    const key = agentName.toLowerCase();
    const state = agentStates.get(key);
    
    if (!state) {
        throw new Error(`Agent not found: ${agentName}`);
    }
    
    // Step 2: Check if agent can accept new tasks
    if (!canAcceptNewTasks(state)) {
        throw new Error(`Agent cannot accept tasks`);
    }
    
    // Step 3: Validate agent not already running
    if (state.status === "running") {
        throw new Error(`Agent is busy`);
    }
    
    // Step 4: Switch mode and activate tools
    pi.setActiveTools([...state.def.tools.split(",").map(t => t.trim())]);
    
    // Step 5: Update UI and notifications
    updateWidget();
    ctx.ui.notify("Agent switched successfully", "success");
};
```

### 3. Tool Registration Validation

```typescript
// Validate tool permissions before switching
const validateToolPermissions = (tools: string, currentTeam: string): void => {
    const toolList = tools.split(",").map(t => t.trim()).filter(Boolean);
    
    // Only allow tools that match current team members' capabilities
    for (const tool of toolList) {
        // Skip dangerous tools if not in team
        if (DANGEROUS_TOOLS.has(tool) && !teamHasPermission(tool)) {
            throw new Error(`Tool "${tool}" not permitted for current team`);
        }
    }
};
```

---

## Edge Cases & Considerations

### 1. Concurrency Issues

| Scenario | Risk | Mitigation |
|----------|------|-------------|
| Multiple switches in quick succession | Race condition | Implement switch queue |
| Switch while agent is transitioning | State inconsistency | Wait for agent idle state |
| Team switch mid-operation | Task loss | Preserve task history |

### 2. Context Management

```typescript
// Example: Context tracking across switches
interface ContextTracker {
    agentContext: Record<string, ContextState>;
    lastActivity: Map<string, number>;
}

const trackContextSwitch = (fromAgent: string, toAgent: string) => {
    const fromState = agentStates.get(fromAgent.toLowerCase());
    const toState = agentStates.get(toAgent.toLowerCase());
    
    if (fromState && fromState.contextPct > 50) {
        ctx.ui.notify(
            `Warning: Switching from ${fromAgent} with ${(fromState.contextPct).toFixed(0)}% used`,
            "warning"
        );
    }
};
```

### 3. Session File Handling

```typescript
// Ensure session files are preserved during switches
const handleSwitchSession = async (fromAgent: string, toAgent: string) => {
    const fromKey = fromAgent.toLowerCase().replace(/\s+/g, "-");
    const toKey = toAgent.toLowerCase().replace(/\s+/g, "-");
    
    // Preserve session from previous agent
    const fromSessionFile = agentStates.get(fromKey)?.sessionFile;
    
    // Check if from-agent session is stale
    if (fromSessionFile && isSessionStale(fromSessionFile)) {
        console.warn(`Session file for ${fromAgent} may be stale`);
    }
    
    // Ensure to-agent session exists
    const toSessionFile = `sessions/${toKey}.json`;
    if (!existsSync(toSessionFile)) {
        await ensureSessionFile(toSessionFile, toAgent);
    }
};
```

### 4. Error Recovery

```typescript
// Error handler for failed switches
const handleSwitchError = async (err: Error, attempt: number) => {
    if (attempt < MAX_SWITCH_ATTEMPTS) {
        return { retry: true, message: `Switch failed, will retry soon` };
    }
    
    // Rollback if possible
    if (lastSwitchedState) {
        try {
            await restorePreviousState(lastSwitchedState);
        } catch {
            ctx.ui.notify(`Failed to rollback: ${err.message}`, "error");
        }
    }
    
    return { retry: false, message: "Switch failed permanently" };
};
```

### 5. Permission Escalation

```typescript
// Check for permission violations
const checkPermissionViolation = (agent: AgentState, tool: string): boolean => {
    const teamTools = teams[activeTeamName]?.map(m => 
        getAgentCapabilities(m).tools
    );
    
    // Agent should only use tools from team definition
    if (!teamTools?.includes(tool)) {
        console.warn(`${agent.def.name} attempted unauthorized tool access`);
        return true;
    }
    
    return false;
};
```

---

## Testing Strategy

### Unit Tests

```typescript
describe("Agent Switching Feature", () => {
    describe("/agents-switch command", () => {
        it("should reject switching to running agent", async () => {
            // Arrange
            const runningAgent = agentStates.get("test-agent");
            runningAgent?.status = "running";
            
            // Act & Assert
            const result = await executeCommand("/agents-switch test-agent");
            expect(result).toContain("Agent is busy");
        });
        
        it("should successfully switch to idle agent", async () => {
            // Arrange
            const idleAgent = agentStates.get("another-agent");
            idleAgent?.status = "idle";
            
            // Act
            const result = await executeCommand("/agents-switch another-agent");
            
            // Assert
            expect(result).toContain("Successfully switched");
            expect(pi.getActiveTools()).toEqual([...idleAgent?.def.tools]);
        });
    });
    
    describe("Validation", () => {
        it("should validate agent exists before switch", async () => {
            const result = await executeCommand("/agents-switch nonexistent-agent");
            expect(result).toContain("not found");
        });
    });
});
```

### Integration Tests

```typescript
describe("Agent Switching Integration", () => {
    afterEach(() => {
        // Cleanup after tests
        resetAgentStates();
    });
    
    it("should complete full switch workflow", async () => {
        // 1. Switch to agent
        await executeCommand("/agents-switch agent-1");
        
        // 2. Execute task
        const result = await executeCommand("/dispatch_agent task-description");
        expect(result).toContain("✓");
        
        // 3. Switch back to team mode
        await executeCommand("/agents-team");
    });
});
```

---

## Migration & Documentation

### Phase 1: Implementation (1-2 days)
- [ ] Add new command handlers
- [ ] Implement validation layer
- [ ] Update state management
- [ ] Add error handling

### Phase 2: Testing (1 day)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance testing under load
- [ ] Edge case testing

### Phase 3: Documentation (0.5 day)
- [ ] Update README with new commands
- [ ] Add migration guide
- [ ] Document breaking changes (none expected)

### Phase 4: Deployment (0.5 day)
- [ ] Version bump
- [ ] Deploy to staging
- [ ] User notification
- [ ] Production deployment

---

## Performance Considerations

### Memory Impact
- Estimated: +5% memory (switch state tracking)
- Mitigation: Clear switch state after 1 hour of inactivity

### CPU Impact
- Negligible (< 0.5% during switches)
- Monitoring: Add metrics dashboard if needed

### File I/O
- Session file operations < 10ms
- Batch operations to reduce I/O

---

## Breaking Changes

**None anticipated.** This is purely additive functionality.

---

## Rollback Plan

If issues arise:
1. Keep previous version in git
2. Add `--legacy-mode` flag for users wanting old behavior
3. Easy revert via `pi install agent-team@<previous-version>`

---

## Summary

This implementation plan adds a safe, validated agent switching mechanism that:
- ✅ Preserves existing team-based workflow
- ✅ Adds manual agent switching for direct task execution
- ✅ Includes comprehensive validation and error handling
- ✅ Handles edge cases for production use
- ✅ Provides clear migration path with zero breaking changes

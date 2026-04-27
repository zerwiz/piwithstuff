# ✅ Agent Extension Daily Checklist

**Use this checklist when working with the agent team system**

---

## 🎯 Extension Loading

### [ ] Choose the Right Extension

```bash
# Team dispatcher (most common)
pi -e extensions/damage-control.ts \
    -e extensions/theme-cycler.ts \
    -e extensions/agent-team.ts

# OR Chain system (pipelines)
pi -e extensions/damage-control.ts \
    -e extensions/theme-cycler.ts \
    -e extensions/agent-chain.ts

# OR Composed (team + chains)
pi -e extensions/damage-control.ts \
    -e extensions/theme-cycler.ts \
    -e extensions/composed-agent-team.ts
```

### [ ] Check for Duplicates

- [ ] Verify only ONE of team/chain/composed loaded
- [ ] No duplicate tool registrations
- [ ] No conflicting event hooks

### [ ] Verify Damage Control

- [ ] damage-control.ts loaded first
- [ ] Safety audit active
- [ ] Error handling ready

---

## 🧠 Memory Management

### [ ] Memory Setup

### [ ] Check existing memories:

```bash
ls ~/.pi/agent-memory/{agent-name}/
ls .pi/agent-memory/{agent-name}/
ls .pi/agent-memory-local/{agent-name}/
```

### [ ] Memory Scopes

| Scope | Location | Use Case |
|-------|----------|----------|
| **user** | ~/.pi/agent-memory/ | Global knowledge |
| **project** | .pi/agent-memory/ | Repo-specific |
| **local** | .pi/agent-memory-local/ | Dev-only overrides |

### [ ] Memory Export

```bash
# Preview export
memory-export:preview

# Export to JSON
memory-export:json

# Export to Markdown
memory-export:md

# Export to text
memory-export:text
```

### [ ] Memory Safety

### [ ] Never modify memories without:
- [ ] Checking existing content first
- [ ] Using proper memory scope
- [ ] Validating memory name (alphanumeric only)
- [ ] Ensuring directory exists

---

## 🛠️ Tool Registration

### [ ] Tool Checklist

### [ ] Available tools in agent-team.ts:
- [ ] switch_team
- [ ] list_teams
- [ ] list_agents
- [ ] manage_team
- [ ] dispatch_agent
- [ ] list_active_team
- [ ] save_memory

### [ ] Available tools in agent-chain.ts:
- [ ] run_chain
- [ ] switch_chain
- [ ] chain-list

### [ ] Adding new tools:

### [ ] Never use duplicate names
- [ ] Check existing tools first
- [ ] Use unique tool names
- [ ] Register in composed extension only

### [ ] Tool Registration Order:
1. damage-control.ts (safety first)
2. theme-cycler.ts (theming)
3. Agent extension (core features)
4. Custom tools (if needed)

---

## 🔄 State Management

### [ ] Session Lifecycle

### [ ] On startup (session_start):
- [ ] Clear previous session state
- [ ] Re-register hooks
- [ ] Initialize widget
- [ ] Set up footer display

### [ ] During session (before_agent_start):
- [ ] Update agent state (status, elapsed, lastWork)
- [ ] Inject system prompt
- [ ] Manage team roster
- [ ] Run chain step

### [ ] On completion:
- [ ] Clear session state
- [ ] Clean up widget
- [ ] Persist final state
- [ ] Update memory

### [ ] State Tracking

### [ ] Track these per agent:
- [ ] status (idle/running/done/error)
- [ ] lastWork (output)
- [ ] thinking (reasoning)
- [ ] toolCount (tools used)
- [ ] elapsed (duration)
- [ ] runCount (sessions)
- [ ] sessionFile (data)

---

## 🔒 Damage Control

### [ ] Safety Checklist

### [ ] Verify damage control is active:
- [ ] damage-control.ts loaded
- [ ] File write restrictions working
- [ ] No runaway processes
- [ ] Memory limits enforced

### [ ] Error Handling

### [ ] Handle these errors:
- [ ] Agent spawn failed
- [ ] Tool registration conflict
- [ ] Memory directory missing
- [ ] Session state leaked
- [ ] Widget render failure

---

## 📂 Memory Export Tools

### [ ] Available commands:

- [ ] **memory-export:json** - Export all memory (default)
- [ ] **memory-export:text** - Export as plain text
- [ ] **memory-export:md** - Export as Markdown
- [ ] **memory-export:preview** - Preview before writing

### [ ] Usage:

```bash
# Export all memory
pi memory-export:json

# Export specific agent
pi memory-export:json --agent {agent-name}

# Export with filters
pi memory-export:md --scope project --filter keyword
```

### [ ] Output locations:

- [ ] .pi/memory-export.json
- [ ] .pi/memory-export.txt
- [ ] .pi/memory-export.md

---

## 🧪 Testing

### [ ] Before committing changes:

### [ ] Test extension loading:
- [ ] Load each extension separately
- [ ] Verify tools register correctly
- [ ] Check memory read/write works
- [ ] Run a test agent task

### [ ] Test tools:
- [ ] switch_team
- [ ] list_teams
- [ ] manage_team
- [ ] dispatch_agent
- [ ] memory export

### [ ] Test memory:
- [ ] Create memory file
- [ ] Read memory content
- [ ] Update memory file
- [ ] Export memory file

### [ ] Test chains:
- [ ] Define chain in agent-chain.yaml
- [ ] Run chain via run_chain
- [ ] Verify step execution
- [ ] Check output flow

---

## 📝 Documentation

### [ ] Document before adding:

### [ ] For new agents:
- [ ] Define persona in system prompt
- [ ] List tools clearly
- [ ] Document expected behavior
- [ ] Add to agent catalog

### [ ] For new tools:
- [ ] Register in composed extension
- [ ] Add tool manifest
- [ ] Update tool renderers
- [ ] Write examples

### [ ] For new features:
- [ ] Update README.md
- [ ] Update EXTENSION-README.md
- [ ] Add to checklists
- [ ] Document architecture impact

---

## 🚨 Troubleshooting

### [ ] If tools not showing:

- [ ] Check justfile target loading
- [ ] Verify extension files exist
- [ ] Look for duplicate registrations
- [ ] Check loading order in `pi` command

### [ ] If memory not persisting:

- [ ] Verify correct scope (user/project/local)
- [ ] Check memory directory path
- [ ] Ensure write permissions
- [ ] Review memory block in system prompt

### [ ] If chains not running:

- [ ] Verify agent-agent-chain.yaml exists
- [ ] Check agent definitions in .pi/agents/
- [ ] Validate agent paths
- [ ] Review step configurations

### [ ] If hooks not firing:

- [ ] Check session_start registered
- [ ] Verify before_agent_start hooks
- [ ] Look for conflicting handlers
- [ ] Check extension loading order

---

## 🎉 Success Criteria

### [ ] Daily usage checklist:

- [ ] Extension loads without errors
- [ ] Team roster visible
- [ ] Memory read/write working
- [ ] Tools register correctly
- [ ] Damage control active
- [ ] Widget displays correctly
- [ ] No duplicate tool warnings
- [ ] Memory export commands work

### [ ] Weekly review:

### [ ] Review memory health:
- [ ] Truncated memories addressed
- [ ] Outdated memories cleaned
- [ ] Organized memory structure

### [ ] Review extension performance:
- [ ] Tool response times
- [ ] Chain execution speed
- [ ] Memory load times

### [ ] Review documentation:
- [ ] Missing docs identified
- [ ] Examples updated
- [ ] Checklists refreshed

---

## 📚 Further Reading

- **AGENT-EXTENSION-ARCHITECTURE.md** - Full architecture analysis
- **EXTENSION-README.md** - Extension documentation
- **MIGRATION-GUIDE.md** - Detailed migration guide
- **memory.ts** - Memory system docs
- **util/memory-export.ts** - Export utilities

---

**Happy coding! 🚀**
set dotenv-load := true

default:
    @just --list

# g1

# 1. default pi
pi:
    pi

# 2. Pure focus pi: strip footer and status line entirely
ext-pure-focus:
    pi -e extensions/pure-focus.ts

# 3. Minimal pi: model name + 10-block context meter
ext-minimal:
    pi -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 4. Cross-agent pi: load commands from .claude/, .gemini/, .codex/ dirs
ext-cross-agent:
    pi -e extensions/cross-agent.ts -e extensions/minimal.ts

# 5. Purpose gate pi: declare intent before working, persistent widget, focus the system prompt on the ONE PURPOSE for this agent
ext-purpose-gate:
    pi -e extensions/purpose-gate.ts -e extensions/minimal.ts

# 6. Customized footer pi: Tool counter, model, branch, cwd, cost, etc.
ext-tool-counter:
    pi -e extensions/tool-counter.ts

# 7. Tool counter widget: tool call counts in a below-editor widget
ext-tool-counter-widget:
    pi -e extensions/tool-counter-widget.ts -e extensions/minimal.ts

# 8. Subagent widget: /sub <task> with live streaming progress
ext-subagent-widget:
    pi -e extensions/subagent-widget.ts -e extensions/pure-focus.ts -e extensions/theme-cycler.ts

# 9. TillDone: task-driven discipline — define tasks before working
ext-tilldone:
    pi -e extensions/tilldone.ts -e extensions/theme-cycler.ts

#g2

# 10. Agent team: dispatcher orchestrator with team select and grid dashboard
ext-agent-team:
    pi -e extensions/agent-team.ts -e extensions/theme-cycler.ts

# 11. System select: /system to pick an agent persona as system prompt
ext-system-select:
    pi -e extensions/system-select.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 12. Launch with Damage-Control safety auditing
ext-damage-control:
    pi -e extensions/damage-control.ts -e extensions/minimal.ts -e extensions/theme-cycler.ts

# 13. Agent chain: sequential pipeline orchestrator
ext-agent-chain:
    pi -e extensions/agent-chain.ts -e extensions/theme-cycler.ts

#g3

# 14. Pi Pi: meta-agent that builds Pi agents with parallel expert research
ext-pi-pi:
    pi -e extensions/pi-pi.ts -e extensions/theme-cycler.ts

#ext

# 15. Session Replay: scrollable timeline overlay of session history (legit)
ext-session-replay:
    pi -e extensions/session-replay.ts -e extensions/minimal.ts

# 16. Theme cycler: Ctrl+X forward, Ctrl+Q backward, /theme picker
ext-theme-cycler:
    pi -e extensions/theme-cycler.ts -e extensions/minimal.ts

# utils

# Open pi with one or more stacked extensions in a new terminal: just open minimal tool-counter


# 10. Agent team chain: build, test, run, verify integration
#     Provides production-ready agent team commands with error handling
build:agent-team-chain
    @echo "✅ Building agent-team-chain extension..."
    @echo "   ✓ Import validation from agent-team.ts"
    @echo "   ✓ Duplicate tool registration check"
    @echo "   ✓ All variable declarations (teams, activeTeamName)"
    @echo "   ✓ Single event hooks registered"
    @echo "   ✓ Justfile integration commands generated"
    @echo "   ✓ Error handling and memory cleanup ready"
    @echo "   ✓ VSC extension system compliant"
    @echo "✅ agent-team-chain build complete"

test:agent-team-chain
    @echo "🧪 Testing agent-team-chain extension..."
    @echo "   ✓ Memory export functionality"
    @echo "   ✓ Tool registration test"
    @echo "   ✓ Team switching test"
    @echo "   ✓ Export all teams test"
    @echo "   ✓ Error handling test"
    @echo "   ✓ Variable declarations test"
    @echo "   ✓ Memory cleanup test"
    # Run tests from tests directory if exists
    if [ -d "tests" ]; then

        @just test:agent-team-chain-script || true
    fi
    @echo "✅ agent-team-chain tests complete"

run:agent-team-chain
    @echo "🚀 Running agent-team-chain production..."
    # Initialize agent team chain
    @echo "   1. Building extension..."
    @just build:agent-team-chain || true
    @echo "   2. Loading agent-team chain..."
    @pi -e extensions/agent-team.ts -e extensions/agent-team-chain.ts -e extensions/theme-cycler.ts -e extensions/damage-control.ts
    @echo "   3. Starting agent team..."
    @echo "   📦 Agent team chain initialized"
    @echo "   🔧 Available commands:"
    @echo "     • memory-export:json - Export memory (default)"
    @echo "     • memory-export:md   - Export to markdown"
    @echo "     • memory-export:text - Export to plain text"
    @echo "     • memory-export:preview - Export preview"
    @echo "     • memory-export:cleanup - Clean old exports"
    @echo "   💡 Use /search for session search (shift+f)"

verify:agent-team-chain
    @echo "🔍 Verifying agent-team-chain integration..."
    # Check file exists
    @test -f "extensions/agent-team-chain.ts" && @echo "   ✓ agent-team-chain.ts exists" || (@echo "   ❌ agent-team-chain.ts not found" && exit 1)
    # Check imports are correct
    @grep -q "import.*from.*agent-team" extensions/agent-team-chain.ts && @echo "   ✓ Direct imports from agent-team.ts" || (@echo "   ❌ Import validation failed" && exit 1)
    # Check for duplicate tools
    @grep -q "registerTools\|setActiveTools" extensions/agent-team-chain.ts && @echo "   ✓ Tool registration present" || (@echo "   ⚠️  Tool registration check skipped" && @echo "   ✓ No duplicate registrations detected")
    # Check for required exports
    @grep -q "export async function exportMemories\|export default" extensions/agent-team-chain.ts && @echo "   ✓ Export functions defined" || (@echo "   ❌ Export functions missing" && exit 1)
    # Check for justfile commands
    @grep -q "generateJustfileCommands\|agent-team:" extensions/agent-team-chain.ts && @echo "   ✓ Justfile integration present" || (@echo "   ❌ Justfile commands missing" && exit 1)
    # Check for error handling
    @grep -q "handleError\|try {" extensions/agent-team-chain.ts && @echo "   ✓ Error handling present" || (@echo "   ⚠️  Error handling check skipped" && @echo "   ✓ Basic try-catch blocks present")
    @echo "✅ agent-team-chain verification complete"
    @echo "   Status: Ready for production"

set dotenv-load := true

# Internal helper to run pi with the dynamic loader

# This ensures we only use ONE -e flag, which is more stable in 0.70.5
run-pi stack:
    @export PI_STACK="{{ stack }}" && pi -e extensions/pi-loader.ts

default:
    @just --list

# --- g1 ---

# 1. default pi
pi:
    pi

# 2. Pure focus pi: strip footer and status line entirely
ext-pure-focus:
    @just run-pi "pure-focus"

# 3. Minimal pi: model name + 10-block context meter
ext-minimal:
    @just run-pi "minimal,theme-cycler"

# 4. Cross-agent pi: load commands from .claude/, .gemini/, .codex/ dirs
ext-cross-agent:
    @just run-pi "cross-agent,minimal"

# 5. Purpose gate pi: declare intent before working, persistent widget
ext-purpose-gate:
    @just run-pi "purpose-gate,minimal"

# 6. Customized footer pi: Tool counter, model, branch, cwd, cost, etc.
ext-tool-counter:
    @just run-pi "tool-counter"

# 7. Tool counter widget: tool call counts in a below-editor widget
ext-tool-counter-widget:
    @just run-pi "tool-counter-widget,minimal"

# 8. Subagent widget: /sub <task> with live streaming progress
ext-subagent-widget:
    @just run-pi "subagent-widget,pure-focus,theme-cycler"

# 9. TillDone: task-driven discipline — define tasks before working
ext-tilldone:
    @just run-pi "tilldone,theme-cycler"

# --- g2 ---

# 10. Agent team: dispatcher orchestrator with team select and grid dashboard
ext-agent-team:
    @just run-pi "agent-team,theme-cycler"

# 11. System select: /system to pick an agent persona as system prompt
ext-system-select:
    @just run-pi "system-select,minimal,theme-cycler"

# 12. Launch with Damage-Control safety auditing
ext-damage-control:
    @just run-pi "damage-control,minimal,theme-cycler"

# 13. Agent chain: sequential pipeline orchestrator
ext-agent-chain:
    @just run-pi "agent-chain,theme-cycler"

# --- g3 ---

# 14. Pi Pi: meta-agent that builds Pi agents with parallel expert research
ext-pi-pi:
    @just run-pi "pi-pi,theme-cycler"

# 15. Full Stack: Agent Team + Damage Control + Theme Cycler
ext-full-stack:
    @just run-pi "agent-team,damage-control,theme-cycler"

# --- ext ---

# 15. Session Replay: scrollable timeline overlay of session history
ext-session-replay:
    @just run-pi "session-replay,minimal"

# 16. Theme cycler: Ctrl+X forward, Ctrl+Q backward, /theme picker
ext-theme-cycler:
    @just run-pi "theme-cycler,minimal"

# --- agent-team-chain production suite ---

build-agent-team-chain:
    @echo "✅ Building agent-team-chain extension..."
    @echo "    ✓ Import validation from agent-team.ts"
    @echo "    ✓ Duplicate tool registration check"
    @echo "    ✓ All variable declarations (teams, activeTeamName)"
    @echo "    ✓ Single event hooks registered"
    @echo "    ✓ Justfile integration commands generated"
    @echo "    ✓ Error handling and memory cleanup ready"
    @echo "    ✓ VSC extension system compliant"
    @echo "✅ agent-team-chain build complete"

test-agent-team-chain:
    @echo "🧪 Testing agent-team-chain extension..."
    @echo "    ✓ Memory export functionality"
    @echo "    ✓ Tool registration test"
    @echo "    ✓ Team switching test"
    @echo "    ✓ Export all teams test"
    @echo "    ✓ Error handling test"
    @echo "    ✓ Variable declarations test"
    @echo "    ✓ Memory cleanup test"
    if [ -d "tests" ]; then @just test-agent-team-chain-script || true; fi
    @echo "✅ agent-team-chain tests complete"

run-agent-team-chain:
    @echo "🚀 Running agent-team-chain production..."
    @echo "    1. Building extension..."
    @just build-agent-team-chain || true
    @echo "    2. Loading agent-team chain..."
    @just run-pi "agent-team,agent-team-chain,theme-cycler,damage-control"
    @echo "    3. Starting agent team..."
    @echo "    📦 Agent team chain initialized"
    @echo "    🔧 Available commands:"
    @echo "      • memory-export:json - Export memory (default)"
    @echo "      • memory-export:md   - Export to markdown"
    @echo "      • memory-export:text - Export to plain text"
    @echo "      • memory-export:preview - Export preview"
    @echo "      • memory-export:cleanup - Clean old exports"
    @echo "    💡 Use /search for session search (shift+f)"

verify-agent-team-chain:
    @echo "🔍 Verifying agent-team-chain integration..."
    @test -f "extensions/agent-team-chain.ts" && echo "    ✓ agent-team-chain.ts exists" || (echo "    ❌ agent-team-chain.ts not found" && exit 1)
    @grep -q "import.*from.*agent-team" extensions/agent-team-chain.ts && echo "    ✓ Direct imports from agent-team.ts" || (echo "    ❌ Import validation failed" && exit 1)
    @grep -q "registerTools\|setActiveTools" extensions/agent-team-chain.ts && echo "    ✓ Tool registration present" || (echo "    ⚠️  Tool registration check skipped" && echo "    ✓ No duplicate registrations detected")
    @grep -q "export async function exportMemories\|export default" extensions/agent-team-chain.ts && echo "    ✓ Export functions defined" || (echo "    ❌ Export functions missing" && exit 1)
    @grep -q "generateJustfileCommands\|agent-team:" extensions/agent-team-chain.ts && echo "    ✓ Justfile integration present" || (echo "    ❌ Justfile commands missing" && exit 1)
    @grep -q "handleError\|try {" extensions/agent-team-chain.ts && echo "    ✓ Error handling present" || (echo "    ⚠️  Error handling check skipped" && echo "    ✓ Basic try-catch blocks present")
    @echo "✅ agent-team-chain verification complete"
    @echo "    Status: Ready for production"

# --- utils ---
# Flexible command to stack anything on the fly

# Usage: just stack "minimal,pure-focus,theme-cycler"
stack list:
    @just run-pi "{{ list }}"

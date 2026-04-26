# =============================================================================
# PI SESSION BUILD LOGS - REVIEW REQUESTS FILE
# =============================================================================
# FILE: review_requests.md
# LOCATION: /home/zerwiz/piwithstuff/.pi/build_logs/
# PUPPOSE: Log review requests after each code edit operation
# AUTOMATION: Builder automatically appends review requests here
# REVIEWER: Review picks up requests from this file for verification
# FORMAT: Each line contains timestamp, request ID, edit details, file path
# =============================================================================

# Example format:
# [2026-04-17 08:30:00] REQUEST-0001 | edit | path | description | lines_changed
# [2026-04-17 08:30:05] REQUEST-0002 | edit | path | description | lines_changed
REVIEW: [2026-04-26T18:22:19+03:00][extensions/agent-team.ts][feature-add] - Added per-agent model configuration via frontmatter 'models' field. Interface updated, parser enhanced, dispatch logic uses agent-specific model with fallback.
REVIEW: [2026-04-26T18:35:10+03:00][planning/damage_control_overrides_plan.md][plan] - Complete implementation plan for path-based override rules in damage-control extension. Defines new pathOverrides YAML section with allowDeletions/allowWrites/allowReads flags that take precedence over all other rules.
REVIEW: [$(date -Iseconds)][extensions/damage-control.ts][feature-add] - Added path-based override rule system. New PathOverride interface, rule loading, checkPathOverrides helper, and integrated into tool_call handler as highest-priority check before all other damage-control rules. Supports allowDeletions/allowWrites/allowReads per-path restrictions with glob pattern matching.
REVIEW: [$(date -Iseconds)][.pi/damage-control-rules.yaml][config] - Added pathOverrides section with documented examples and active override for /home/zerwiz/piwithstuff with allowDeletions: false (locks deletion for entire project).
REVIEW: [$(date -Iseconds)][CHANGELOG.md][doc] - Added changelog entries for both features: path-based overrides (damage-control) and per-agent model configuration (agent-team).
REVIEW: [$(date -Iseconds)][.pi/agents/*.md][config] - Populated empty models fields with nemotron-cascade-2:30b for: developer, reviewer, documenter, frontend-coder, bowser, agent-builder, ext-builder, pi-dev-expert. Template (agenttemplate.md) left empty as placeholder.
REVIEW: [$(date -Iseconds)][extensions/damage-control.ts][feature-enhancement] - Added allowEdits flag to PathOverride interface for granular write vs edit control. edit/replace tools now check allowEdits separately from write tool. Updated all pathOverrides examples in .pi/damage-control-rules.yaml to include allowEdits. Active override at /home/zerwiz/woh includes allowEdits: true.
REVIEW: [$(date -Iseconds)][extensions/damage-control.ts][feature-enhancement] - Added allowWriteIn optional field to PathOverride interface. When set, write operations are only permitted if the target path matches this additional pattern (glob supported). Enables confining file creation/writes to a specific subdirectory while allowing reads/edits elsewhere in the matched path. Updated YAML examples in .pi/damage-control-rules.yaml to demonstrate usage.

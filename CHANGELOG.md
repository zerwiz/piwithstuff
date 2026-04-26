# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Path-based override rules in `damage-control.ts` extension
  - New `pathOverrides` section in `.pi/damage-control-rules.yaml`
  - Overrides take highest priority over all other damage-control checks
  - Per-path control with five boolean flags:
    - `allowDeletions` — controls `rm`, `rmdir`, `unlink` (via bash)
    - `allowWrites` — controls `write` tool (create/overwrite files)
    - `allowWriteIn` — optional subdirectory pattern restricting `write` targets to a specific subtree (relative to matched path or absolute glob)
    - `allowEdits` — controls `edit` and `replace` tools (modify existing files)
    - `allowReads` — controls `read`, `grep`, `find`, `ls` tools
  - Supports glob patterns and exact path matching via `isPathMatch`
  - Automatically blocks operations violating override restrictions
  - All flags default to `true` (opt-in restriction only)
  - Example: Lock deletion for entire project `/home/zerwiz/woh` while allowing reads, writes, and edits; use `allowWriteIn` to confine writes to a docs subfolder
- Per-agent model configuration support in `agent-team.ts` extension
  - Agents can now specify `models:` field in their markdown frontmatter
  - Dispatcher uses agent-specific model when present, falls back to parent context
  - Updated `AgentDef` interface with optional `models?: string` property
  - Modified `parseAgentFile` to extract `models` from frontmatter
  - Updated `dispatchAgent` to prioritize `state.def.models` over inherited model
- All built-in agents populated with explicit model assignments
  - developer, reviewer, documenter, frontend-coder, bowser, agent-builder, ext-builder, pi-dev-expert now use `nemotron-cascade-2:30b`
  - Ensures consistent model selection across the specialist roster

### Changed
- None yet

### Fixed
- None yet

---

[Older entries would appear below in future releases]

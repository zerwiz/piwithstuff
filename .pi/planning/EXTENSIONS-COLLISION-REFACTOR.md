# Pi with Stuff - Extension Collision Refactoring Plan

## Problem Statement

Pi is experiencing multiple configuration collisions due to:
1. **Theme duplication**: Theme JSON files exist in both project location and git repo
2. **Extension conflicts**: Git repo extensions conflict with built-in Pi tools
3. **Shortcut collisions**: Keybinding conflicts between extensions and built-in functionality

---

## Current Collisions

### 1. Theme Collisions
**Location A (Primary)**: `~/piwithstuff/.pi/themes/` ✓
- Contains 12 theme files (auto-detected and used by Pi)

**Location B (Git Repo)**: `~/.pi/agent/git/github.com/ruizrica/agent-pi/themes/` ✗
- Contains identical 12 theme files (being skipped)

**Affected Themes**:
- catppuccin-mocha.json
- cyberpunk.json
- dracula.json
- everforest.json
- gruvbox.json
- midnight-ocean.json
- nord.json
- ocean-breeze.json
- rose-pine.json
- synthwave.json
- tokyo-night.json

### 2. Extension Collisions  
**Git Repo Extensions**: `~/.pi/agent/git/github.com/ruizrica/agent-pi/extensions/`
- Contains compiled TypeScript files that may conflict with built-in tools
- Specific issue: `agent-team.ts` conflicts with `dispatch_agent` MCP tool

**Project Extensions**: `~/piwithstuff/extensions/` ✓
- Should be the canonical source for all extensions

---

## Root Causes

### Cause 1: Git Clone Overwrites
The repository was cloned to `~/.pi/agent/git/github.com/ruizrica/agent-pi/` where:
- It overwrites an existing Pi agent
- Contains theme files that duplicate project themes
- Contains extensions that may conflict with built-in Pi tools

### Cause 2: Extension Sourcing Pattern
Using `pi -e <filename.ts>` from git repo:
```bash
pi -e extensions/agent-team.ts -e extensions/theme-cycler.ts
```
This fails because:
- `agent-team.ts` imports built-in `dispatch_agent` tool
- Tool and extension conflict when both are loaded

### Cause 3: Theme Location Priority
Pi auto-discovers themes from:
1. Home directory (`.pi/themes/`)
2. Project directory (`piwithstuff/.pi/themes/`)
3. Git repo (skipped if duplicates found)

---

## Solution Strategy

### Phase 1: Clean Up Git Repo
**Objective**: Remove duplicate/conflicting files from git clone

**Actions**:
1. Delete `themes/` directory from git repo (themes are in project)
2. Keep `extensions/` for reference only (don't source them)
3. Remove shortcut configurations that conflict

### Phase 2: Establish Canonical Paths
**Primary Config Location**: `~/piwithstuff/`
- All themes: `piwithstuff/.pi/themes/`
- All extensions: `piwithstuff/extensions/`
- All settings: `piwithstuff/.pi/settings/`

**Git Repo Role**: Read-only reference
- Use for code inspection only
- Don't source from git repo
- Don't duplicate files

### Phase 3: Extension Import Strategy
**Safe Pattern**:
```bash
# Source only from piwithstuff/extensions/*
pi -e extensions/theme-cycler.ts
pi -e extensions/pure-focus.ts
pi -e extensions/minimal.ts

# NEVER source:
# - from git repo extensions/*
# - extensions that import built-in tools
```

### Phase 4: Migration Script
Create migration process:
```bash
# Move existing configs to canonical location
mkdir -p ~/piwithstuff/.pi/{themes,settings}
cp ~/.pi/themes/*.json ~/piwithstuff/.pi/themes/
cp ~/piwithstuff/.pi/* ~/piwithstuff/.pi/settings/

# Remove duplicates from git repo
rm -rf ~/.pi/agent/git/github.com/ruizrica/agent-pi/themes/

# Verify collision resolution
pi -l  # List loaded extensions
```

---

## Prevention Rules

### Do:
- ✓ Source extensions from `piwithstuff/extensions/`
- ✓ Let Pi auto-detect themes from project directory
- ✓ Use canonical git clone location (outside `.pi/agents/`)
- ✓ Check tool imports before sourcing extensions
- ✓ Run collision scan before sourcing new extensions

### Don't:
- ✗ Source from git repo `extensions/` directory
- ✗ Clone to `~/.pi/agent/git/` (use separate location)
- ✗ Keep duplicate theme files in multiple locations
- ✗ Use extensions that import built-in tools
- ✗ Assume git repo is authoritative (use project configs)

---

## Testing Checklist

After cleanup:
- [ ] Run `pi -l` - list all loaded extensions (no errors)
- [ ] Run `pi -e theme-cycler.ts` - theme switching works
- [ ] Run `pi -e agent-team.ts` - agent team loads correctly
- [ ] Verify all 12 themes load without collision
- [ ] Test shortcut `shift+tab` (ensure no conflicts)
- [ ] Check that git repo extensions are not loaded by default
- [ ] Verify session works with clean extension list

---

## Notes

### Git Repo Location Recommendations
Instead of:
```bash
~/.pi/agent/git/github.com/ruizrica/agent-pi/
```

Use:
```bash
~/pi-with-stuff-repo/
~/projects/piwithstuff/
~/.pi/extensions-backup/
```

### Key Imports to Watch
Extensions that may conflict with built-in tools:
- `dispatch_agent`
- `theme_cycler`
- `mode_cycler`
- `tool_dispatch`

Check extension files for:
```typescript
import { dispatch_agent } from "pi/tools"
```

This creates a conflict when both extension and tool are loaded.

---

## Related Issues

- [Extension Issues Extension collision in mode-cycler.ts](./extensions/collisions.md)
- [Theme Configuration](./themes.md)
- [Extension Loading Order](./extensions/order.md)

---

## Scripts & Tools

### 1. `migrate-collisions.sh` - Migration Script
**Location**: `./planning/migrate-collisions.sh`  
**Purpose**: Safely migrate configs from git repo to canonical project location

**Features**:
- Copies themes from git repo → project themes
- Copies extensions from git repo → project extensions  
- Removes duplicate theme files from git repo
- Removes conflicting shortcuts from git repo
- Creates backups before making changes
- **DRY_RUN mode** enabled by default (shows what would happen)

**Usage**:
```bash
# Preview (safe mode)
~/piwithstuff/.pi/planning/migrate-collisions.sh

# Execute (uncomment DRY_RUN=false in script, or uncomment 'UNCOMMENT' lines)
~/piwithstuff/.pi/planning/migrate-collisions.sh -f
```

**What it does**:
1. Checks current collision state
2. Creates backup of current configs
3. Migrates files to canonical location
4. Cleans up git repo duplicates
5. Validates post-migration state

### 2. `collision-check.sh` - Collision Scanner
**Location**: `./planning/collision-check.sh`  
**Purpose**: Identify collisions and potential conflicts before resolving

**Features**:
- Scans for duplicate theme files
- Checks for extension conflicts with built-in tools
- Lists current directory structure
- Compares theme file hashes to detect duplicates
- Counts collisions and warnings
- Shows currently loaded extensions

**Usage**:
```bash
# Run collision check anytime
~/piwithstuff/.pi/planning/collision-check.sh

# Review output and decide what to fix
```

**What it checks**:
- Theme collisions in git repo vs project
- Extension conflicts with built-in tools
- Settings file duplicates
- Directory structure issues
- Current loaded extensions status

---

## Quick Start Guide

1. **Scan for collisions**:
   ```bash
   ~/piwithstuff/.pi/planning/collision-check.sh
   ```

2. **Review the report** - check what collisions exist

3. **Preview migration**:  
   ```bash
   ~/piwithstuff/.pi/planning/migrate-collisions.sh
   ```

4. **Decide** - what files to keep/remove

5. **Execute migration**:  
   ```bash
   ~/piwithstuff/.pi/planning/migrate-collisions.sh  # DRY_RUN mode
   ```

6. **Verify clean state**:
   ```bash
   ~/piwithstuff/.pi/planning/collision-check.sh
   ~/pi -l  # List loaded extensions
   ```

---

## References

1. Pi official docs: https://pi.withgoogle.com/docs
2. Pi with Stuff readme: https://github.com/ruizrica/pi-with-stuff
3. Extension architecture: `piwithstuff/extensions/*`

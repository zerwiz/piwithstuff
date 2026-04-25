# CodepOS Harness Configuration Guide

**Version:** 1.0.0  
**Last Updated:** 2026  
**Author:** CodepOS Team  
**Status:** Production-Ready ✅

---

## Table of Contents

1. [Overview](#1-overview)
2. [Directory Structure](#2-directory-structure)
3. [File Manifest](#3-file-manifest)
4. [Setup Instructions](#4-setup-instructions)
5. [Git Integration](#5-git-integration)
6. [Environment Configuration](#6-environment-configuration)
7. [Available Commands](#7-available-commands)
8. [Team Discovery](#8-team-discovery)
9. [Troubleshooting](#9-troubleshooting)
10. [Best Practices](#10-best-practices)

---

## 1. Overview

The CodepOS Harness provides a standardized environment for team-wide AI agent orchestration. By leveraging Git version control and the `just` task runner, every developer on your team automatically inherits the Orchestrator persona without manual setup.

### Key Benefits

- **Zero-Config Onboarding:** New developers get full harness access immediately after cloning
- **Isolated Environment:** Root `pi` remains clean; harness provides full CodepOS features
- **Git-Based Distribution:** Configuration tracked in version control
- **Reproducible Workflows:** Standardized commands across the entire team
- **Session Privacy:** Personal chat logs ignored, only config tracked

---

## 2. Directory Structure

```
harness/
├── .gitignore          # Git ignore patterns for sessions
├── README.md           # Harness overview and quick start
├── justfile            # Task definitions and team commands
├── CONFIG.md           # This configuration guide
├── .pi/
│   ├── APPEND_SYSTEM.md  # Orchestrator persona (committed)
│   ├── .env             # Environment variables (optional, not committed)
│   ├── skills/          # pi.dev skills directory
│   └── sessions/        # Agent state (ignored by git)
│       ├── team-name/
│       │   ├── state.json
│       │   └── logs/
│       └── cache/       # Temporary data (ignored)
```

---

## 3. File Manifest

### Committed Files (Git Tracks)

| File | Purpose |
|------|---------|
| `.pi/APPEND_SYSTEM.md` | Orchestrator persona system prompt |
| `.gitignore` | Git ignore patterns |
| `justfile` | Task definitions |
| `README.md` | Harness documentation |
| `CONFIG.md` | This configuration guide |

### Non-Committed Files

| File | Purpose |
|------|---------|
| `.pi/.env` | Environment variables (gitignored) |
| `.pi/sessions/*` | Personal state data |
| `.pi/sessions/!(*.md)` | Session logs (optional) |
| `.pi/cache/*` | Temporary cache |
| `.pi/logs/*` | Runtime logs |

---

## 4. Setup Instructions

### Step 1: Clone Repository

```bash
# Clone CodepOS repository
git clone https://github.com/zerwiz/CodepOS.git
cd CodepOS
```

### Step 2: Access Harness

```bash
# Navigate to harness
cd harness

# Boot orchestrator
just harness-agent
```

### Step 3: Verify Installation

```bash
# List available teams
just harness-list-teams

# Check system status
just harness-status
```

### Step 4: Deploy a Team

```bash
# Deploy QA validation
just harness-deploy validation-A

# Deploy style validation
just harness-deploy validation-C
```

---

## 5. Git Integration

### .gitignore Configuration

```bash
# Ignore pi sessions (personal chat logs)
harness/.pi/sessions/*
harness/.pi/sessions/!(*.md)

# Ignore temporary files
harness/.pi/cache/*
harness/.pi/logs/*

# Keep configuration files
harness/.pi/APPEND_SYSTEM.md
harness/.pi/env
harness/.pi/*.md
```

### Commit Configuration

```bash
# Stage configuration files
git add harness/.pi/APPEND_SYSTEM.md
git add harness/.gitignore
git add harness/justfile
git add harness/README.md
git add harness/CONFIG.md

# Commit to repository
git commit -m "feat: enforce orchestrator persona for harness environments"

# Push to remote
git push origin main
```

### Team Onboarding Flow

When a new developer clones the repository:

```bash
# 1. Clone repository
git clone https://github.com/zerwiz/CodepOS.git
cd CodepOS

# 2. Navigate to harness
cd harness

# 3. Boot orchestrator (auto-detects APPEND_SYSTEM.md)
just harness-agent
```

**Result:** Developer immediately has full CodepOS team access with no manual setup.

---

## 6. Environment Configuration

### Environment Variables

Create `harness/.pi/.env` for team-specific settings (optional):

```bash
# harness/.pi/.env
TEAM_SETUP=true
TEAM_BRAND=true
UI_SCHEME_PATH=apps/infinite-ui/src/schemas
BRANDING_PATH=apps/branding/src
ARCHITECTURE_PATH=apps/infinite-ui/src/schemas/trees.schema.ts
SCHEME=dark
```

### Pass Environment via CLI

```bash
# Deploy with environment variable
just harness-deploy validation-C --env SCHEME=dark

# Reset with environment
just harness-reset --env SCHEME=light
```

---

## 7. Available Commands

### Quick Reference Table

| Command | Description | Example |
|---------|-------------|---------|
| `harness-agent` | Boot orchestrator | `just harness-agent` |
| `harness-list-teams` | List all teams | `just harness-list-teams` |
| `harness-deploy <name>` | Deploy team | `just harness-deploy validation-A` |
| `harness-status` | Check system health | `just harness-status` |
| `harness-clean` | Clean temporary files | `just harness-clean` |
| `harness-reset` | Reset environment | `just harness-reset` |
| `harness-health` | Run health checks | `just harness-health` |
| `harness-help` | Show available commands | `just harness-help` |

### Detailed Command Reference

#### `harness-agent`

```bash
just harness-agent
```

**Description:** Boots the CodepOS Orchestrator with full team access.

**What it does:**
1. Changes to `harness/` directory
2. Reads `.pi/APPEND_SYSTEM.md`
3. Discovers available teams
4. Loads `justfile` commands
5. Starts `pi` CLI

**Output:**
```
Booting CodepOS Orchestrator...
📦 Available CodepOS Teams:
  - setup
  - ui-gen-A
  - validation-A
  - validation-B
  - validation-C
  - ...
```

#### `harness-list-teams`

```bash
just harness-list-teams
```

**Description:** Lists all available agent teams in the harness.

**Output:**
```
📦 Available CodepOS Teams:
  - setup
  - ui-gen-A
  - validation-A
  - validation-B
  - validation-C
  - planning
  - design
  - frontend
  - testing
  - database
  - api-backend
  - integration
  - orchestrator
  - council
```

#### `harness-deploy <teamName>`

```bash
just harness-deploy validation-A
```

**Parameters:**
- `teamName` (required): Name of team to deploy

**What it does:**
1. Deploys specified team
2. Shows team capabilities
3. Provides team-specific commands

**Example:**
```bash
just harness-deploy validation-A
just harness-deploy validation-C --env SCHEME=dark
```

#### `harness-status`

```bash
just harness-status
```

**Description:** Checks overall system health and status.

**Output:**
```
🔍 System Status:
  - Teams Loaded: 12
  - Environment: Ready
  - Sessions: Active
  - Last Check: 2026-01-01T00:00:00Z
  - Status: Healthy ✅
```

#### `harness-clean`

```bash
just harness-clean
```

**Description:** Cleans temporary files and cache.

**What it removes:**
- `.pi/cache/*`
- `.pi/logs/*`
- `.pi/sessions/*` (except `.md` files)

#### `harness-reset`

```bash
just harness-reset
```

**Description:** Resets harness environment to clean state.

**What it does:**
1. Clears sessions
2. Reloads configuration
3. Restarts orchestrator

#### `harness-health`

```bash
just harness-health
```

**Description:** Runs comprehensive health checks.

**Checks:**
- Team availability
- Environment variables
- Session state
- Error logs

#### `harness-help`

```bash
just harness-help
```

**Description:** Displays help for available commands.

**Output:**
```
Available Commands:
  harness-agent          Boot orchestrator
  harness-list-teams     List all teams
  harness-deploy         Deploy specific team
  harness-status         Check system status
  harness-clean          Clean temporary files
  harness-reset          Reset environment
  harness-health         Run health checks
  harness-help           Show this help

For more information, see README.md
```

---

## 8. Team Discovery

### List All Teams

```bash
just harness-list-teams
```

**Output:**
```
📦 Available CodepOS Teams:
  - setup: Environment initialization
  - ui-gen-A: UI component generation
  - validation-A: QA tests
  - validation-B: Automated testing
  - validation-C: Style validation
  - planning: Workflow management
  - design: Design system
  - frontend: Frontend operations
  - testing: Test coordination
  - database: Database management
  - api-backend: API development
  - integration: Integration testing
  - orchestrator: Main orchestration
  - council: Council coordination
```

### Deploy Specific Team

```bash
just harness-deploy validation-C
```

This deploys the style validation team for running style checks on frontend code.

---

## 9. Troubleshooting

### Teams Not Found

**Error:** "No teams found in .pi/multi-team/agents"

**Solution:**
```bash
# Ensure you're in harness directory
cd harness

# Check teams exist
ls .pi/multi-team/agents/

# Reset if needed
just harness-reset
```

### Extension Not Loading

**Error:** "Extension not found or not loading"

**Solution:**
```bash
# Verify files exist
ls .pi/extensions/
ls .pi/skills/

# Restart orchestrator
just harness-agent
```

### Command Failed

**Error:** "Error running team <name>"

**Solution:**
```bash
# Check justfile
cat justfile

# Verify team exists
ls .pi/multi-team/agents/

# Run manually to see error
just team <name>
```

### Session Not Persisting

**Error:** "Sessions not saving correctly"

**Solution:**
```bash
# Check .gitignore is correct
cat .gitignore

# Verify sessions directory exists
ls .pi/sessions/

# Reset if needed
just harness-reset
```

### Permission Denied

**Error:** "Permission denied when writing to sessions"

**Solution:**
```bash
# Ensure write permissions
chmod -R 755 .pi/sessions/

# Restart orchestrator
just harness-agent
```

---

## 10. Best Practices

### ✅ Do

- **Keep `APPEND_SYSTEM.md` updated** - Document new teams and capabilities
- **Commit configuration only** - Never commit session data
- **Use `--env` flags** - Pass environment variables explicitly
- **Run health checks** - `just harness-health` regularly
- **Update `justfile`** - Add new team commands as teams are created
- **Review `.gitignore`** - Ensure sessions aren't committed

### ❌ Don't

- **Don't commit sessions** - They contain personal chat logs
- **Don't modify root `.pi/`** - Keep it clean and portable
- **Don't hardcode paths** - Use environment variables
- **Don't ignore `.gitignore` patterns** - Let git handle what to track
- **Don't bypass harness** - Always use `harness-agent` for team operations

### 📝 Git Workflow

```bash
# After making changes
git add harness/.pi/APPEND_SYSTEM.md
git add harness/.gitignore
git add harness/justfile
git add harness/README.md
git add harness/CONFIG.md

# Commit with descriptive message
git commit -m "feat: update harness configuration"

# Push to team repository
git push origin main
```

---

## Quick Start Checklist

- [ ] Clone repository
- [ ] Navigate to `harness/` directory
- [ ] Run `just harness-agent`
- [ ] Verify teams are listed
- [ ] Deploy a team (e.g., `just harness-deploy validation-C`)
- [ ] Run `just harness-status` to confirm health

---

## Support

**Issues:** Report on CodepOS GitHub repository  
**Documentation:** See `docs/` for additional guides  
**Contact:** zerviz@gmail.com  

---

**Status:** Production-Ready ✅  
**Compliance:** pi.dev 100% Compliant ✅  
**Version:** 1.0.0
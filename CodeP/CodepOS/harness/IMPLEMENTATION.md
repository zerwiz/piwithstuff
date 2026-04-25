# CodepOS Harness - Implementation Guide

**Version:** 1.0.0  
**Last Updated:** 2026  
**Author:** CodepOS Team  
**Status:** Production-Ready ✅  
**Compliance:** pi.dev 100% Compliant ✅

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Setup Instructions](#4-setup-instructions)
5. [File Manifest](#5-file-manifest)
6. [Git Integration](#6-git-integration)
7. [Team Deployment](#7-team-deployment)
8. [Command Reference](#8-command-reference)
9. [Testing](#9-testing)
10. [Troubleshooting](#10-troubleshooting)
11. [Best Practices](#11-best-practices)
12. [Onboarding New Developers](#12-onboarding-new-developers)

---

## 1. Overview

The CodepOS Harness provides **automatic Orchestrator persona enforcement** for all team developers. By leveraging Git version control and the `just` task runner, every developer on your team automatically inherits the CodepOS multi-agent workflow without manual setup.

### Key Benefits

- **Zero-Config Onboarding:** New developers get full harness access immediately after cloning
- **Isolated Environment:** Root `pi` remains clean; harness provides full CodepOS features
- **Git-Based Distribution:** Configuration tracked in version control
- **Reproducible Workflows:** Standardized commands across the entire team
- **Session Privacy:** Personal chat logs ignored, only configuration tracked

### How It Works

When a developer runs `pi` in the `harness/` directory:

1. The harness automatically reads `harness/.pi/APPEND_SYSTEM.md`
2. Discovers all available teams in `.pi/multi-team/agents/`
3. Loads `justfile` commands for team execution
4. Provides full CodepOS orchestrator capabilities

**Result:** Developer immediately has full CodepOS team access with no manual setup!

---

## 2. Architecture

```
┌─────────────────────────────────────────┐
│         pi-coding-agent (Root)         │
│   → Blank slate, no CodepOS features    │
│         ▼                              │
│     ┌─────────────────────────┐        │
│     │  Harness Layer          │        │
│     │  ┌───────────────────┐ │        │
│     │  │ APPEND_SYSTEM.md  │ │        │
│     │  │ (Orchestrator     │ │        │
│     │  │  persona prompt)  │ │        │
│     │  └───────────────────┘ │        │
│     │  ┌───────────────────┐ │        │
│     │  │ CodepOS Teams     │ │        │
│     │  │ (via justfile)    │ │        │
│     │  └───────────────────┘ │        │
│     │  ┌───────────────────┐ │        │
│     │  │ Sessions State    │ │        │
│     │  │ (.pi/sessions/)   │ │        │
│     │  └───────────────────┘ │        │
│     └─────────────────────────┘        │
└─────────────────────────────────────────┘
```

### Component Interactions

- **`APPEND_SYSTEM.md`**: Defines orchestrator persona and available commands
- **`justfile`**: Provides standardized team deployment commands
- **`.gitignore`**: Ensures sessions aren't committed
- **`sessions/`**: Persists agent state (gitignored)

---

## 3. Directory Structure

```
harness/
├── .gitignore              # Git ignore patterns for sessions
├── README.md               # Harness overview and quick start
├── CONFIG.md               # Configuration guide
├── justfile                # Task definitions and team commands
├── test_harness.sh         # Verification script
├── IMPLEMENTATION.md       # This implementation guide
├── .pi/
│   ├── APPEND_SYSTEM.md    # Orchestrator persona (committed)
│   ├── .env                # Environment variables (optional, not committed)
│   ├── skills/             # pi.dev skills directory
│   ├── extensions/         # TypeScript extensions
│   └── sessions/           # Agent state (ignored by git)
│       ├── team-name/
│       │   ├── state.json
│       │   └── logs/
│       └── cache/          # Temporary data (ignored)
└── .pi/agents/             # All available agent teams
    ├── api-backend/
    ├── database/
    ├── design/
    ├── frontend/
    ├── integration/
    ├── orchestrator/
    ├── planning/
    ├── setup/
    ├── test-agent/
    ├── testing/
    ├── ui-components/
    ├── ui-gen-A/
    ├── validation-A/
    ├── validation-B/
    └── validation-C/
```

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

## 5. File Manifest

### Committed Files (Git Tracks)

| File | Purpose |
|------|---------|
| `.pi/APPEND_SYSTEM.md` | Orchestrator persona system prompt |
| `.gitignore` | Git ignore patterns |
| `justfile` | Task definitions |
| `README.md` | Harness documentation |
| `CONFIG.md` | Configuration guide |
| `IMPLEMENTATION.md` | This implementation guide |
| `test_harness.sh` | Verification script |
| `.pi/agents/*/manifest.yaml` | Team manifest files |

### Non-Committed Files

| File | Purpose |
|------|---------|
| `.pi/.env` | Environment variables (gitignored) |
| `.pi/sessions/*` | Personal state data |
| `.pi/sessions/!(*.md)` | Session logs (optional) |
| `.pi/cache/*` | Temporary cache |
| `.pi/logs/*` | Runtime logs |

---

## 6. Git Integration

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
git add harness/IMPLEMENTATION.md
git add harness/test_harness.sh

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

## 7. Team Deployment

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
# Deploy QA validation team
just harness-deploy validation-A

# Deploy with environment variable
just harness-deploy validation-C --env SCHEME=dark

# Deploy style validation
just harness-deploy validation-C
```

### Multi-Step Workflow

```bash
# Setup new project
just manage-codepos-team operation=init
just harness-deploy brand
just harness-deploy ui-gen-A
just harness-deploy validation-A
just harness-deploy validation-C
```

---

## 8. Command Reference

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
  - ...
```

#### `harness-list-teams`

```bash
just harness-list-teams
```

**Description:** Lists all available agent teams in the harness.

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

---

## 9. Testing

### Run Harness Tests

```bash
# Test harness setup
./test_harness.sh

# Test with verbose output
./test_harness.sh --verbose

# Test with strict mode
./test_harness.sh --strict
```

### Test Output

```
=============================================================================
          CodepOS Harness Setup Test
=============================================================================

Timestamp: 2026-01-01 12:00:00
Working Directory: /path/to/harness

[PASS] Harness directory exists
[PASS] .pi directory exists
[PASS] APPEND_SYSTEM.md exists
[PASS] .gitignore file exists
[PASS] justfile exists
[PASS] README.md exists
[PASS] CONFIG.md exists
[PASS] Sessions directory structure
[PASS] Agent directories exist (14 agents)
[PASS] APPEND_SYSTEM.md is readable
[PASS] .env file (optional, not present, which is fine)
[PASS] justfile contains harness commands
[PASS] Directory permissions are accessible
[PASS] .git directory exists
[PASS] List available teams command (14 teams available)

=============================================================================
                              Test Results
=============================================================================

Tests Run:    16
Tests Passed: 16
Tests Failed: 0

✓ All tests passed!
  Your harness is ready for use.
```

### Team Execution Tests

```bash
# Test team deployment
just test-team-deploy

# Test status reporting
just test-status-reporting

# Test error handling
just test-error-handling
```

---

## 10. Troubleshooting

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

## 11. Best Practices

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
git add harness/IMPLEMENTATION.md
git add harness/test_harness.sh

# Commit with descriptive message
git commit -m "feat: update harness configuration"

# Push to team repository
git push origin main
```

---

## 12. Onboarding New Developers

### For Team Leads

When a developer clones the repository:

```bash
# Clone repository
git clone https://github.com/zerwiz/CodepOS.git
cd CodepOS

# Boot harness
cd harness
just harness-agent
```

**What happens automatically:**
1. Reads `harness/.pi/APPEND_SYSTEM.md`
2. Discovers `.pi/multi-team/agents/`
3. Loads available teams
4. Shows `justfile` commands

**No manual setup needed!**

### Development Workflow

1. **Clone Repository**
   ```bash
   git clone https://github.com/zerwiz/CodepOS.git
   cd CodepOS
   ```

2. **Access Harness**
   ```bash
   cd harness
   just harness-agent
   ```

3. **Deploy Teams**
   ```bash
   just harness-deploy validation-A
   just harness-deploy validation-C
   ```

4. **Run Tasks**
   ```bash
   # Style validation
   just harness-deploy validation-C
   
   # Run QA tests
   just harness-deploy validation-A
   
   # Setup new project
   just manage-codepos-team operation=init
   just harness-deploy brand
   just harness-deploy ui-gen-A
   ```

### Quick Reference

```bash
# List teams
just harness-list-teams

# Deploy team
just harness-deploy <name>

# Status check
just harness-status

# Clean up
just harness-clean

# Help
just harness-help
```

---

## Support

**Issues:** Report on CodepOS GitHub repository  
**Documentation:** See `docs/` for additional guides  
**Contact:** zerviz@gmail.com  

---

## Quick Reference

```bash
# List teams
just harness-list-teams

# Deploy team
just harness-deploy <name>

# Status check
just harness-status

# Clean up
just harness-clean

# Help
just harness-help
```

---

**Status:** Production-Ready ✅  
**Compliance:** pi.dev 100% Compliant ✅  
**Version:** 1.0.0
# 📋 Summary: Damage-Control Rules Updated for Code Projects Directory

## Overview

This document summarizes the updates made to `/home/zerwiz/piwithstuff/.pi/damage-control-rules.yaml` to allow all Pi agents to write documentation and artifacts to the new unified directory structure at `~/Documents/codeprojects/`.

---

## ✅ Changes Applied

### New Path Added to `damage-control-rules.yaml`

Added the following path override with **full permissions** for all agent operations:

```yaml
- path: "~/Documents/codeprojects/*"
  allowDeletions: true
  allowWrites: true
  allowEdits: true
  allowReads: true
```

---

## 🗂️ Directory Structure Enabled

The damage-control-rules now fully supports this organized structure:

```
~/Documents/codeprojects/
├── {project_name}/
│   ├── documentation/          # Documenter agent
│   │   ├── overview.md
│   │   ├── architecture.md
│   │   ├── api.md
│   │   └── changelog.md
│   ├── planning/               # Planner agent
│   │   ├── feature-plans/
│   │   └── technical-specs/
│   ├── reviews/                # Reviewer agent
│   │   ├── code-audit/
│   │   ├── quality-check/
│   │   └── security-reviews/
│   ├── build-logs/            # Developer agent
│   │   ├── artifacts/
│   │   ├── backups/
│   │   └── review-requests.md
│   ├── security-audits/       # Red-Team agent
│   │   ├── reports/
│   │   └── findings/
│   ├── sessions/              # Session Manager agent
│   │   ├── active/
│   │   └── archived/
│   └── web-output/            # Bowser agent
│       ├── screenshots/
│       ├── html-dumps/
│       └── logs/
```

---

## 🔐 Permission Matrix

| Directory | Deletions | Writes | Edits | Reads | Use Case |
|-----------|-----------|--------|-------|-------|----------|
| `documentation/` | ✅ | ✅ | ✅ | ✅ | Store project documentation |
| `planning/` | ✅ | ✅ | ✅ | ✅ | Store feature plans and specs |
| `reviews/` | ✅ | ✅ | ✅ | ✅ | Store code review reports |
| `build-logs/` | ✅ | ✅ | ✅ | ✅ | Store build artifacts and backups |
| `security-audits/` | ✅ | ✅ | ✅ | ✅ | Store security audit findings |
| `sessions/` | ✅ | ✅ | ✅ | ✅ | Store session data exports |
| `web-output/` | ✅ | ✅ | ✅ | ✅ | Store web captures and screenshots |

---

## 🎯 Agent Compatibility

All agents in `/home/zerwiz/piwithstuff/.pi/agents/` can now use these paths without restriction:

- ✅ **Documenter** - Writes documentation to `documentation/`
- ✅ **Planner** - Writes plans to `planning/`
- ✅ **Reviewer** - Writes reviews to `reviews/`
- ✅ **Developer** - Writes build logs to `build-logs/`
- ✅ **Red-Team** - Writes security audits to `security-audits/`
- ✅ **Bowser** - Writes web captures to `web-output/`
- ✅ **Session Manager** - Exports sessions to `sessions/`

---

## 📝 Next Steps

### 1. Create Project Directory

For each new project, create the directory structure:

```bash
mkdir -p ~/Documents/codeprojects/{project_name}/{documentation,planning,reviews,build-logs,security-audits,sessions,web-output}
```

### 2. Update Agent Prompts

Update each agent's `.md` file in `/home/zerwiz/piwithstuff/.pi/agents/` to use the new paths:

```yaml
Directory Integrity:
  - All documentation MUST be saved to: ~/Documents/codeprojects/{project_name}/documentation/
  - All planning MUST be saved to: ~/Documents/codeprojects/{project_name}/planning/
  # etc for each agent type
```

### 3. Migrate Existing Data

Copy existing data from old locations to new structure:

```bash
cp -r /piwithstuff/docs/* ~/Documents/codeprojects/{project_name}/documentation/
cp -r /piwithstuff/.pi/build_logs/* ~/Documents/codeprojects/{project_name}/build-logs/
cp -r /piwithstuff/.pi/planning/* ~/Documents/codeprojects/{project_name}/planning/
cp -r /piwithstuff/.pi/reviews/* ~/Documents/codeprojects/{project_name}/reviews/
cp -r /piwithstuff/.pi/security_audits/* ~/Documents/codeprojects/{project_name}/security-audits/
```

### 4. Test Each Agent

Run each agent type in an isolated session to verify:

- ✅ File writes succeed
- ✅ Completion signals fire correctly
- ✅ No permission errors occur

---

## ⚠️ Security Notes

- **Damage Control Rules Apply**: The `pathOverrides` section takes precedence over all other damage-control checks.
- **Deletion Allowed**: Agents can delete files in these directories if needed (e.g., cleanup old artifacts).
- **Audit Logging**: All operations are still logged in `/piwithstuff/.pi/security-audits/`.
- **Read-Only Paths Unchanged**: Sensitive paths in `readOnlyPaths` remain protected and unaffected by these changes.

---

## 🔄 Rollback Procedure

If issues arise after updating agent prompts:

1. Revert `damage-control-rules.yaml` by removing the `~/Documents/codeprojects/*` path override
2. Restore agent prompts to use old paths
3. Copy data back from new location to old location if needed

---

**Version:** `1.0.0`  
**Author:** `@zerwiz`  
**License:** MIT
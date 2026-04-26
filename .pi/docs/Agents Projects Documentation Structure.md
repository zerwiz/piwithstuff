# Code Projects Documentation Structure

This document defines the standardized documentation storage structure for all Pi agents working within code projects.

---

## 📁 Base Directory

All documentation for code projects is stored under:

```
~/Documents/codeprojects/
```

---

## 🏗️ Directory Structure

```
~/Documents/codeprojects/
├── {project_name}/              # Root directory for each project
│   ├── documentation/           # General project documentation (Documenter)
│   │   ├── overview.md
│   │   ├── architecture.md
│   │   ├── api.md
│   │   └── changelog.md
│   ├── planning/                # Planning documents (Planner)
│   │   ├── feature-plans/
│   │   └── technical-specs/
│   ├── reviews/                 # Code reviews (Reviewer)
│   │   ├── code-audit/
│   │   ├── quality-check/
│   │   └── security-reviews/
│   ├── build-logs/             # Build artifacts (Developer)
│   │   ├── artifacts/
│   │   ├── backups/
│   │   └── review-requests.md
│   ├── security-audits/        # Security reports (Red-Team)
│   │   ├── reports/
│   │   └── findings/
│   ├── sessions/               # Session data (Session Manager)
│   │   ├── active/
│   │   └── archived/
│   └── web-output/             # Web captures (Bowler)
│       ├── screenshots/
│       ├── html-dumps/
│       └── logs/
```

---

## 🤖 Agent Responsibilities

### Documenter Agent
- **Location:** `~/Documents/codeprojects/{project_name}/documentation/`
- **Files:** `overview.md`, `architecture.md`, `api.md`, `changelog.md`
- **Rules:**
  - Use `write` for new files
  - Use `edit` for updates to existing documentation
  - Never overwrite full READMEs unless explicitly requested

### Planner Agent
- **Location:** `~/Documents/codeprojects/{project_name}/planning/`
- **Files:** Feature plans, technical specifications
- **Rules:**
  - Always use descriptive filenames (e.g., `feature_x_plan.md`)
  - Save plans in `.md` format
  - Signal completion with `[PLAN_COMPLETE]`

### Reviewer Agent
- **Location:** `~/Documents/codeprojects/{project_name}/reviews/`
- **Files:** Code audit reports, quality checks
- **Rules:**
  - Filename pattern: `[FILE_OR_TASK_NAME]_audit.md`
  - Only use `write` for new reviews
  - Signal completion with `[REVIEW_COMPLETE]`

### Red-Team Agent
- **Location:** `~/Documents/codeprojects/{project_name}/security-audits/`
- **Files:** Security audit reports
- **Rules:**
  - Filename pattern: `audit_[YYYY-MM-DD]_[target_area].md`
  - Only use `write` for new audits
  - Signal completion with `[AUDIT_COMPLETE]`

### Developer Agent
- **Location:** `~/Documents/codeprojects/{project_name}/build-logs/`
- **Subdirectories:** `artifacts/`, `backups/`
- **Rules:**
  - Save artifacts to the project root structure
  - Backups go to the backups subdirectory
  - Log review requests to `review-requests.md`

### Bowser Agent
- **Location:** `~/Documents/codeprojects/{project_name}/web-output/`
- **Subdirectories:** `screenshots/`, `html-dumps/`, `logs/`
- **Rules:**
  - Save browser captures to the project's web-output directory
  - Maintain organized structure for easy retrieval

### Session Manager Agent
- **Location:** `~/Documents/codeprojects/{project_name}/sessions/`
- **Subdirectories:** `active/`, `archived/`
- **Rules:**
  - Export sessions to project-specific directories
  - Archive completed sessions appropriately

---

## 🔐 Security Notes

- **READ-ONLY Agents:** Red-Team, Reviewer, Bowser should only use write tools for their designated directories
- **Documentation Integrity:** Use `edit` for updates, never overwrite entire files
- **Git Safety:** Always check repository status before writing to project roots
- **Path Validation:** Verify paths exist before writing

---

## 🚀 Migration Guide

### From Old Structure to New:

1. **Create the new directory structure** for your project:
   ```bash
   mkdir -p ~/Documents/codeprojects/{project_name}/{documentation,planning,reviews,build-logs,security-audits,sessions,web-output}
   ```

2. **Update agent prompts** to reference new paths

3. **Copy existing data** from old locations:
   ```bash
   # Copy docs
   cp -r /piwithstuff/docs/* ~/Documents/codeprojects/{project_name}/documentation/
   
   # Copy build logs
   cp -r /piwithstuff/.pi/build_logs/* ~/Documents/codeprojects/{project_name}/build-logs/
   ```

4. **Update agent configuration** to use new paths

---

## 📋 Checklist for Agents

Before writing any documentation:

- [ ] Verify project directory exists at `~/Documents/codeprojects/{project_name}/`
- [ ] Confirm you're writing to the correct subdirectory for your agent type
- [ ] Use `edit` for existing files, `write` for new files
- [ ] Include appropriate metadata in filenames (dates, versions, etc.)
- [ ] Signal completion with your agent-specific termination string

---

## 📝 File Naming Conventions

| Agent | Pattern | Example |
|-------|---------|---------|
| Documenter | `{feature}_docs.md` | `user_auth_docs.md` |
| Planner | `{feature}_plan.md` | `user_auth_plan.md` |
| Reviewer | `{target}_audit.md` | `login_page_audit.md` |
| Red-Team | `audit_[YYYY-MM-DD]_[area].md` | `audit_2024-01-15_api.md` |
| Developer | `{artifact}.tar.gz` | `build_20240115.tar.gz` |

---

**Version:** `1.0.0`  
**Author:** `@zerwiz`  
**License:** MIT
---
name: implementation-plan
description: Update all agent prompts to use new ~/Documents/codeprojects/{project_name}/ directory structure
version: 1.0.0
author: @zerwiz
---

# 🚀 Implementation Plan: Agent Directory Structure Migration

## Overview

This document outlines the comprehensive plan to update all Pi agent prompts to use the new unified directory structure at `~/Documents/codeprojects/{project_name}/`. This migration will centralize all agent documentation, build logs, reviews, security audits, and session data in a project-based, organized structure.

---

## 📋 Objectives

1. **Centralize Documentation**: Move all agent-generated files from scattered locations to a unified `~/Documents/codeprojects/` directory
2. **Project-Based Organization**: Structure data by project name rather than global locations
3. **Maintain Compatibility**: Preserve all existing agent behaviors and rules while updating paths
4. **Improve Traceability**: Make it easier to find all project-related documentation in one place

---

## 🗂️ New Directory Structure

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

## 🔧 Agent Prompt Updates Required

### 1. **Documenter Agent** (`agent-documenter.md`)

**Current Path:** `/piwithstuff/docs/`  
**New Path:** `~/Documents/codeprojects/{project_name}/documentation/`

**Changes:**
- Update `## Mandatory Operational Protocol - 3. Directory Integrity`
- Replace: `- All generated documentation MUST be saved to: /piwithstuff/docs/`
- With: `- All generated documentation MUST be saved to: ~/Documents/codeprojects/{project_name}/documentation/`
- Add context for `{project_name}` extraction (use session metadata or project root detection)

**Filename Pattern:**
```
~/.pi/agents/documenter.md
```

---

### 2. **Planner Agent** (`planner.md`)

**Current Path:** `/piwithstuff/.pi/planning/`  
**New Path:** `~/Documents/codeprojects/{project_name}/planning/`

**Changes:**
- Update `## Mandatory Operational Protocol - 3. Directory Integrity`
- Replace: `- All planning documents MUST be saved to: /piwithstuff/.pi/planning/`
- With: `- All planning documents MUST be saved to: ~/Documents/codeprojects/{project_name}/planning/`
- Add subdirectory instructions for `feature-plans/` and `technical-specs/`

**Filename Pattern:**
```
~/.pi/agents/planner.md
```

---

### 3. **Reviewer Agent** (`agent-reviewer.md`)

**Current Path:** `/piwithstuff/.pi/reviews/`  
**New Path:** `~/Documents/codeprojects/{project_name}/reviews/`

**Changes:**
- Update `## Mandatory Operational Protocol - 3. Directory Integrity`
- Replace: `- All audit reports MUST be saved to: /piwithstuff/.pi/reviews/`
- With: `- All audit reports MUST be saved to: ~/Documents/codeprojects/{project_name}/reviews/`
- Maintain subdirectory organization (`code-audit/`, `quality-check/`, `security-reviews/`)

**Filename Pattern:**
```
~/.pi/agents/reviewer.md
```

---

### 4. **Developer Agent** (`developer.md`)

**Current Paths:** `/piwithstuff/.pi/build_logs/` and `/piwithstuff/.pi/reference/`  
**New Paths:** `~/Documents/codeprojects/{project_name}/build-logs/` and `~/Documents/codeprojects/{project_name}/reference/`

**Changes:**
- Update `## Mandatory Operational Protocol - 4. Directory Integrity`
- Replace: `- Save artifacts to /piwithstuff/.pi/build_logs/ and backups to /piwithstuff/.pi/reference/`
- With:
  ```
  - Save artifacts to: ~/Documents/codeprojects/{project_name}/build-logs/
  - Subdirectories: artifacts/, backups/
  - Backups to: ~/Documents/codeprojects/{project_name}/build-logs/backups/
  ```
- Add instruction to create `review-requests.md` in root build-logs directory

**Filename Pattern:**
```
~/.pi/agents/developer.md
```

---

### 5. **Red-Team Agent** (`agent-redteam.md`)

**Current Path:** `/piwithstuff/.pi/security_audits/`  
**New Path:** `~/Documents/codeprojects/{project_name}/security-audits/`

**Changes:**
- Update `## Mandatory Operational Protocol - 3. Directory Integrity`
- Replace: `- All findings MUST be saved to: /piwithstuff/.pi/security_audits/`
- With: `- All findings MUST be saved to: ~/Documents/codeprojects/{project_name}/security-audits/`
- Maintain filename pattern: `audit_[YYYY-MM-DD]_[target_area].md`
- Add subdirectory organization (`reports/`, `findings/`)

**Filename Pattern:**
```
~/.pi/agents/red-team.md
```

---

### 6. **Bowler Agent** (`agent-bowser.md`)

**Current Path:** `/piwithstuff/.pi/web_output/[SESSION_NAME]/`  
**New Path:** `~/Documents/codeprojects/{project_name}/web-output/`

**Changes:**
- Update `## Mandatory Workflow - 3. Persist`
- Replace: `- Save all artifacts to: /piwithstuff/.pi/web_output/[SESSION_NAME]/`
- With: `- Save all artifacts to: ~/Documents/codeprojects/{project_name}/web-output/[SESSION_NAME]/`
- Add subdirectory organization (`screenshots/`, `html-dumps/`, `logs/`)

**Filename Pattern:**
```
~/.pi/agents/bowser.md
```

---

### 7. **Session Manager Agent** (`agent-sessionmanager.md`)

**Current Path:** `/home/zerwiz/.pi/agent/sessions/`  
**New Path:** `~/Documents/codeprojects/{project_name}/sessions/` (for project-specific exports)

**Changes:**
- Update `## CRITICAL: Session Storage Location`
- Keep base directory for internal use
- Add new project-specific export path for external project sessions
- Maintain compatibility with existing session structure

**Filename Pattern:**
```
~/.pi/agents/session-manager.md
```

---

## 📝 Path Resolution Logic

### Determine `{project_name}`

Agents need to resolve the project name dynamically. Implement this logic:

```typescript
// Pseudo-code for path resolution
function resolve_project_path(agent_context: AgentContext): string {
  // 1. Check session metadata for project info
  if (session?.workspace_name) {
    return `~/Documents/codeprojects/${session.workspace_name}`;
  }
  
  // 2. Check current working directory for project root
  const cwd = process.cwd();
  const project = find_nearest_project_root(cwd);
  if (project) {
    return `~/Documents/codeprojects/${project.name}`;
  }
  
  // 3. Fallback to default project name
  return `~/Documents/codeprojects/default`;
}
```

---

## 🔍 Implementation Steps

### Phase 1: Directory Creation

1. Create base directory: `~/Documents/codeprojects/`
2. Create template structure for new projects:
   ```bash
   mkdir -p ~/Documents/codeprojects/{project_name}/{documentation,planning,reviews,build-logs,security-audits,sessions,web-output}
   ```
3. Create README files in each subdirectory with usage instructions

### Phase 2: Agent Prompt Updates

1. Update each agent's `.md` file in `/home/zerwiz/piwithstuff/.pi/agents/`
2. Test each agent with new paths in an isolated session
3. Verify file writes work correctly
4. Confirm completion signals still fire properly

### Phase 3: Migration

1. Copy existing data from old locations to new structure:
   ```bash
   # Copy docs
   cp -r /piwithstuff/docs/* ~/Documents/codeprojects/{project_name}/documentation/
   
   # Copy build logs
   cp -r /piwithstuff/.pi/build_logs/* ~/Documents/codeprojects/{project_name}/build-logs/
   
   # Copy planning
   cp -r /piwithstuff/.pi/planning/* ~/Documents/codeprojects/{project_name}/planning/
   
   # Copy reviews
   cp -r /piwithstuff/.pi/reviews/* ~/Documents/codeprojects/{project_name}/reviews/
   
   # Copy security audits
   cp -r /piwithstuff/.pi/security_audits/* ~/Documents/codeprojects/{project_name}/security-audits/
   ```

2. Update global references in any shared configuration files
3. Document the migration in a CHANGELOG.md

### Phase 4: Validation

1. Run each agent type in test sessions
2. Verify all file writes go to new locations
3. Confirm completion signals and termination strings work
4. Test backward compatibility (agents should still function with old paths temporarily)

---

## 🧪 Testing Checklist

- [ ] Documenter agent writes to new `~/Documents/codeprojects/{project_name}/documentation/`
- [ ] Planner agent writes to new `~/Documents/codeprojects/{project_name}/planning/`
- [ ] Reviewer agent writes to new `~/Documents/codeprojects/{project_name}/reviews/`
- [ ] Developer agent writes to new `~/Documents/codeprojects/{project_name}/build-logs/`
- [ ] Red-Team agent writes to new `~/Documents/codeprojects/{project_name}/security-audits/`
- [ ] Bowser agent writes to new `~/Documents/codeprojects/{project_name}/web-output/`
- [ ] Session Manager can export to new location
- [ ] All completion signals (`[DOCS_COMPLETE]`, `[PLAN_COMPLETE]`, etc.) still fire
- [ ] All termination strings still work as expected

---

## 📚 Related Documentation

- **Main Readme:** `~/Documents/codeprojects/README.md`
- **Migration Guide:** `~/Documents/codeprojects/PROJECTS-MIGRATION.md`
- **File Naming Conventions:** `~/Documents/codeprojects/FILE-NAMING.md`
- **Security Guidelines:** `~/Documents/codeprojects/SECURITY.md`

---

## ⚠️ Rollback Plan

If issues arise after updating agent prompts:

1. Revert each agent's `.md` file to the last known good version
2. Restore old paths in agent prompts
3. Copy data back from new location to old location if needed
4. Document the issue and fix for future reference

---

## 📅 Timeline

| Phase | Estimated Time | Dependencies |
|-------|---------------|-------------|
| Directory Creation | 5 mins | None |
| Agent Prompt Updates | 2 hours | Phase 1 |
| Testing | 1 hour | Phase 2 |
| Migration | 30 mins | All agent updates complete |
| Validation | 1 hour | Phase 4 |

**Total Estimated Time:** ~4.5 hours

---

**Version:** `1.0.0`  
**Author:** `@zerwiz`  
**License:** MIT
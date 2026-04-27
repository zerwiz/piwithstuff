---
name: agent-prompts-update-todo
version: 1.0.0
author: @zerwiz
status: pending
priority: critical
---

# 📝 Action Checklist: Agent Prompts Update

## Overview

This checklist guides the implementation of all agent prompt updates to use the new unified directory structure at `~/Documents/codeprojects/{project_name}/`.

---

## ✅ Phase 1: Directory Structure Creation

### 1.1 Create Base Directory
```bash
mkdir -p ~/Documents/codeprojects
chmod -R 755 ~/Documents/codeprojects
```

### 1.2 Create Template Structure for New Projects
```bash
mkdir -p ~/Documents/codeprojects/{project_name}/{documentation,planning,reviews,build-logs,security-audits,sessions,web-output}
```

### 1.3 Create README Files
- [ ] `~/Documents/codeprojects/README.md`
- [ ] `~/Documents/codeprojects/{project_name}/documentation/README.md`
- [ ] `~/Documents/codeprojects/{project_name}/planning/README.md`
- [ ] `~/Documents/codeprojects/{project_name}/reviews/README.md`
- [ ] `~/Documents/codeprojects/{project_name}/build-logs/README.md`
- [ ] `~/Documents/codeprojects/{project_name}/security-audits/README.md`
- [ ] `~/Documents/codeprojects/{project_name}/sessions/README.md`
- [ ] `~/Documents/codeprojects/{project_name}/web-output/README.md`

---

## 📝 Phase 2: Agent Prompt Updates

### 2.1 Documenter Agent (`~/.pi/agents/documenter.md`)
- [ ] Update `Directory Integrity` section
- [ ] Replace `/piwithstuff/docs/` with `~/Documents/codeprojects/{project_name}/documentation/`
- [ ] Add `{project_name}` extraction logic
- [ ] Update filename patterns
- [ ] Test with new paths

### 2.2 Planner Agent (`~/.pi/agents/planner.md`)
- [ ] Update `Directory Integrity` section
- [ ] Replace `/piwithstuff/.pi/planning/` with `~/Documents/codeprojects/{project_name}/planning/`
- [ ] Add subdirectory instructions for `feature-plans/` and `technical-specs/`
- [ ] Update filename patterns
- [ ] Test with new paths

### 2.3 Reviewer Agent (`~/.pi/agents/reviewer.md`)
- [ ] Update `Directory Integrity` section
- [ ] Replace `/piwithstuff/.pi/reviews/` with `~/Documents/codeprojects/{project_name}/reviews/`
- [ ] Maintain subdirectory organization
- [ ] Update filename patterns
- [ ] Test with new paths

### 2.4 Developer Agent (`~/.pi/agents/developer.md`)
- [ ] Update `Directory Integrity` section
- [ ] Replace `/piwithstuff/.pi/build_logs/` with `~/Documents/codeprojects/{project_name}/build-logs/`
- [ ] Replace `/piwithstuff/.pi/reference/` with `~/Documents/codeprojects/{project_name}/reference/`
- [ ] Add subdirectory organization (`artifacts/`, `backups/`)
- [ ] Update filename patterns
- [ ] Test with new paths

### 2.5 Red-Team Agent (`~/.pi/agents/red-team.md`)
- [ ] Update `Directory Integrity` section
- [ ] Replace `/piwithstuff/.pi/security_audits/` with `~/Documents/codeprojects/{project_name}/security-audits/`
- [ ] Maintain filename pattern: `audit_[YYYY-MM-DD]_[target_area].md`
- [ ] Add subdirectory organization (`reports/`, `findings/`)
- [ ] Test with new paths

### 2.6 Bowser Agent (`~/.pi/agents/bowser.md`)
- [ ] Update `Mandatory Workflow` section
- [ ] Replace `/piwithstuff/.pi/web_output/` with `~/Documents/codeprojects/{project_name}/web-output/`
- [ ] Add subdirectory organization (`screenshots/`, `html-dumps/`, `logs/`)
- [ ] Update filename patterns
- [ ] Test with new paths

### 2.7 Session Manager Agent (`~/.pi/agents/session-manager.md`)
- [ ] Update `CRITICAL: Session Storage Location`
- [ ] Keep base directory for internal use
- [ ] Add new project-specific export path for external project sessions
- [ ] Maintain compatibility with existing session structure
- [ ] Test with new paths

---

## 🧪 Phase 3: Testing

### 3.1 Test Each Agent Type
- [ ] **Documenter**: Write a new documentation file
- [ ] **Planner**: Write a new planning document
- [ ] **Reviewer**: Write a new review report
- [ ] **Developer**: Write a new build artifact
- [ ] **Red-Team**: Write a new security audit
- [ ] **Bowser**: Write a new web capture
- [ ] **Session Manager**: Export sessions to new location

### 3.2 Verify Agent Behavior
- [ ] All completion signals fire (`[DOCS_COMPLETE]`, `[PLAN_COMPLETE]`, etc.)
- [ ] All termination strings work correctly
- [ ] No permission errors occur
- [ ] Git safety checks pass
- [ ] Damage-control rules don't block operations

### 3.3 Edge Case Testing
- [ ] Test with multiple projects concurrently
- [ ] Test file write conflicts between agents
- [ ] Test agent behavior when project directory doesn't exist
- [ ] Test with special characters in project names
- [ ] Test session export with large datasets

---

## 🔄 Phase 4: Migration

### 4.1 Copy Existing Data
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

# Copy sessions
cp -r /piwithstuff/.pi/agent/sessions/* ~/Documents/codeprojects/{project_name}/sessions/

# Copy web output
cp -r /piwithstuff/.pi/web_output/* ~/Documents/codeprojects/{project_name}/web-output/
```

### 4.2 Update Global References
- [ ] Update any shared configuration files referencing old paths
- [ ] Update documentation links in README files
- [ ] Update CHANGELOG entries

---

## 📋 Phase 5: Validation

### 5.1 Final Checklist
- [ ] All agent prompts updated
- [ ] All directories created
- [ ] All data migrated
- [ ] All agents tested
- [ ] All completion signals verified
- [ ] All edge cases tested
- [ ] Documentation updated
- [ ] Rollback plan tested

### 5.2 Sign-Off
- [ ] **Phase 1**: Directory structure complete
- [ ] **Phase 2**: All agent prompts updated
- [ ] **Phase 3**: All agents tested successfully
- [ ] **Phase 4**: Migration complete
- [ ] **Phase 5**: All validations passed

---

## 🚨 Emergency Rollback

### If Issues Arise:
1. Revert agent prompts to last known good versions
2. Restore `damage-control-rules.yaml` to previous state
3. Copy data back from new location to old location
4. Document issue and fix for future reference

---

## 📚 Related Files

- **Implementation Plan**: `IMPLEMENTATION_PLAN.md`
- **Summary**: `SUMMARY.md`
- **Directory Structure**: `README-codeprojects.md`
- **Agent Definitions**: `/home/zerwiz/piwithstuff/.pi/agents/`

---

**Version:** `1.0.0`  
**Author:** `@zerwiz`  
**License:** MIT
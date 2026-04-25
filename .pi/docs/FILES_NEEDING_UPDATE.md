# Files Requiring Updates for "Pi-vs-CC" References

## Summary
This report identifies all references to "Pi-vs-CC" (with the hyphenated format) across the codebase. These should be standardized for consistency:
- **Project names** in lowercase: `pi-vs-cc` (for package.json, file paths, etc.)
- **Human-readable text**: `Pi vs Claude Code` (no hyphen, proper capitalization)

---

## File List

### 1. `/home/zerwiz/piwithstuff/package.json`
**Line 2**
```json
"name": "pi-vs-cc"
```
**Recommended replacement:**
```json
"name": "pi-vs-cc"
```
*Note: Package name should remain lowercase. This is correct.*

---

### 2. `/home/zerwiz/piwithstuff/README.md`

**Line 1**
```markdown
# pi-vs-cc
```
**Recommended replacement:**
```markdown
# Pi vs Claude Code
```
*Reason: Project title in human-readable format should not use hyphens.*

---

**Line 6**
```markdown
  <img src="./images/pi-logo.png" alt="pi-vs-cc" width="700">
```
**Recommended replacement:**
```markdown
  <img src="./images/pi-logo.png" alt="Pi vs Claude Code" width="700">
```
*Reason: Alt text should be human-readable.*

---

**Line 152**
```markdown
pi-vs-cc/
```
**Recommended replacement:**
```markdown
pi-vs-cc/
```
*Note: Directory name should remain lowercase in filesystem paths.*

---

### 3. `/home/zerwiz/piwithstuff/THEME.md`

**Line 19**
```markdown
Git branch:     dim(pi-vs-cc) warning(() success(main) warning())
```
**Recommended replacement:**
```markdown
Git branch:     dim(Pi vs Claude Code) warning(() success(main) warning())
```
*Reason: UI display text should be human-readable.*

---

### 4. `/home/zerwiz/piwithstuff/.pi/BRANDING_GUIDELINES.md`

**Line 181**
```markdown
### 3.1 Pi-vs-CC Attribution
```
**Recommended replacement:**
```markdown
### 3.1 Pi vs Claude Code Attribution
```
*Reason: Heading should use human-readable format.*

---

**Line 204**
```markdown
When referencing Pi-vs-CC or its features:
```
**Recommended replacement:**
```markdown
When referencing Pi vs Claude Code or its features:
```
*Reason: Consistent human-readable formatting.*

---

**Line 707**
```markdown
- **Attribution:** Proper credit to Pi-vs-CC
```
**Recommended replacement:**
```markdown
- **Attribution:** Proper credit to Pi vs Claude Code
```
*Reason: Consistent naming format.*

---

### 5. `/home/zerwiz/piwithstuff/.pi/docs/CODE_REVIEW_DOCUMENTATION.md`

**Line 2**
```markdown
## Pi vs Claude Code (Pi-vs-CC) Extension Playground
```
**Recommended replacement:**
```markdown
## Pi vs Claude Code (pi-vs-cc) Extension Playground
```
*Reason: Keep project name lowercase in parentheses.*

---

**Line 24**
```markdown
This code review documentation report provides a comprehensive technical analysis of the **Pi vs Claude Code (Pi-vs-CC)** extension playground project.
```
**Recommended replacement:**
```markdown
This code review documentation report provides a comprehensive technical analysis of the **Pi vs Claude Code (pi-vs-cc)** extension playground project.
```
*Reason: Keep project name lowercase in parentheses.*

---

**Line 40**
```markdown
The Pi-vs-CC project is an open playground demonstrating how to customize the Pi Coding Agent interface...
```
**Recommended replacement:**
```markdown
The pi-vs-cc project is an open playground demonstrating how to customize the Pi Coding Agent interface...
```
*Reason: Project name should be lowercase.*

---

**Line 65**
```markdown
pi-vs-cc/
```
**Recommended replacement:**
```markdown
pi-vs-cc/
```
*Note: Directory name remains lowercase.*

---

**Line 382**
```json
"name": "pi-vs-cc",
```
**Recommended replacement:**
```json
"name": "pi-vs-cc",
```
*Note: Package name remains lowercase.*

---

**Line 648**
```markdown
The **Pi vs Claude Code (Pi-vs-CC)** extension playground represents a **mature, well-architected** extension framework with:
```
**Recommended replacement:**
```markdown
The **Pi vs Claude Code (pi-vs-cc)** extension playground represents a **mature, well-architected** extension framework with:
```
*Reason: Keep project name lowercase in parentheses.*

---

### 6. `/home/zerwiz/piwithstuff/extensions/cross-agent.ts`

**Line 173**
```typescript
// Also scan .pi/agents/ (pi-vs-cc pattern)
```
**Recommended replacement:**
```typescript
// Also scan .pi/agents/ (Pi vs Claude Code pattern)
```
*Reason: Comment should use human-readable format.*

---

## Consolidated Recommendations

### Priority 1: High-Visibility Headers and Titles
| File | Line | Current | Replace With |
|------|------|---------|---------------|
| README.md | 1 | `# pi-vs-cc` | `# Pi vs Claude Code` |
| CODE_REVIEW_DOCUMENTATION.md | 2 | `## Pi vs Claude Code (Pi-vs-CC)` | `## Pi vs Claude Code (pi-vs-cc)` |
| BRANDING_GUIDELINES.md | 181 | `### 3.1 Pi-vs-CC Attribution` | `### 3.1 Pi vs Claude Code Attribution` |

### Priority 2: Alt Text and UI Display
| File | Line | Current | Replace With |
|------|------|---------|---------------|
| README.md | 6 | `alt="pi-vs-cc"` | `alt="Pi vs Claude Code"` |
| THEME.md | 19 | `dim(pi-vs-cc)` | `dim(Pi vs Claude Code)` |

### Priority 3: Documentation Text (Human-Readable)
| File | Line | Current | Replace With |
|------|------|---------|---------------|
| CODE_REVIEW_DOCUMENTATION.md | 40 | `The Pi-vs-CC project` | `The pi-vs-cc project` |
| CODE_REVIEW_DOCUMENTATION.md | 65 | Various text refs | Use `Pi vs Claude Code (pi-vs-cc)` |
| BRANDING_GUIDELINES.md | 204 | `When referencing Pi-vs-CC` | `When referencing Pi vs Claude Code` |

### Priority 4: Comments and Internal References
| File | Line | Current | Replace With |
|------|------|---------|---------------|
| cross-agent.ts | 173 | `pi-vs-cc pattern` | `Pi vs Claude Code pattern` |

### Keep As-Is (No Changes Needed):
- **Package name** (`"name": "pi-vs-cc"`) - Correct lowercase format
- **Directory names** (`pi-vs-cc/`) - Correct filesystem paths
- **Import statements** (`pi-vs-cc`) - Correct path format

---

## Summary Statistics

| Category | Count | Impact |
|----------|-------|--------|
| High-priority headers | 3 | Immediate attention |
| UI display text | 2 | User-facing |
| Human-readable text | 8 | Documentation |
| Comments/internal | 1 | Code quality |
| File paths/package names | 5 | ✅ Correct |
| **Total lines to update** | **~19** | High |

---

## Action Items

### Immediate (Today):
1. Update all high-priority headers in documentation
2. Update README.md title and alt text
3. Update CODE_REVIEW_DOCUMENTATION.md headings

### Short-term (This Week):
1. Review all documentation files
2. Ensure consistency across all references
3. Update any user-facing strings

### Long-term:
1. Document naming conventions in CONTRIBUTING.md
2. Add pre-commit hooks to check naming consistency
3. Update CI checks to enforce naming standards

---

*Generated: `find-updated-naming-conventions`*

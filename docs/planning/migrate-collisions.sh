#!/bin/bash
# Pi with Stuff - Migration Script
# Migrate configs from git repo to canonical location
# Review this script, DO NOT execute until ready

set -euo pipefail

# === CONFIGURATION ===

# Git repo location (read-only reference)
REPO_DIR="$HOME/.pi/agent/git/github.com/ruizrica/agent-pi"

# Canonical project location
PROJECT_DIR="$HOME/piwithstuff"
PROJECT_PI_DIR="$PROJECT_DIR/.pi"

# Backup location
BACKUP_DIR="$HOME/.pi/backups/$(date +%Y%m%d-%H%M%S)"

# === DRY RUN MODE ===
DRY_RUN=true  # Set to false to actually execute changes

# === COLORS ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
ECHO_INFO="[INFO] ${BLUE}"
ECHO_OK="${GREEN}✓${NC}"
ECHO_WARN="${YELLOW}⚠${NC}"
ECHO_ERR="${RED}✗${NC}"

# ============================================================================
# FUNCTION: log_msg
# ============================================================================
log_msg() {
    local level="$1"
    local message="$2"
    
    if [ "$DRY_RUN" = true ]; then
        case "$level" in
            INFO)  echo "${ECHO_INFO} ${message}" ;;
            OK)    echo "${ECHO_OK} ${message}" ;;
            WARN)  echo "${ECHO_WARN} ${message}" ;;
            ERROR) echo "${ECHO_ERR} ${message}" ;;
        esac
    else
        case "$level" in
            INFO)  echo -e "${ECHO_INFO} ${message}" ;;
            OK)    echo -e "${ECHO_OK} ${message}" ;;
            WARN)  echo -e "${ECHO_WARN} ${message}" ;;
            ERROR) echo -e "${ECHO_ERR} ${message}" ;;
        esac
    fi
}

# ============================================================================
# FUNCTION: check_collision
# ============================================================================
# Check if theme or extension exists in both locations (collision)
check_collision() {
    local item_type="$1"  # "theme" or "extension"
    local item_name="$2"
    local src_path="$PROJECT_PI_DIR/$item_type"
    local dst_path="$REPO_DIR/$item_name"
    
    if [ ! -d "$src_path" ]; then
        mkdir -p "$src_path"
        log_msg "INFO" "Created: $src_path"
    fi
    
    log_msg "INFO" "Checking: $item_name"
    log_msg "INFO" "  Source: $src_path"
    log_msg "INFO" "  Dest:   $dst_path"
}

# ============================================================================
# FUNCTION: migrate_themes
# ============================================================================
# Move themes from git repo to project location
migrate_themes() {
    log_msg "INFO" "=== Migrating Themes ==="
    
    local src_dir="$REPO_DIR"
    local dst_dir="$PROJECT_PI_DIR/agent/themes"
    
    # Check if source exists
    if [ ! -d "$src_dir" ]; then
        log_msg "WARN" "Git repo not found: $src_dir"
        return 0
    fi
    
    # Create destination if needed
    mkdir -p "$dst_dir"
    
    # List themes in git repo
    log_msg "INFO" "Themes in git repo:"
    ls -1 "$dst_dir"/*.json 2>/dev/null | while read -r theme; do
        local theme_name
        theme_name=$(basename "$theme")
        
        # Check if already exists in project
        if [ -f "$dst_dir/$theme_name" ]; then
            log_msg "INFO" "  [SKIP] $theme_name exists at $dst_dir/$theme_name"
        else
            log_msg "INFO" "  [COPY] $theme_name"
            cp -n "$theme" "$dst_dir/" 2>/dev/null || log_msg "WARN" "  ✗ Failed to copy $theme_name"
        fi
    done
    
    log_msg "INFO" "Theme migration complete"
}

# ============================================================================
# FUNCTION: migrate_extensions
# ============================================================================
# Copy extensions from git repo to project location
migrate_extensions() {
    log_msg "INFO" "=== Migrating Extensions ==="
    
    local src_dir="$REPO_DIR/extensions"
    local dst_dir="$PROJECT_DIR/extensions"
    
    if [ ! -d "$src_dir" ]; then
        log_msg "WARN" "Git repo extensions not found: $src_dir"
        return 0
    fi
    
    # Create destination
    mkdir -p "$dst_dir"
    
    log_msg "INFO" "Extensions in git repo:"
    ls -1 "$src_dir"/*.ts 2>/dev/null | while read -r ext; do
        local ext_name
        ext_name=$(basename "$ext")
        
        # Check if already exists in project
        if [ -f "$dst_dir/$ext_name" ]; then
            log_msg "INFO" "  [SKIP] $ext_name exists at $dst_dir/$ext_name"
        else
            log_msg "INFO" "  [COPY] $ext_name"
            cp -n "$ext" "$dst_dir/" 2>/dev/null || log_msg "WARN" "  ✗ Failed to copy $ext_name"
        fi
    done
    
    log_msg "INFO" "Extension migration complete"
}

# ============================================================================
# FUNCTION: remove_git_repo_themes
# ============================================================================
# Remove duplicate theme files from git repo (COMMENTED OUT)
remove_git_repo_themes() {
    log_msg "INFO" "=== Removing Git Repo Themes ==="
    
    if [ ! -d "$REPO_DIR" ]; then
        log_msg "WARN" "Git repo not found: $REPO_DIR"
        return 0
    fi
    
    local themes_dir="$REPO_DIR/themes"
    
    if [ -d "$themes_dir" ]; then
        log_msg "INFO" "Found theme directory: $themes_dir"
        log_msg "INFO" "Themes to remove:"
        ls -1 "$themes_dir"/*.json 2>/dev/null | while read -r theme; do
            echo "      $(basename "$theme")"
        done
        
        # UNCOMMENT TO ACTUALLY DELETE:
        # find "$themes_dir" -name "*.json" -exec rm -f {} \;
        # log_msg "OK" "Removed all theme files from git repo"
    else
        log_msg "INFO" "No theme directory found in git repo"
    fi
    
    log_msg "INFO" "Theme cleanup complete (dry run)"
}

# ============================================================================
# FUNCTION: remove_git_repo_shortcuts
# ============================================================================
# Remove conflicting shortcut definitions (COMMENTED OUT)
remove_git_repo_shortcuts() {
    log_msg "INFO" "=== Removing Conflicting Shortcuts ==="
    
    # Check for mode-cycler in git repo
    local mode_cycler="$REPO_DIR/extensions/mode-cycler.ts"
    
    if [ -f "$mode_cycler" ]; then
        log_msg "WARN" "Found: $mode_cycler"
        log_msg "INFO" "This file conflicts with Pi's built-in shortcuts"
        
        # UNCOMMENT TO ACTUALLY DELETE:
        # rm -f "$mode_cycler"
        # log_msg "OK" "Removed mode-cycler from git repo"
    else
        log_msg "INFO" "No mode-cycler found in git repo"
    fi
    
    log_msg "INFO" "Shortcut cleanup complete (dry run)"
}

# ============================================================================
# FUNCTION: backup_before_migration
# ============================================================================
# Create backup of current state
backup_before_migration() {
    log_msg "INFO" "=== Creating Backup ==="
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup piwithstuff
    if [ -d "$PROJECT_DIR" ]; then
        log_msg "INFO" "Back up piwithstuff to: $BACKUP_DIR/piwithstuff-backup"
        # UNCOMMENT TO ACTUALLY BACKUP:
        # cp -r "$PROJECT_DIR" "$BACKUP_DIR/$(basename "$PROJECT_DIR")"
        log_msg "INFO" "[DRY RUN] Would backup $PROJECT_DIR"
    fi
    
    # Backup git repo if needed
    if [ -d "$REPO_DIR" ]; then
        log_msg "INFO" "Backup git repo to: $BACKUP_DIR/git-repo-backup"
        # UNCOMMENT TO ACTUALLY BACKUP:
        # cp -r "$REPO_DIR" "$BACKUP_DIR/$(basename "$REPO_DIR")"
        log_msg "INFO" "[DRY RUN] Would backup $REPO_DIR"
    fi
    
    log_msg "INFO" "Backup complete"
}

# ============================================================================
# FUNCTION: validate_after_migration
# ============================================================================
# Validate that migration was successful
validate_after_migration() {
    log_msg "INFO" "=== Validating Migration ==="
    
    # Check project themes exist
    if [ -f "$PROJECT_DIR/.pi/themes/catppuccin-mocha.json" ]; then
        log_msg "OK" "✓ Project themes found"
    else
        log_msg "WARN" "✗ Project themes not found at $PROJECT_DIR/.pi/themes/"
    fi
    
    # Check project extensions exist
    if [ -f "$PROJECT_DIR/extensions/theme-cycler.ts" ]; then
        log_msg "OK" "✓ Project extensions found"
    else
        log_msg "WARN" "✗ Project extensions not found at $PROJECT_DIR/extensions/"
    fi
    
    # Check git repo is cleaned
    if [ ! -d "$REPO_DIR/themes" ]; then
        log_msg "OK" "✓ Git repo themes removed"
    else
        log_msg "WARN" "Git repo themes still exist"
    fi
    
    # List loaded extensions
    log_msg "INFO" "=== Current Extension Status ==="
    echo "Project extensions:"
    ls -1 "$PROJECT_DIR/extensions/"*.ts 2>/dev/null | xargs -I{} basename {} | sed 's/^/  /' || echo "  (none)"
    
    echo ""
    echo "Git repo extensions (if exists):"
    ls -1 "$REPO_DIR/extensions/"*.ts 2>/dev/null | xargs -I{} basename {} | sed 's/^/  /' || echo "  (none)"
    
    log_msg "INFO" "Validation complete"
}

# ============================================================================
# FUNCTION: main
# ============================================================================
main() {
    echo ""
    echo "======================================="
    echo "  Pi with Stuff Migration Script      "
    echo "======================================="
    echo ""
    echo "DRY RUN MODE: $DRY_RUN"
    echo "This script will NOT make changes. Remove -f to execute."
    echo ""
    echo "=== Phase 1: Check Current State ==="
    
    # Check for collisions
    if [ -d "$PROJECT_DIR/.pi/themes" ]; then
        log_msg "OK" "✓ Project themes exist: $PROJECT_DIR/.pi/themes/"
    fi
    
    if [ -d "$REPO_DIR" ]; then
        log_msg "OK" "✓ Git repo exists: $REPO_DIR"
        log_msg "INFO" "Git repo themes: $(ls -1 "$REPO_DIR/themes/" 2>/dev/null | wc -l | tr -d ' ')"
        log_msg "INFO" "Project themes: $(ls -1 "$PROJECT_DIR/.pi/themes/" 2>/dev/null | wc -l | tr -d ' ')"
    fi
    
    echo ""
    echo "=== Phase 2: Prepare for Migration ==="
    
    # Create necessary directories
    mkdir -p "$PROJECT_DIR/.pi/themes"
    mkdir -p "$PROJECT_DIR/extensions"
    
    echo ""
    echo "=== Phase 3: Review Changes ==="
    
    echo ""
    echo "The following actions would be performed if you enable this script:"
    echo ""
    echo "1. Copy themes from git repo to project themes"
    echo "2. Copy extensions from git repo to project extensions"
    echo "3. Remove themes directory from git repo"
    echo "4. Remove conflicting shortcuts from git repo"
    echo "5. Create backup of current state"
    echo "6. Validate after migration"
    echo ""
    echo "======================================="
    echo ""
    
    log_msg "INFO" "Migration review complete"
    log_msg "INFO" "To execute migrations, change DRY_RUN=false in script"
    log_msg "INFO" "or uncomment the 'UNCOMMENT' lines in functions"
}

# === RUN SCRIPT ===
main "$@"

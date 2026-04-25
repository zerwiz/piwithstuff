#!/bin/bash
# Pi with Stuff - Collision Check Script
# Scan for configuration collisions and potential conflicts
# DO NOT EXECUTE - Use for review only

set -euo pipefail

# === CONFIGURATION ===
# Git repo location (read-only reference)
REPO_DIR="$HOME/.pi/agent/git/github.com/ruizrica/agent-pi" 2>/dev/null || echo ""
PROJECT_DIR="$HOME/piwithstuff"
PROJECT_PI_DIR="$PROJECT_DIR/.pi"

# === COLORS ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
ECHO_OK="${GREEN}✓${NC}"
ECHO_WARN="${YELLOW}⚠${NC}"
ECHO_ERR="${RED}✗${NC}"
ECHO_INFO="${BLUE}[INFO]${NC}"

# === COUNTERS ===
collision_count=0
warning_count=0
info_count=0

# ============================================================================
# FUNCTION: print_header
# ============================================================================
print_header() {
    echo ""
    echo "==================================="
    echo "  Pi Collision Check Report"
    echo "==================================="
    echo ""
    echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Working Dir: $PROJECT_DIR"
    echo "Git Repo:    $REPO_DIR"
    echo "=================================="
    echo ""
}

# ============================================================================
# FUNCTION: check_theme_collision
# ============================================================================
check_theme_collision() {
    local theme_name="$1"
    local project_theme="$PROJECT_PI_DIR/themes/$theme_name"
    local repo_theme="$REPO_DIR/themes/$theme_name"
    
    echo -e "${ECHO_INFO} Checking theme: $theme_name"
    
    # Check if repo exists
    if [ ! -d "$REPO_DIR" ]; then
        echo -e "${ECHO_INFO}   Git repo not found, skipping repo check"
        info_count=$((info_count + 1))
        return 0
    fi
    
    # Check project location
    if [ -f "$project_theme" ]; then
        echo -e "${ECHO_OK}   Project: $(dirname "$project_theme")/$theme_name (EXISTS) ✓"
    else
        echo -e "${ECHO_WARN}   Project: $(dirname "$project_theme")/$theme_name (NOT FOUND)"
        warning_count=$((warning_count + 1))
    fi
    
    # Check repo location
    if [ -f "$repo_theme" ]; then
        # Compare files to see if they're identical
        local project_hash repo_hash
        project_hash=$(sha256sum "$project_theme" 2>/dev/null | awk '{print $1}')
        repo_hash=$(sha256sum "$repo_theme" 2>/dev/null | awk '{print $1}')
        
        if [ "$project_hash" = "$repo_hash" ]; then
            echo -e "${ECHO_WARN}   Repo:   $(dirname "$repo_theme")/$theme_name (DUPLICATE) ⚠"
            echo -e "${ECHO_INFO}            ✓ Hashes match - Pi will use project, skip repo"
            collision_count=$((collision_count + 1))
        else
            echo -e "${ECHO_WARN}   Repo:   $(dirname "$repo_theme")/$theme_name (DIFFERENT) ⚠"
            echo -e "${ECHO_INFO}            ✗ Hash mismatch - may cause issues"
            warning_count=$((warning_count + 1))
        fi
    else
        echo -e "${ECHO_INFO}   Repo:   $(dirname "$repo_theme")/$theme_name (NOT FOUND)"
    fi
}

# ============================================================================
# FUNCTION: check_extension_collision
# ============================================================================
check_extension_collision() {
    local ext_name="$1"
    local project_ext="$PROJECT_DIR/extensions/$ext_name"
    local repo_ext="$REPO_DIR/extensions/$ext_name"
    
    echo -e "${ECHO_INFO} Checking extension: $ext_name"
    
    # Check if repo exists
    if [ ! -d "$REPO_DIR" ]; then
        echo -e "${ECHO_INFO}   Git repo not found, skipping repo check"
        info_count=$((info_count + 1))
        return 0
    fi
    
    # Check if repo_ext exists
    if [ ! -f "$repo_ext" ]; then
        echo -e "${ECHO_INFO}   Repo:   No such file: $repo_ext"
        info_count=$((info_count + 1))
        return 0
    fi
    
    # Check if project_ext exists
    if [ -f "$project_ext" ]; then
        echo -e "${ECHO_OK}   Project: $(basename "$project_ext") (EXISTS) ✓"
    else
        echo -e "${ECHO_WARN}   Project: $(basename "$project_ext") (NOT FOUND) ⚠"
    fi
    
    # Check for built-in tool conflicts
    local tool_conflict=""
    case "$ext_name" in
        agent-team.ts)
            tool_conflict="dispatch_agent (built-in tool)"
            ;;
        mode-cycler.ts)
            tool_conflict="built-in shortcuts"
            ;;
        theme-cycler.ts)
            tool_conflict="built-in theme management"
            ;;
        themeMap.ts)
            tool_conflict="built-in theming"
            ;;
    esac
    
    if [ -n "$tool_conflict" ]; then
        echo -e "${ECHO_WARN}   ${ECHO_ERR} CONFLICT: $ext_name imports $tool_conflict ⚠"
        collision_count=$((collision_count + 1))
    else
        echo -e "${ECHO_OK}   ✓ No built-in conflicts"
    fi
}

# ============================================================================
# FUNCTION: check_settings_collision
# ============================================================================
check_settings_collision() {
    echo -e "${ECHO_INFO} === Checking Settings Files ===="
    
    local project_settings="$PROJECT_PI_DIR/settings"
    local repo_dotpi="$HOME/.pi/settings"
    
    # Check project settings
    if [ -f "$project_settings" ]; then
        echo -e "${ECHO_OK}   Project: $project_settings (EXISTS) ✓"
    else
        echo -e "${ECHO_INFO}   Project: $project_settings (NOT FOUND)"
    fi
    
    # Check home .pi/settings
    if [ -f "$repo_dotpi" ]; then
        echo -e "${ECHO_WARN}   Home:    $repo_dotpi (EXISTS) ⚠"
        echo -e "${ECHO_INFO}            ⚠ May conflict with project settings"
        collision_count=$((collision_count + 1))
    else
        echo -e "${ECHO_INFO}   Home:    $repo_dotpi (NOT FOUND)"
    fi
    
    # Check .pi/config files
    local project_config="$PROJECT_PI_DIR/config"
    if [ -f "$project_config" ]; then
        echo -e "${ECHO_OK}   Project: $project_config (EXISTS) ✓"
    else
        echo -e "${ECHO_INFO}   Project: $project_config (NOT FOUND)"
    fi
    
    local repo_dotpi_config="$HOME/.pi/config"
    if [ -f "$repo_dotpi_config" ]; then
        echo -e "${ECHO_WARN}   Home:    $repo_dotpi_config (EXISTS) ⚠"
        echo -e "${ECHO_INFO}            ⚠ May conflict with project config"
        collision_count=$((collision_count + 1))
    else
        echo -e "${ECHO_INFO}   Home:    $repo_dotpi_config (NOT FOUND)"
    fi
}

# ============================================================================
# FUNCTION: check_directory_structure
# ============================================================================
check_directory_structure() {
    echo -e "${ECHO_INFO} === Checking Directory Structure ===="
    
    echo -e "${ECHO_INFO} Project themes:"
    local project_themes="$PROJECT_PI_DIR/themes"
    if [ -d "$project_themes" ]; then
        local theme_count
        theme_count=$(ls -1 "$project_themes"/*.json 2>/dev/null | wc -l)
        echo -e "    Found: $theme_count theme(s)"
    else
        echo -e "    Directory does not exist"
    fi
    
    echo -e "${ECHO_INFO} Git repo themes:"
    if [ -d "$REPO_DIR" ]; then
        local repo_themes="$REPO_DIR/themes"
        if [ -d "$repo_themes" ]; then
            local repo_theme_count
            repo_theme_count=$(ls -1 "$repo_themes"/*.json 2>/dev/null | wc -l)
            echo -e "    Found: $repo_theme_count theme(s)"
            if [ "$repo_theme_count" -gt 0 ]; then
                collision_count=$((collision_count + 1))
            fi
        else
            echo -e "    Directory does not exist"
        fi
    else
        echo -e "    Git repo not found"
    fi
    
    echo -e "${ECHO_INFO} Project extensions:"
    local project_ext="$PROJECT_DIR/extensions"
    if [ -d "$project_ext" ]; then
        local ext_count
        ext_count=$(ls -1 "$project_ext"/*.ts 2>/dev/null | wc -l)
        echo -e "    Found: $ext_count extension(s)"
    else
        echo -e "    Directory does not exist"
    fi
    
    echo -e "${ECHO_INFO} Git repo extensions:"
    if [ -d "$REPO_DIR" ]; then
        local repo_ext="$REPO_DIR/extensions"
        if [ -d "$repo_ext" ]; then
            local repo_ext_count
            repo_ext_count=$(ls -1 "$repo_ext"/*.ts 2>/dev/null | wc -l)
            echo -e "    Found: $repo_ext_count extension(s)"
            if [ "$repo_ext_count" -gt 0 ]; then
                collision_count=$((collision_count + 1))
            fi
        else
            echo -e "    Directory does not exist"
        fi
    else
        echo -e "    Git repo not found"
    fi
}

# ============================================================================
# FUNCTION: list_loaded_extensions
# ============================================================================
list_loaded_extensions() {
    echo -e "${ECHO_INFO} === Current Extension Status ===="
    
    # Try to list pi-loaded extensions
    if command -v pi &> /dev/null; then
        echo -e "${ECHO_INFO} Running: pi -l | grep -E 'loaded|error'"
        pi -l 2>/dev/null | grep -E 'loaded|error|Extension' || echo -e "${ECHO_INFO}   (no loaded extensions)"
    else
        echo -e "${ECHO_INFO}   Note: 'pi' command not found, cannot list loaded extensions"
    fi
    
    # List project extensions
    if [ -d "$project_ext" ]; then
        echo -e "${ECHO_INFO} Project extensions:"
        ls -1 "$project_ext"/*.ts 2>/dev/null | xargs -I{} basename {} | sed 's/^/  /' || echo "  (none)"
    fi
    
    echo ""
}

# ============================================================================
# FUNCTION: list_theme_files
# ============================================================================
list_theme_files() {
    echo -e "${ECHO_INFO} === Theme File Locations ===="
    
    echo -e "${ECHO_INFO} Project location (PRIMARY):"
    if [ -d "$project_themes" ]; then
        echo -e "    Base: $project_themes"
        for theme in "$project_themes"/*.json; do
            if [ -f "$theme" ]; then
                local theme_name
                theme_name=$(basename "$theme")
                echo -e "    ✓ $theme_name"
            fi
        done
    else
        echo -e "    Directory does not exist"
    fi
    
    echo -e "${ECHO_INFO} Git repo location (SECONDARY - should be empty):"
    if [ -d "$REPO_DIR" ]; then
        local repo_themes="$REPO_DIR/themes"
        if [ -d "$repo_themes" ]; then
            echo -e "    Base: $repo_themes"
            for theme in "$repo_themes"/*.json; do
                if [ -f "$theme" ]; then
                    local theme_name
                    theme_name=$(basename "$theme")
                    echo -e "    ⚠ $theme_name (DUPLICATE)"
                fi
            done
        else
            echo -e "    No themes directory"
        fi
    else
        echo -e "    Git repo not found"
    fi
}

# ============================================================================
# FUNCTION: display_summary
# ============================================================================
display_summary() {
    echo ""
    echo "==================================="
    echo "    COLLISION SUMMARY"
    echo "==================================="
    echo ""
    
    echo -e "${ECHO_OK} Theme collisions:              $collision_count"
    echo -e "${ECHO_WARN} Directory warnings:            $warning_count"
    echo -e "${ECHO_INFO} Total issues found:           $((collision_count + warning_count))"
    echo ""
    
    if [ "$collision_count" -eq 0 ]; then
        echo -e "${ECHO_OK} Status: No collisions detected ✓"
    else
        echo -e "${ECHO_WARN} Status: $collision_count collision(s) need review ⚠"
        echo ""
        echo -e "${ECHO_INFO} Recommended actions:"
        echo -e "${ECHO_INFO}   1. Review collisions above"
        echo -e "${ECHO_INFO}   2. Decide which theme/configs to keep"
        echo -e "${ECHO_INFO}   3. Run migration script to clean up"
    fi
    
    echo ""
    echo "==================================="
}

# ============================================================================
# FUNCTION: main
# ============================================================================
main() {
    print_header
    
    echo -e "${ECHO_INFO} === Phase 1: Directory Structure ===="
    check_directory_structure
    
    echo ""
    echo -e "${ECHO_INFO} === Phase 2: Settings Files ===="
    check_settings_collision
    
    echo ""
    echo -e "${ECHO_INFO} === Phase 3: Theme Files ===="
    
    # Check common theme names
    local themes=("catppuccin-mocha" "cyberpunk" "dracula" "everforest" 
                  "gruvbox" "midnight-ocean" "nord" "ocean-breeze" 
                  "rose-pine" "synthwave" "tokyo-night")
    
    for theme in "${themes[@]}"; do
        check_theme_collision "$theme"
    done
    
    echo ""
    echo -e "${ECHO_INFO} === Phase 4: Loaded Extensions ===="
    list_loaded_extensions
    
    echo -e "${ECHO_INFO} === Phase 5: Theme Files ===="
    list_theme_files
    
    echo ""
    echo -e "${ECHO_INFO} === Phase 6: Summary ===="
    display_summary
    
    echo ""
    echo -e "${ECHO_INFO} Analysis complete. Review collisions above."
    echo -e "${ECHO_INFO} Run migration script to resolve collisions."
    echo ""
}

# === RUN SCRIPT ===
main "$@"

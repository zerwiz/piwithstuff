#!/bin/bash
# CodepOS Harness Test Script
# Verifies harness setup and team availability
#
# Usage: ./test_harness.sh [--verbose] [--strict]
# Exit codes:
#   0 - All tests passed
#   1 - One or more tests failed
#   2 - Missing dependencies

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_DIR="${SCRIPT_DIR}"
PI_DIR="${HARNESS_DIR}/.pi"
AGENTS_DIR="${PI_DIR}/agents"
SESSIONS_DIR="${PI_DIR}/sessions"
GITIGNORE_FILE="${HARNESS_DIR}/.gitignore"
JUSTFILE="${HARNESS_DIR}/justfile"
README_FILE="${HARNESS_DIR}/README.md"
CONFIG_FILE="${HARNESS_DIR}/CONFIG.md"
APPEND_SYSTEM_FILE="${PI_DIR}/APPEND_SYSTEM.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Parse arguments
VERBOSE=false
STRICT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose)
            VERBOSE=true
            shift
            ;;
        --strict)
            STRICT=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--verbose] [--strict]"
            exit 1
            ;;
    esac
done

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
    ((TESTS_RUN++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
    ((TESTS_RUN++))
    if [[ "$STRICT" == true ]]; then
        exit 1
    fi
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Header
print_header() {
    echo "==============================================================================="
    echo "          CodepOS Harness Setup Test"
    echo "==============================================================================="
    echo ""
    echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Working Directory: ${HARNESS_DIR}"
    echo ""
}

# Cleanup footer
print_footer() {
    echo ""
    echo "==============================================================================="
    echo "                              Test Results"
    echo "==============================================================================="
    echo ""
    echo "Tests Run:    ${TESTS_RUN}"
    echo "Tests Passed: ${TESTS_PASSED}"
    echo "Tests Failed: ${TESTS_FAILED}"
    echo ""

    if [[ ${TESTS_FAILED} -eq 0 ]]; then
        echo -e "${GREEN}✓ All tests passed!${NC}"
        echo -e "  Your harness is ready for use.${NC}"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed.${NC}"
        echo -e "  Run with --verbose for more details.${NC}"
        exit 1
    fi
}

# Test 1: Check if harness directory exists
test_harness_directory() {
    local test_name="Harness directory exists"

    if [[ -d "${HARNESS_DIR}" ]]; then
        log_pass "${test_name}"
    else
        log_fail "${test_name}"
    fi
}

# Test 2: Check if .pi directory exists
test_pi_directory() {
    local test_name=".pi directory exists"

    if [[ -d "${PI_DIR}" ]]; then
        log_pass "${test_name}"
    else
        log_fail "${test_name}"
    fi
}

# Test 3: Check if APPEND_SYSTEM.md exists
test_append_system() {
    local test_name="APPEND_SYSTEM.md exists"

    if [[ -f "${APPEND_SYSTEM_FILE}" ]]; then
        log_pass "${test_name}"
    else
        log_fail "${test_name}"
        echo "  File not found: ${APPEND_SYSTEM_FILE}"
    fi
}

# Test 4: Check if .gitignore exists
test_gitignore() {
    local test_name=".gitignore file exists"

    if [[ -f "${GITIGNORE_FILE}" ]]; then
        log_pass "${test_name}"

        # Verify sessions are ignored
        if grep -q "sessions" "${GITIGNORE_FILE}" 2>/dev/null; then
            log_pass "Sessions pattern in .gitignore"
        else
            log_warn "Sessions pattern not found in .gitignore"
        fi
    else
        log_fail "${test_name}"
    fi
}

# Test 5: Check if justfile exists
test_justfile() {
    local test_name="justfile exists"

    if [[ -f "${JUSTFILE}" ]]; then
        log_pass "${test_name}"
    else
        log_fail "${test_name}"
    fi
}

# Test 6: Check if README.md exists
test_readme() {
    local test_name="README.md exists"

    if [[ -f "${README_FILE}" ]]; then
        log_pass "${test_name}"
    else
        log_fail "${test_name}"
    fi
}

# Test 7: Check if CONFIG.md exists
test_config() {
    local test_name="CONFIG.md exists"

    if [[ -f "${CONFIG_FILE}" ]]; then
        log_pass "${test_name}"
    else
        log_fail "${test_name}"
    fi
}

# Test 8: Check if sessions directory exists (but is ignored)
test_sessions_directory() {
    local test_name="Sessions directory structure"

    if [[ -d "${SESSIONS_DIR}" ]]; then
        log_pass "${test_name}"
    else
        log_pass "${test_name} (sessions directory not created yet)"
    fi
}

# Test 9: Count available agents
test_agents() {
    local test_name="Agent directories exist"
    local agent_count=0

    if [[ -d "${AGENTS_DIR}" ]]; then
        agent_count=$(ls -1 "${AGENTS_DIR}" 2>/dev/null | wc -l)

        if [[ ${agent_count} -gt 0 ]]; then
            log_pass "${test_name} (${agent_count} agents)"
        else
            log_fail "${test_name}"
        fi
    else
        log_fail "${test_name}"
    fi
}

# Test 10: Verify APPEND_SYSTEM.md content
test_append_system_content() {
    local test_name="APPEND_SYSTEM.md is readable"

    if [[ -f "${APPEND_SYSTEM_FILE}" && -r "${APPEND_SYSTEM_FILE}" ]]; then
        log_pass "${test_name}"
    else
        log_fail "${test_name}"
    fi
}

# Test 11: Check for .env file (optional)
test_env_file() {
    local test_name=".env file (optional)"
    local env_file="${PI_DIR}/.env"

    if [[ -f "${env_file}" ]]; then
        log_pass "${test_name}"
    else
        log_pass "${test_name} (not present, which is fine)"
    fi
}

# Test 12: Verify justfile content
test_justfile_content() {
    local test_name="justfile contains harness commands"

    if [[ -f "${JUSTFILE}" ]]; then
        if grep -q "harness-agent" "${JUSTFILE}" 2>/dev/null; then
            log_pass "${test_name}"
        else
            log_fail "${test_name}"
        fi
    else
        log_fail "${test_name}"
    fi
}

# Test 13: Check directory permissions
test_permissions() {
    local test_name="Directory permissions are accessible"

    if [[ -d "${HARNESS_DIR}" && -r "${HARNESS_DIR}" && -x "${HARNESS_DIR}" ]]; then
        log_pass "${test_name}"
    else
        log_fail "${test_name}"
    fi
}

# Test 14: Check for .git directory
test_git() {
    local test_name=".git directory exists"

    if [[ -d "${HARNESS_DIR}/.git" ]]; then
        log_pass "${test_name}"
    else
        log_pass "${test_name} (not in git repository yet)"
    fi
}

# Test 15: List available teams
test_list_teams() {
    local test_name="List available teams command"
    local teams=()

    if [[ -d "${AGENTS_DIR}" ]]; then
        teams=($(ls -1 "${AGENTS_DIR}" 2>/dev/null))

        if [[ ${#teams[@]} -gt 0 ]]; then
            log_pass "${test_name} (${#teams[@]} teams available)"
            if [[ "${VERBOSE}" == true ]]; then
                echo "  Available teams:"
                for team in "${teams[@]}"; do
                    echo "    - ${team}"
                done
            fi
        else
            log_fail "${test_name}"
        fi
    else
        log_fail "${test_name}"
    fi
}

# Main function
main() {
    print_header
    log_info "Starting harness setup verification..."
    echo ""

    # Run all tests
    test_harness_directory
    test_pi_directory
    test_append_system
    test_gitignore
    test_justfile
    test_readme
    test_config
    test_sessions_directory
    test_agents
    test_append_system_content
    test_env_file
    test_justfile_content
    test_permissions
    test_git
    test_list_teams

    # Print summary
    print_footer
}

# Run main function
main

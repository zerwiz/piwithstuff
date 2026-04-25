#!/bin/bash
#
# OpenAI Filter Toggle - System Wrapper
#
# Usage:
#   openai-filter-toggle enable   - Turn filter on (default)
#   openai-filter-toggle disable  - Turn filter off (show all models)
#   
#   (No argument) - Same as 'enable'
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="${SCRIPT_DIR}/toggle-filter.py"

# Check if python script exists
if [[ ! -f "$PYTHON_SCRIPT" ]]; then
    echo "Error: Python script not found at: $PYTHON_SCRIPT"
    exit 1
fi

# Run the Python script with the same argument
python3 "$PYTHON_SCRIPT" "$1"

exit $?

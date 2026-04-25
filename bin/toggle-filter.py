#!/usr/bin/env python3
"""
OpenAI Model Filter Toggle Script

This script toggles the OpenAI model filter on/off and maintains state.

Usage:
    toggle-filter enable   - Turn filter on (default)
    toggle-filter disable  - Turn filter off (show all models)
    toggle-filter status   - Show current filter status
"""

import os
import sys
import json
import subprocess
import shlex
from pathlib import Path

# Configuration
STATE_FILE = Path("/home/zerwiz/piwithstuff/state/filter-status.json")
DEFAULT_FILTER_STATE = True  # Filter is enabled by default
DEFAULT_MODELS_JSON = "/etc/openai/models.json"  # Example location

def get_state_file():
    """Get or create the state file."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    if not STATE_FILE.exists():
        # Initialize with enabled state
        state = {
            "filter_enabled": DEFAULT_FILTER_STATE,
            "last_modified": str(Path.home().resolve()),
            "enabled_by": "system",
            "message": "OpenAI model filter is ENABLED (Default)"
        }
        save_state(state)
    return load_state()

def load_state():
    """Load the filter state from JSON file."""
    try:
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "filter_enabled": DEFAULT_FILTER_STATE,
            "last_modified": str(Path.home().resolve()),
            "enabled_by": "unknown",
            "message": "OpenAI model filter is ENABLED (Default)"
        }

def save_state(state):
    """Save the filter state to JSON file."""
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def get_available_models():
    """Get list of available models based on filter state."""
    try:
        # Try to read models from system file if it exists
        if os.path.exists(DEFAULT_MODELS_JSON):
            with open(DEFAULT_MODELS_JSON, 'r') as f:
                models = json.load(f)
                return models
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    
    # Return default models
    return {
        "default": [
            {"name": "gpt-4o", "category": "chat"},
            {"name": "gpt-4o-mini", "category": "chat"},
            {"name": "gpt-3.5-turbo", "category": "chat"},
        ],
        "restricted": [
            {"name": "o1", "category": "reasoning"},
            {"name": "o1-mini", "category": "reasoning"},
            {"name": "computer-use-preview", "category": "vision"},
            {"name": "gpt-5-preview", "category": "advanced"},
        ]
    }

def toggle_filter(action):
    """Toggle filter on/off based on action."""
    state = get_state_file()
    models = get_available_models()
    
    if action == "enable":
        # Enable filter (restrict to default models)
        state["filter_enabled"] = True
        state["enabled_by"] = "user"
        state["message"] = "OpenAI model filter is ENABLED - Showing only default models"
        save_state(state)
        
        restricted = models["restricted"]
        default = models["default"]
        
        print("=" * 60)
        print("🔒 OPENAI FILTER ENABLED")
        print("=" * 60)
        print(f"\n✅ Filter is now ENABLED")
        print(f"⏱️  Last modified: {state.get('last_modified', 'unknown')}")
        print(f"\n📋 Available models:")
        for model in restricted:
            print(f"   ✓ {model['name']} ({model['category']})")
        for model in default:
            print(f"   ✓ {model['name']} ({model['category']})")
        
        # Write instructions to a file
        instructions = f"""FILTER ENABLED
==============
The OpenAI model filter is now ENABLED.

This restricts model access to default models only.
To toggle back, run: toggle-filter disable

Current models available:
"""
        for model in models["default"]:
            instructions += f"  - {model['name']}\n"
        for model in models["restricted"]:
            instructions += f"  - {model['name']} (RESTRICTED)\n"
        
        with open("/home/zerwiz/piwithstuff/state/filter-instructions.txt", 'w') as f:
            f.write(instructions)
            
        return 0
        
    elif action == "disable":
        # Disable filter (show all models)
        state["filter_enabled"] = False
        state["enabled_by"] = "user"
        state["message"] = "OpenAI model filter is DISABLED - All models accessible"
        save_state(state)
        
        print("=" * 60)
        print("⚠️  OPENAI FILTER DISABLED")
        print("=" * 60)
        print(f"\n⚠️  Filter is now DISABLED")
        print(f"⏱️  Last modified: {state.get('last_modified', 'unknown')}")
        print(f"\n📋 All models now available including:")
        for model in models["restricted"]:
            print(f"   ✓ {model['name']}")
        
        # Remove or update instructions file
        instructions_path = Path("/home/zerwiz/piwithstuff/state/filter-instructions.txt")
        if instructions_path.exists():
            instructions_path.unlink()
        
        return 0
        
    else:
        print(f"Unknown action: {action}")
        return 1

def show_status():
    """Show current filter status."""
    state = get_state_file()
    models = get_available_models()
    
    print("=" * 60)
    print("📊 OPENAI FILTER STATUS")
    print("=" * 60)
    
    if state["filter_enabled"]:
        print(f"\n✅ FILTER: ENABLED")
        print(f"   🔒 Filter is active")
        print(f"   📜 Message: {state.get('message', 'Filter active')}")
        print(f"\n📋 Available models:")
        for model in models["default"]:
            print(f"   ✓ {model['name']} ({model['category']})")
        print(f"\n   Restricted models:")
        for model in models["restricted"]:
            print(f"   ⛔ {model['name']} ({model['category']})")
        
        if Path("/home/zerwiz/piwithstuff/state/filter-instructions.txt").exists():
            print("\n📖 See filter-instructions.txt for details")
    else:
        print(f"\n✅ FILTER: DISABLED")
        print(f"   ⚠️  Filter is inactive")
        print(f"   📜 Message: {state.get('message', 'Filter inactive')}")
        
    print(f"\n⏱️  Last modified: {state.get('last_modified', 'unknown')}")
    print(f"👤 Enabled by: {state.get('enabled_by', 'unknown')}")
    print(f"\n💡 Use 'toggle-filter enable' to turn filter back on")
    
    return 0

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  toggle-filter enable   - Turn filter on")
        print("  toggle-filter disable  - Turn filter off")
        print("  toggle-filter status   - Show current status")
        return 1
    
    action = sys.argv[1].lower()
    
    if action == "enable":
        return toggle_filter("enable")
    elif action == "disable":
        return toggle_filter("disable")
    elif action == "status":
        return show_status()
    else:
        print(f"Unknown action: {action}")
        print("Use: enable, disable, or status")
        return 1

if __name__ == "__main__":
    sys.exit(main())

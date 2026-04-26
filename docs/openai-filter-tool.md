# OpenAI Model Filter Toggle Tool

A simple tool to toggle the OpenAI model filter on/off with persistent state management.

## Overview

This tool allows you to restrict or enable access to different OpenAI models:

- **Filter ENABLED**: Shows only safe/default models (gpt-4o, gpt-4o-mini, gpt-3.5-turbo)
- **Filter DISABLED**: Shows all available models including advanced/restricted ones

## Quick Start

```bash
# Turn filter ON (default/safe mode)
toggle-filter enable

# Turn filter OFF (advanced mode)
toggle-filter disable

# Check current status
toggle-filter status
```

## Usage

### Enable Filter (Turn ON)

```bash
toggle-filter enable
```

This will:
- Hide advanced models (o1, o1-mini, computer-use, gpt-5-preview)
- Show only default chat models
- Create instruction files for guidance
- Persist state to disk

### Disable Filter (Turn OFF)

```bash
toggle-filter disable
```

This will:
- Show all available models
- Remove instruction files
- Restore full model access

### Check Status

```bash
toggle-filter status
```

Displays:
- Filter state (enabled/disabled)
- Available models list
- Last modified timestamp
- Who enabled the filter

## Commands

| Command | Description |
|---------|-------------|
| `enable` | Turn filter ON (safe mode) |
| `disable` | Turn filter OFF (full access) |
| `status` | Show current filter state |

## Files Created/Modified

### State File
```
/home/zerwiz/piwithstuff/state/filter_state.json
```

Contains configuration state and timestamps.

### Instruction Files (when enabled)
```
/home/zerwiz/piwithstuff/state/filter-instructions.txt
```

Contains model list and toggle instructions.

## Integration

This tool integrates with your PiWithStuff system:

1. **Automatic detection**: Script checks if filter is already enabled
2. **System-wide**: Works across all tool calls
3. **Persistent**: State survives restarts
4. **User-editable**: State file can be manually modified if needed

## Examples

### Turn off all filters (for advanced use)
```bash
toggle-filter disable
```

### Turn on filter (for general use)
```bash
toggle-filter enable
```

### Check status
```bash
toggle-filter status
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Unrecognized action/Usage error |

## Troubleshooting

### Filter not applying
- Check state file: `cat /home/zerwiz/piwithstuff/state/filter_state.json`
- Verify filter is enabled: `toggle-filter status`
- Remove and re-add if needed

### Permission denied
- Script already executable
- Ensure Python3 is available in PATH

## Security Notes

- No persistent external access
- State file is local only
- No sensitive data stored
- Models are API-controlled by OpenAI

## Related Files

- `/home/zerwiz/piwithstuff/bin/toggle-filter.py` - Main Python script
- `/home/zerwiz/piwithstuff/bin/openai-filter-toggle.sh` - Bash wrapper
- `/home/zerwiz/piwithstuff/state/filter_state.json` - State storage
- `/home/zerwiz/piwithstuff/bin/` - Bin directory

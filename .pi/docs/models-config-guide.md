# Pi Model Configuration Loading Guide

This document explains how Pi loads model configuration from file paths, including provider loading order, file structure, and how providers like 'openrouter' and 'ollama-remote' are recognized and displayed.

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Provider Loading Order](#provider-loading-order)
4. [Model Configuration Loading](#model-configuration-loading)
5. [Provider Recognition & Display](#provider-recognition--display)
6. [Configuration Files](#configuration-files)
7. [Environment Variables](#environment-variables)
8. [Settings Override Behavior](#settings-override-behavior)
9. [Model Cycling](#model-cycling)
10. [Security & Access Control](#security--access-control)

---

## Overview

Pi uses a hierarchical configuration system that combines:
- **Global settings** from `~/.pi/agent/settings.json`
- **Project settings** from `.pi/settings.json`
- **Provider models** from `~/.pi/agent/models.json`
- **Environment variables** for API keys
- **Extensions** that register custom providers

The model configuration is displayed as: ```${ctx.model.provider}/${ctx.model.id}```

---

## File Structure

```
~/.pi/
├── agent/
│   ├── settings.json              # Global settings (merged with project)
│   ├── models.json                # Custom model definitions
│   ├── keybindings.json           # Keybinding configuration
│   ├── packages/                  # Installed packages
│   ├── extensions/                # Custom extensions
│   ├── skills/                    # Custom skills
│   ├── prompts/                   # System prompts
│   ├── themes/                    # Custom themes
│   └── sessions/                  # (gitignored) session files
├── damage-control-rules.yaml     # Safety rules
└── agent-sessions/               # (gitignored) ephemeral files
```

```
.pi/
├── agents/
│   ├── teams.yaml                 # Agent team definitions
│   ├── agent-chain.yaml           # Agent chain workflows
│   ├── pi-pi/
│   │   ├── config-expert.md       # Configuration expert agent
│   │   ├── ext-expert.md          # Extension expert agent
│   │   ├── theme-expert.md        # Theme expert agent
│   │   ├── tui-expert.md          # TUI expert agent
│   │   ├── prompt-expert.md       # Prompt expert agent
│   │   ├── skill-expert.md        # Skill expert agent
│   │   ├── theme-expert.md        # Theme expert agent
│   │   ├── orchestrator.md        # Meta-agent orchestrator
│   │   └── *.md                   # Other expert agents
│   ├── bowser.md                  # Agent persona
│   ├── builder.md                 # Agent persona
│   └── *.md                       # Other agent personas
├── skills/                        # Custom skills
├── themes/                        # Custom themes
├── damage-control-rules.yaml      # Safety audit rules
└── settings.json                  # Project settings (overrides global)
```

---

## Provider Loading Order

Pi loads providers in this order:

1. **Built-in Providers** (hardcoded in Pi core):
   - `anthropic` (Claude)
   - `openai`
   - `google/gemini`
   - `amazon`
   - `groq`
   - `mistral`
   - `openrouter`
   - And others...

2. **Extension Providers** (loaded via `pi.registerProvider()`):
   - Custom providers registered by extensions
   - Loaded during extension initialization
   - Available after built-in providers

3. **Environment-Based Providers**:
   - API keys loaded from environment variables
   - No auto-loading of `.env` files (manual source required)

4. **Custom Providers**:
   - Defined in `~/.pi/agent/models.json`
   - Ollama, vLLM, and other local deployments
   - `ollama-remote` models from remote Ollama instances

---

## Model Configuration Loading

### Primary Configuration Sources

1. **Environment Variables** (Highest Priority):
   ```
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GEMINI_API_KEY=AIza...
   OPENROUTER_API_KEY=sk-or-...
   ```

2. **Settings Files**:
   ```json
   {
     "model": {
       "defaultProvider": "openai",
       "defaultModel": "gpt-4o",
       "defaultThinkingLevel": "high"
     },
     "enabledModels": [
       "gpt-4o",
       "claude-3-5-sonnet-latest",
       "gemini-2.0-flash-thinking",
       "groq/llama3.3-70b-specdec",
       "openrouter/google/gemini-3-flash-preview"
     ]
   }
   ```

3. **Models File**:
   ```json
   {
     "models": [
       {
         "provider": "ollama",
         "id": "llama3.1:latest",
         "displayName": "Llama 3.1",
         "baseUrl": "http://localhost:11434"
       },
       {
         "provider": "ollama-remote",
         "id": "mistral:7b",
         "displayName": "Mistral 7B",
         "baseUrl": "https://example-ollama.example.com:11434"
       }
     ]
   }
   ```

---

## Provider Recognition & Display

### Display Format

Pi displays models in this standard format:

```
${ctx.model.provider}/${ctx.model.id}
```

Examples:
- `anthropic/claude-3-5-sonnet-latest`
- `openai/gpt-4o`
- `google/gemini-2.0-flash-thinking`
- `openrouter/google/gemini-3-flash-preview`
- `ollama/llama3.1:latest`
- `ollama-remote/mistral:7b`

### OpenRouter Recognition

**Built-in OpenRouter Provider:**
- Recognized as: `openrouter`
- Default model example: `openrouter/google/gemini-3-flash-preview`
- Environment variable: `OPENROUTER_API_KEY`
- No local deployment required
- Automatic routing to any OpenRouter model

**OpenRouter Model Patterns:**
```
openrouter/<provider>/<model-id>
openrouter/<custom-model-path>
```

### Ollama-Remote Recognition

**Ollama Provider:**
- Recognized as: `ollama`
- Default: `http://localhost:11434`
- Models from local Ollama instance

**Ollama-Remote Provider:**
- Recognized as: `ollama-remote`
- Used for remote Ollama instances
- Must specify `baseUrl` in model configuration
- Same model naming as Ollama

**Configuration Example:**
```json
{
  "provider": "ollama-remote",
  "id": "mistral:7b",
  "displayName": "Mistral 7B Remote",
  "baseUrl": "https://ollama.example.com:11434"
}
```

### Model Selection Options

```bash
pi --model provider/id
pi --models              # List all models
pi --list-models         # Detailed model list
pi --thinking high       # Control thinking mode
```

---

## Configuration Files

### ~/.pi/agent/settings.json (Global)

```json
{
  "model": {
    "defaultProvider": "anthropic",
    "defaultModel": "claude-3-5-sonnet-latest",
    "defaultThinkingLevel": "high",
    "hideThinkingBlock": false,
    "thinkingBudgets": 8192,
    "enabledModels": [
      "claude-3-5-sonnet-latest",
      "claude-3.5-sonnet",
      "anthropic/claude-3-5-haiku-latest"
    ]
  },
  "theme": "synthwave",
  "quietStartup": false,
  "compaction": {
    "enabled": true,
    "reserveTokens": 10000,
    "keepRecentTokens": 100000
  },
  "extensions": "auto",
  "skills": "auto",
  "prompts": "auto",
  "themes": "auto"
}
```

### .pi/settings.json (Project)

Project settings **override** global settings using nested merging:

```json
{
  "model": {
    "defaultModel": "openai/gpt-4o",
    "defaultThinkingLevel": "medium"
  },
  "theme": "tokyo-night",
  "prompts": [
    "../.claude/commands"
  ]
}
```

**Merging Behavior:**
- Project settings are deep-merged into global settings
- Only specified keys override
- Other global settings are preserved
- Example: Project sets only `defaultModel`, keeping all other `model.*` from global

### ~/.pi/agent/models.json (Custom Models)

```json
{
  "models": [
    {
      "provider": "ollama",
      "id": "llama3.1:latest",
      "displayName": "Llama 3.1 Local",
      "baseUrl": "http://localhost:11434",
      "params": {
        "temperature": 0.7
      }
    },
    {
      "provider": "ollama-remote",
      "id": "mistral:7b",
      "displayName": "Mistral 7B Remote",
      "baseUrl": "https://ollama.example.com:11434"
    },
    {
      "provider": "vllm",
      "id": "qwen2.5:7b",
      "displayName": "Qwen 2.5",
      "baseUrl": "http://localhost:8000"
    }
  ]
}
```

### .env.sample (API Keys Template)

⚠️ **Important:** Pi does NOT auto-load `.env` files!

```bash
source .env && pi
```

Or add to shell config:
```bash
alias pi='source $(pwd)/.env && pi'
```

```bash
# Pi Agent — Provider API Keys Sample
# Copy to .env and fill in your keys

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GEMINI_API_KEY=AIza...

# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# Firecrawl (for pi-pi experts)
FIRECRAWL_API_KEY=fc-...
```

---

## Environment Variables

All providers use environment variables for API keys:

| Provider | Variable | Example Key |
|----------|----------|-------------|
| OpenAI | `OPENAI_API_KEY` | `sk-ant-...` |
| Anthropic | `ANTHROPIC_API_KEY` | `sk-ant-...` |
| Google | `GEMINI_API_KEY` | `AIza...` |
| OpenRouter | `OPENROUTER_API_KEY` | `sk-or-...` |
| Groq | `GROQ_API_KEY` | `ggroqk_...` |
| Mistral | `MISTRAL_API_KEY` | `...` |
| Firecrawl | `FIRECRAWL_API_KEY` | `fc-...` |

### Security Rules

From `.pi/damage-control-rules.yaml`:
- ❌ **Zero Access**: `.env`, `~/.ssh/`, `*.pem`
- ⚠️ **Read-Only**: System files, lockfiles
- ✅ **No-Delete**: Git, Dockerfile, README

Tilde expansion must be manual:
```typescript
process.env.HOME || os.homedir()
```

---

## Settings Override Behavior

### Merging Strategy

**Project → Global** (deep merge):

```json
// Global settings
{
  "model": {
    "defaultProvider": "anthropic",
    "defaultModel": "claude-3.5-sonnet"
  },
  "theme": "synthwave",
  "extensions": "auto"
}

// Project settings (override)
{
  "model": {
    "defaultModel": "openai/gpt-4o"
  },
  "theme": "tokyo-night"
}

// Final merged result
{
  "model": {
    "defaultProvider": "anthropic",       // ← from global
    "defaultModel": "openai/gpt-4o",     // ← from project
    "defaultThinkingLevel": "high",       // ← from global (not overridden)
    "hideThinkingBlock": false,           // ← from global (not overridden)
    "thinkingBudgets": 8192               // ← from global (not overridden)
  },
  "theme": "tokyo-night",                 // ← from project (overrides)
  "extensions": "auto"                    // ← from global (not overridden)
}
```

### Available Settings Categories

1. **Model & Thinking**:
   - `defaultProvider`
   - `defaultModel`
   - `defaultThinkingLevel`
   - `hideThinkingBlock`
   - `thinkingBudgets`

2. **UI & Display**:
   - `theme`
   - `quietStartup`
   - `collapseChangelog`
   - `doubleEscapeAction`
   - `editorPaddingX`
   - `autocompleteMaxVisible`
   - `showHardwareCursor`

3. **Compaction**:
   - `compaction.enabled`
   - `compaction.reserveTokens`
   - `compaction.keepRecentTokens`

4. **Retry**:
   - `retry.enabled`
   - `retry.maxRetries`
   - `retry.baseDelayMs`
   - `retry.maxDelayMs`

5. **Message Delivery**:
   - `steeringMode`
   - `followUpMode`
   - `transport` (sse/websocket/auto)

6. **Terminal & Images**:
   - `terminal.showImages`
   - `terminal.clearOnShrink`
   - `images.autoResize`
   - `images.blockImages`

7. **Shell**:
   - `shellPath`
   - `shellCommandPrefix`

---

## Model Cycling

Enabled models support keyboard cycling with `Ctrl+P`:

```json
{
  "enabledModels": [
    "gpt-4o",
    "claude-3.5-sonnet",
    "gemini-2.0-flash",
    "groq/llama3.3",
    "openrouter/*.latest"  // Wildcard patterns
  ]
}
```

**Pattern Syntax**:
- `*` - Any model
- `**` - Any provider/model combination
- `provider/*` - All models from provider
- `provider/model-pattern` - Specific patterns

---

## Security & Access Control

The `damage-control` extension enforces safety rules via `.pi/damage-control-rules.yaml`:

### Dangerous Commands (Blocked)
- `rm -rf *`
- `git reset --hard`
- `aws s3 rm --recursive`
- `DROP DATABASE`

### Zero Access Paths (Blocked)
- `.env` files
- `~/.ssh/`
- `*.pem`
- `~/.gitconfig`

### Read-Only Paths
- `/etc/*`
- System files

### Tilde Expansion
Manual expansion required:
```typescript
const home = process.env.HOME || os.homedir()
```

---

## Quick Reference

### Common Commands

```bash
# List all models
pi --models

# List model details
pi --list-models

# Select specific model
pi --model provider/model-id

# Interactive settings
/settings

# View current model
echo "Using: ${ctx.model.provider}/${ctx.model.id}"
```

### Debug Mode

```bash
pi --verbose --model list
```

### Verify Setup

```bash
# Check models are available
pi --list-models

# Check extensions load
pi --extensions

# Check settings
cat ~/.pi/agent/settings.json
cat .pi/settings.json
```

### Migration from Previous Versions

When migrating Pi projects:

1. **Copy global settings**: `cp ~/.pi/agent/settings.json ~/.pi/agent/settings.json.backup`
2. **Override in project**: Edit `.pi/settings.json` for project-specific settings
3. **Preserve custom models**: Copy `~/.pi/agent/models.json` if needed
4. **Transfer API keys**: Source `.env` before launching

---

## See Also

- [Pi Providers docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/providers.md)
- [Pi Models docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/models.md)
- [Pi Settings docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/settings.md)
- [Pi Extensions docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/extensions.md)
- [Pi Keybindings docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/keybindings.md)

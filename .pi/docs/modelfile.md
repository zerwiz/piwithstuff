# models.json Documentation

## Overview

`models.json` is the **model registry** for the PI AI architecture. It defines which AI models are available from each provider, their capabilities, and runtime configurations.

---

## File Location

```
/home/zerwiz/.pi/agent/models.json
```

---

## File Structure

```json
{
  "providers": {
    "<provider-name>": {
      "api": "openai-completions|gemini-chat|gemini-web",
      "apiKey": "<api-key-or-credential>",
      "baseUrl": "https://<endpoint>/v1",
      "models": [
        {
          "_launch": true,           // Whether PI should launch this model
          "_system": false,         // Whether this is an AI system model
          "api": "openai-completions|gemini-chat|gemini-web",
          "id": "<model-id>",       // Provider-specific model ID
          "name": "<display-name>", // Human-readable name
          "contextWindow": 128000,  // Context size in tokens
          "reasoning": false,       // Whether model supports thinking
          "vision": false,          // Whether model supports images
          "toolUse": false,         // Whether model can use tools
          "imageGen": false,        // Whether model can generate images
          "native": false,          // Whether model is built-in to PI
          "maxTokens": 4096,        // Maximum output tokens
          "cost": 0.002,            // Cost per 1M tokens (optional)
          "compat": false          // Additional compatibility flags
        }
      ],
      "defaultModelConfig": {
        "contextWindow": 128000,
        "maxTokens": 4096
      }
    }
  }
}
```

---

## Example: models.json

```json
{
  "providers": {
    "ollama-local": {
      "api": "openai-completions",
      "baseUrl": "http://localhost:11434",
      "models": [
        {
          "_launch": true,
          "_system": false,
          "id": "qwen3.5:9b-32k",
          "name": "Qwen 3.5 9B (32k context)",
          "contextWindow": 32768,
          "maxTokens": 8192,
          "native": true
        },
        {
          "_launch": true,
          "_system": false,
          "id": "qwen3.5:14b",
          "name": "Qwen 3.5 14B",
          "contextWindow": 32768,
          "maxTokens": 4096,
          "native": true
        },
        {
          "_launch": true,
          "_system": false,
          "id": "codellama:419b",
          "name": "CodeLLaMA 47B",
          "contextWindow": 2048,
          "maxTokens": 4096,
          "native": true
        },
        {
          "_launch": true,
          "_system": false,
          "id": "qwen:7b",
          "name": "Qwen 7B",
          "contextWindow": 2048,
          "maxTokens": 4096,
          "native": true
        }
      ],
      "defaultModelConfig": {
        "contextWindow": 32768
      }
    },
    "anthropic": {
      "api": "gemini-web",
      "baseUrl": "https://api.anthropic.com",
      "models": [
        {
          "_launch": true,
          "_system": true,
          "id": "claude-opus-4-6",
          "name": "Claude Opus 4.6",
          "contextWindow": 200000,
          "reasoning": true,
          "toolUse": true,
          "native": true
        },
        {
          "_launch": true,
          "_system": true,
          "id": "claude-3-7-sonnet-20250219",
          "name": "Claude 3.7 Sonnet",
          "contextWindow": 200000,
          "toolUse": true,
          "native": true
        }
      ]
    }
  }
}
```

---

## Provider Types in models.json

### 1. **Provider Name** → Used as key
- **`ollama-local`** → Local Ollama instance
- **`ollama-remote`** → Remote Ollama server
- **`openai`** → OpenAI API
- **`anthropic`** → Anthropic API
- **`google-gemini-cli`** → Google Vertex
- **`google-antigravity`** → Google Anthropic
- **`openrouter`** → OpenRouter aggregator
- **`groq`** → Groq API
- **AWS bedrock, etc.**

### 2. **API Type** → Determines how the model is accessed
- **`openai-completions`** → Uses OpenAI Completions endpoint
- **`gemini-chat`** → Uses Google Chat models (Vertex/Antigravity)
- **`gemini-web`** → Uses Google Vertex for Gemini models

---

## Key Model Properties

- **`_launch`** (`boolean`)
  - `true` → PI will attempt to load/launch this model
  - `false` → Marked but not auto-loaded

- **`_system`** (`boolean`)
  - `true` → Model designated as the system/AI assistant
  - `false` → General-purpose model

- **`id`** (`string`)
  - Required → Provider-specific model identifier
  - Examples: `qwen3.5:9b-32k`, `claude-opus-4-6`, `gpt-4o`

- **`name`** (`string`)
  - Optional → Human-readable display name
  - Falls back to `id` if not provided
  - Useful for UI display in web access page

- **`contextWindow`** (`number`)
  - Required → Maximum input tokens
  - Used for budget calculations

- **`maxTokens`** (`number`)
  - Optional → Maximum output tokens
  - Falls back to provider defaults

- **`reasoning`** (`boolean`)
  - Optional → Whether model supports deep thinking
  - Used for thinking level configuration

- **`cost`** (`number`)
  - Optional → Cost per 1M input tokens
  - Used by billing systems if enabled

---

## How models.json is Used

### 1. **Model Selection Resolution**

When you set in `settings.json`:
```json
"defaultModel": "qwen3.5:9b-32k"
```

The system:
1. Reads `settings.json` → gets `defaultModel`
2. Reads provider from `settings.json` → gets `defaultProvider`
3. Looks up provider in `models.json`
4. Finds matching model ID in that provider's model list
5. Returns the model for use in AI requests

### 2. **Provider Auto-Discovery**

- Built-in models come pre-configured in `models.json`
- Custom providers can be added to `models.json`
- Overrides work by matching provider name or model ID pattern

### 3. **Default Model Lookup**

The code in `core/model-resolver.js`:

```js
export const defaultModelPerProvider = {
    "ollama-local": "qwen3.5:9b-32k",
    "ollama-remote": "qwen3.5:9b",
    "openai": "gpt-5.4",
    // ...
};
```

This table maps provider names to default model IDs:

```js
function getDefaultModelForProvider(provider) {
  const defaultId = defaultModelPerProvider[provider];
  if (!defaultId) return undefined;
  
  const model = modelRegistry.find(provider, defaultId);
  if (!model) {
    console.warn(`Default model ${defaultId} not found in models.json for ${provider}`);
    return modelRegistry.list().find(m => m._system) || modelRegistry.list()[0];
  }
  return model;
}
```

---

## Adding Custom Models

To add a new model:

```json
{
  "providers": {
    "my-custom-provider": {
      "api": "openai-completions",
      "baseUrl": "https://api.my-custom-provider.com",
      "apiKey": "{{CUSTOM_API_KEY}}",
      "models": [
        {
          "_launch": true,
          "id": "my-model-v1",
          "name": "My Custom Model v1",
          "contextWindow": 128000,
          "maxTokens": 4096
        }
      ]
    }
  }
}
```

---

## Migration from Legacy models.json

PI used to store models in `/home/zerwiz/.pi/config.json`:

```json
{
  "models": {
    "api_key": "...",
    "ollama": {
      "models": ["qwen3.5:9b-32k", "codellama:419b"]
    }
  }
}
```

This has been **deprecated**. New format separates:
- **`config.json`** → API keys, OAuth credentials
- **`models.json`** → Model registry and metadata
- **`settings.json`** → Runtime configuration

---

## Validation & Loading

When PI starts:

1. Load `models.json` from `.pi/agent/`
2. Validate provider names match `defaultModelPerProvider` table
3. Load custom provider overrides if specified
4. Merge built-in models with custom ones
5. Apply provider-specific configs (baseUrl, headers)
6. Return combined registry to all systems

---

## Troubleshooting

### Model Not Found Error

```
Error: Model 'qwen3.5:9b-32k' not available
```

**Solution**: Ensure:
- Model ID exists in `models.json` for provider
- Model has `_launch: true`
- Provider API is reachable (if remote)

### Provider Not Recognized

```
Error: Unknown provider 'my-provider'
```

**Solution**: Add provider to `providers:` section of `models.json`

---

## Best Practices

1. **Use `name` for UI display** → Keep it meaningful
2. **Set `_launch: false` for testing** → Prevent auto-loading unwanted models
3. **Mark system models with `_system: true`** → Helps with fallback logic
4. **Document custom providers** → Add comments explaining the provider
5. **Keep `contextWindow` accurate** → Helps with budget calculations

---

## See Also

- [`settings.json`](settings.json.md) → Model selection, thinking levels, extensions
- [`config.json`](config.json.md) → API keys and OAuth credentials
- [`extensions/`](../extensions/) → Additional agent tooling

---

*Last updated: 2025*

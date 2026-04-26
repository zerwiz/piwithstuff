# 🛠️ Configuration Guide

Complete guide to configuring Multi-Host Ollama, including environment variables, configuration files, and model assignment strategies.

---

## 📋 Table of Contents

- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Model Assignment](#model-assignment)
- [Host Configuration](#host-configuration)
- [Routing Rules](#routing-rules)
- [Active Model Selection](#active-model-selection)
- [Best Practices](#best-practices)

---

## 🌍 Environment Variables

### Core Variables

```bash
# Host Configuration
OLLAMA_PORT=11434                    # Default Ollama API port
OLLAMA_HOSTS="localhost:11434,remote-host:11434"  # Comma-separated host list
OLLAMA_ACTIVE_HOST="localhost:11434"       # Default active host
OLLAMA_HOST_TIMEOUT=30000              # Timeout for host operations (ms)
OLLAMA_CONNECTION_RETRY=3              # Retry attempts on connection failure

# Model Configuration
OLLAMA_MODEL_CACHE=512                # Models to cache per host (0 = all)
OLLAMA_MAX_ACTIVE_MODELS=2            # Maximum concurrent active models
OLLAMA_MODEL_SIZE="medium"             # small | medium | large

# Routing Configuration
OLLAMA_ROUTE_BY_MODEL=true            # Route requests by model name
OLLAMA_ROUTE_BY_PRIORITY=true         # Route based on request priority
OLLAMA_PRIORITY_CODES:"high:priority,medium:round-robin,low:random"

# Discovery Configuration
OLLAMA_ENABLE_DISCOVERY=true          # Enable automatic host discovery
OLLAMA_DISCOVERY_INTERVAL=60000       # Discovery interval (ms)
OLLAMA_DISCOVERY_RETRY=60             # Retries in discovery attempts

# Agent Configuration
OLLAMA_AGENT_COUNT=2                  # Number of parallel agents
OLLAMA_AGENT_MODEL_SIZE="medium"      # Model size per agent
OLLAMA_AGENT_REUSE=true               # Reuse active models between runs

# Performance
OLLAMA_CONCURRENT_REQUESTS=5          # Max concurrent requests
OLLAMA_STREAM_CHUNK_SIZE=1024         # Stream chunk size
OLLAMA_MAX_RESPONSE_SIZE="100000"     # Maximum response size (chars)
```

### Configuration Examples

```bash
# Local development setup
OLLAMA_PORT=11434
OLLAMA_HOSTS="localhost:11434"
OLLAMA_ROUTE_BY_MODEL=false
OLLAMA_ROUTE_BY_PRIORITY=false
OLLAMA_AGENT_COUNT=1

# Production multi-host setup
OLLAMA_PORT=11434
OLLAMA_HOSTS="localhost:11434,code-server.example.com:11434,creative.example.com:11434"
OLLAMA_ROUTE_BY_MODEL=true
OLLAMA_PRIORITY_CODES="critical:host1,normal:round-robin,low:host2"
OLLAMA_AGENT_COUNT=4
OLLAMA_CONCURRENT_REQUESTS=10

# High-performance cluster
OLLAMA_HOSTS="host1:11434,host2:11434,host3:11434,host4:11434,host5:11434,host6:11434"
OLLAMA_MAX_ACTIVE_MODELS=3
OLLAMA_CONCURRENT_REQUESTS=20
OLLAMA_ENABLE_DISCOVERY=true
OLLAMA_DISCOVERY_INTERVAL=30000
```

---

## 📄 Configuration Files

### Environment Files (.env)

```bash
# .env - Basic multi-host configuration
OLLAMA_PORT=11434
OLLAMA_HOSTS=localhost:11434,remote-host-1:11434,remote-host-2:11434
OLLAMA_ACTIVE_HOST=http://localhost:11434

# Model assignments
OLLAMA_MODEL_P0_HOST=localhost:11434
OLLAMA_MODEL_P1_HOST=remote-host-1:11434
OLLAMA_MODEL_P2_HOST=remote-host-2:11434

# Active model selection
OLLAMA_SWITCH_MODE=round-robin
OLLAMA_ACTIVE_MODEL=llama3.1:8b

# Routing rules
OLLAMA_ROUTE_BY_MODEL=true
OLLAMA_PRIORITY_CODES="critical:host0,normal:round-robin,low:host1"

# Discovery settings
OLLAMA_ENABLE_DISCOVERY=true
OLLAMA_DISCOVERY_INTERVAL=60000
OLLAMA_CONNECTION_RETRY=3
```

### Configuration YAML (config.yaml)

```yaml
# config.yaml - Full configuration
ollama:
  version: "0.1.2"
  
  # Host definitions
  hosts:
    - name: local
      host: "localhost"
      port: 11434
      weight: 1.0
      timeout: 30000
      models:
        - name: "general"
          path: "/models/ollama1"
          weight: 1.0
        - name: "code"
          path: "/models/coder"
          weight: 0.8
    
    - name: remote-code
      host: "remote-code.example.com"
      port: 11434
      weight: 0.8
      models:
        - name: "coder"
          path: "/models/coder1"
          weight: 0.9
        - name: "coder-lite"
          path: "/models/coder-lite"
          weight: 0.7
    
    - name: remote-creative
      host: "remote-creative.example.com"
      port: 11434
      weight: 0.5
      models:
        - name: "creative"
          path: "/models/creative1"
          weight: 0.9

  # Routing configuration
  routing:
    mode: "smart"  # round-robin | smart | priority | weight-based
    priority_order:
      code: 1
      creative: 2
      general: 3
    timeout: 30000
    retry: 3

  # Agent configuration
  agents:
    - name: agent-1
      host: "local"
      model: "general"
      concurrent: true
    
    - name: agent-2
      host: "remote-code"
      model: "coder"
      concurrent: true

  # Model configuration
  model:
    cache: 512
    concurrent: 2
    max_response: 100000
    
  # Discovery
  discovery:
    enabled: true
    interval: 60000
    retry: 60

  # Performance
  performance:
    stream_chunk: 1024
    max_concurrent: 5
```

### JSON Configuration

```json
{
  "ollama": {
    "version": "0.1.2",
    "hosts": [
      {
        "name": "local",
        "host": "localhost",
        "port": 11434,
        "weight": 1.0,
        "timeout": 30000,
        "models": [
          {"name": "general", "path": "/models/ollama1", "weight": 1.0},
          {"name": "code", "path": "/models/coder", "weight": 0.8}
        ]
      },
      {
        "name": "remote-code",
        "host": "remote-code.example.com",
        "port": 11434,
        "weight": 0.8,
        "models": [
          {"name": "coder", "path": "/models/coder1", "weight": 0.9},
          {"name": "coder-lite", "path": "/models/coder-lite", "weight": 0.7}
        ]
      }
    ],
    "routing": {
      "mode": "smart",
      "priority_order": {"code": 1, "creative": 2, "general": 3},
      "timeout": 30000,
      "retry": 3
    },
    "agents": [
      {"name": "agent-1", "host": "local", "model": "general", "concurrent": true},
      {"name": "agent-2", "host": "remote-code", "model": "coder", "concurrent": true}
    ],
    "discovery": {
      "enabled": true,
      "interval": 60000,
      "retry": 60
    }
  }
}
```

---

## 📦 Model Assignment

### Per-Host Model Assignment Rules

Each host should have one primary model to avoid conflicts and ensure optimal performance.

```bash
# Basic: One model per host
localhost:11434       -> llama3.1:8b
remote-code:11434     -> codellama:7b
remote-creative:11434 -> llama2:13b

# Advanced: Multiple models with weights
localhost:11434       -> primary:llama3.1:8b, secondary:phi3.5:mini
remote-code:11434     -> primary:codellama:7b, secondary:codellama:13b
```

### Assignment Strategy

```bash
# Assign models to hosts strategically
ollama-link models assign \
  --model "llama3.1:8b" --host "localhost:11434" --weight 1.0

ollama-link models assign \
  --model "codellama:7b" --host "remote-code:11434" --weight 0.9

ollama-link models assign \
  --model "llama2:13b" --host "remote-creative:11434" --weight 0.8

# Verify assignment
ollama-link models list --all-hosts

# Expected output:
# localhost:11434  llama3.1:8b (100%), phi3.5:mini (20%)
# remote-code:11434 codellama:7b (90%), codellama:13b (20%)
# remote-creative:11434 llama2:13b (80%), llama3.1:13b (20%)
```

### Model Specialization Strategy

```bash
# Create specialized hosts
# Code-heavy models on specific hosts
ollama-link models assign \
  --host "code-host" \
  --model "codellama:7b" \
  --model "codellama:13b" \
  --model "starcoder"

# Creative models on other hosts
ollama-link models assign \
  --host "creative-host" \
  --model "llama2:13b" \
  --model "mistral:7b" \
  --model "tinyllama:1.1b"

# General purpose on main host
ollama-link models assign \
  --host "localhost:11434" \
  --model "llama3.1:8b" \
  --model "phi3.5:mini"
```

---

## 🔗 Host Configuration

### Host Definitions Structure

```yaml
hosts:
  - name: local
    host: "localhost"
    port: 11434
    weight: 1.0
    models:
      - "llama3.1:8b"
      - "phi3.5:mini"

  - name: remote-1
    host: "remote-host.example.com"
    port: 11434
    weight: 0.8
    models:
      - "codellama:7b"
      - "codellama:13b"

  - name: remote-2
    host: "remote-2.example.com"
    port: 11434
    weight: 0.5
    models:
      - "llama2:13b"
      - "mistral:7b"
```

### Host Configuration Options

| Option | Valid Values | Description |
|--------|--------------|-------------|
| **name** | string | Identifiable name for the host |
| **host** | string | Hostname or IP address |
| **port** | number | API port (default: 11434) |
| **weight** | 0-1.0 | Load balancing weight |
| **timeout** | number | Request timeout (ms) |
| **models** | array | List of model names |
| **enabled** | boolean | Enable/disable host |
| **tags** | array | Host tags for routing |

### Host Status Commands

```bash
# List all hosts
ollama-link hosts list

# Expected output:
# Name        | Host                       | Port | Status | Models           | Weight
# -----------|-------------------------------|------|--------|------------------|--------
# local      | 127.0.0.1                 | 11434| UP     | llama3.1,phi3.5  | 1.0
# remote-1   | remote-host.example.com    | 11434| UP     | codellama:7b     | 0.8
# remote-2   | remote-2.example.com      | 11434| UP     | llama2:13b       | 0.5

# Get host details
ollama-link hosts get <name>

# Check host health
ollama-link hosts check <name>

# Restart host
ollama-link hosts restart <name>

# Remove host
ollama-link hosts remove <name>
```

---

## 📍 Routing Rules

### Routing Modes

```bash
# Round-robin: Distribute evenly
ollama-link route set --mode round-robin

# Smart: Based on model availability
ollama-link route set --mode smart

# Priority: Based on request priority
ollama-link route set --mode priority

# Weight-based: Based on host weight
ollama-link route set --mode weight
```

### Routing Rules Configuration

```bash
# Add routing rule
ollama-link route add \
  --model "codellama:7b" \
  --host "remote-code:11434" \
  --priority high

# Remove routing rule
ollama-link route remove \
  --model "codellama:7b" \
  --host "remote-code:11434"

# View routing table
ollama-link route show

# Expected output:
# Model             | Primary Host           | Weight | Priority
# ----------------|----------------------|--------|-------------
# codellama:7b    | remote-code:11434     | 0.9    | high
# codellama:13b   | remote-code:11434     | 0.7    | medium
# llama3.1:8b     | localhost:11434       | 1.0    | normal
# llama2:13b      | remote-creative:11434 | 0.8    | normal
```

### Priority-Based Routing

```bash
# Configure priority routes
OLLAMA_PRIORITY_RULES="code:high,creative:normal,general:low"

ollama-link route priority \
  --rule "code:host1,creative:host2" \
  --model "codellama" \
  --assign \
  --host "localhost:11434" \
  --host "localhost:11434"

# Use priority routing
ollama-link chat \
  --priority high \
  --prompt "Code analysis task" \
  # Will route to primary high-priority host
ollama-link chat \
  --priority low \
  --prompt "General inquiry" \
  # Will route to any available host
```

---

## 🔄 Active Model Selection

### Models per Host Rules

Each host should have one primary model to avoid conflicts.

```bash
# Rule: 1 primary model per host
# Reason: Prevents model conflicts and ensures optimal performance
# Each host manages its own model pool independently
```

### Selection Methods

#### Method 1: Direct Switch

```bash
ollama-link switch \
  --host "localhost:11434" \
  --model "llama3.1:8b"

ollama-link switch \
  --host "remote-code:11434" \
  --model "codellama:7b"

ollama-link switch \
  --host "remote-creative:11434" \
  --model "llama2:13b"

# Verify active model
ollama-link select --host "localhost:11434"

# Output format:
# Host: localhost:11434
# Active Model: llama3.1:8b
# Status: READY
```

#### Method 2: Round-Robin

```bash
# Rotate through all hosts
ollama-link rotate --hosts=all

# Rotate through specific hosts
ollama-link rotate --hosts="host1:11434,host2:11434"

# Output:
# Selected host: host2:11434
# Model available: codellama:7b
```

#### Method 3: Priority-Based

```bash
# Priority rule: code->host1, creative->host2
ollama-link priority \
  --rule "code:host1,creative:host2" \
  --apply

# Request with priority
ollama-link chat \
  --priority high \
  --prompt "Explain async/await:"
# Routes to host1 based on priority mapping
```

#### Method 4: Weight-Based

```bash
ollama-link weight \
  --weights "host1:0.8,host2:0.5,host3:0.3" \
  --apply

# Request will weight to host1 (80% of requests)
ollama-link chat \
  --prompt "General task:"
```

### Model Availability Check

```bash
ollama-link models check \
  --host "localhost:11434" \
  --model "llama3.1:8b"

ollama-link models check \
  --all-hosts \
  --model "codellama:7b"

# Output:
# Host        | Model         | Status | Size
# -----------|--------------|--------|--------
# localhost   | llama3.1:8b  | READY  | 4.7GB
# remote-1    | codellama:7b | READY  | 3.3GB
# remote-2    | codellama:7b | MISSING| -
```

---

## 🎯 Best Practices

### Model Assignment Strategy

```bash
# 1. Assign ONE primary model per host
OLLAMA_MODEL_ASSIGNMENT="1-primary-per-host"

# 2. Use secondary models for flexibility
OLLAMA_SECONDARY_MODELS="2-secondary"

# 3. Keep model sizes appropriate to host capacity
OLLAMA_MODEL_SIZES="small:<=4GB,medium:4-8GB,large:>=8GB"
```

### Host Resource Management

```bash
# Monitor host resources
ollama-link monitor --host <name>

# Scale out when needed
ollama-link hosts add \
  --host "new-host:11434" \
  --weight 0.6

# Scale in when idle
ollama-link hosts remove <name>

# Automatic scaling
OLLAMA_AUTO_SCALE=true
OLLAMA_MIN_HOSTS=2  # Minimum hosts
OLLAMA_MAX_HOSTS=8  # Maximum hosts
OLLAMA_SCALE_THRESHOLD=80  # CPU/Memory threshold (%)
```

### Routing Optimization

```bash
# Optimize routing rules
ollama-link route optimize \
  --criteria "latency:low,load:balanced"

# Cache frequently used models
OLLAMA_MODEL_CACHE=true
ollama-link models cache \
  --models "llama3.1,phi3.5,codellama"
```

---

## 📚 Examples

### Example: Production Configuration

```bash
# .env.production
OLLAMA_PORT=11434
OLLAMA_HOSTS="localhost:11434,code.prod.example.com:11434,creative.prod.example.com:11434"
OLLAMA_ROUTE_BY_MODEL=true
OLLAMA_PRIORITY_CODES="critical:host1,high:host2,medium:round-robin,low:host3"
OLLAMA_ACTIVE_HOST="localhost:11434"
OLLAMA_AGENT_COUNT=4
OLLAMA_CONCURRENT_REQUESTS=10
OLLAMA_MODEL_CACHE=true
OLLAMA_DISCOVERY_INTERVAL=30000
```

### Example: Development with Multiple Hosts

```bash
# Local setup with multiple local Ollama instances
OLLAMA_HOSTS="localhost:11434,localhost:11435,localhost:11436"
OLLAMA_ROUTE_BY_MODEL=false
OLLAMA_ACTIVE_HOST="localhost:11434"
OLLAMA_AGENT_COUNT=2
OLLAMA_MODEL_SIZE="medium"
```

### Example: Minimal Production

```bash
OLLAMA_HOSTS="localhost:11434"
OLLAMA_ROUTE_BY_MODEL=true
OLLAMA_PRIORITY_CODES="high:host1,normal:round-robin,low:host2"
OLLAMA_ACTIVE_HOST="localhost:11434"
OLLAMA_AGENT_COUNT=2
OLLAMA_CONCURRENT_REQUESTS=5
```

---

## 🔗 Related Documentation

- [📖 Multi-Host Guide](README_MULTIHOST.md) - Architecture details
- [🚀 Deployment Guide](DEPLOY.md) - Production deployment
- [📝 Usage Examples](examples/README.md) - Code examples

## 📞 Support

- **Issues:** [Open an issue](https://github.com/zerwiz/piwithstuff/issues)
- **Discussions:** [GitHub Discussions](https://github.com/zerwiz/piwithstuff/discussions)
- **Docs:** [Ollama Documentation](https://docs.ollama.ai)

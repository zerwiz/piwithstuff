# 🏗️ Multi-Host Guide

Complete guide to using Multi-Host Ollama, including host architecture, deployment strategies, and advanced usage patterns.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Host Types](#host-types)
- [Deployment Scenarios](#deployment-scenarios)
- [Model Pools](#model-pools)
- [Active Host Management](#active-host-management)
- [Load Balancing](#load-balancing)
- [Failover Strategies](#failover-strategies)
- [Performance Optimization](#performance-optimization)
- [Security](#security)

---

## 🏛️ Architecture Overview

### Multi-Host Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Multi-Host Ollama System                          │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  Agent A    │  │  Agent B    │  │  Agent C    │  │  Agent D     │  │
│  │ (Code)      │  │ (Code/Gen)  │  │ (Creative)  │  │ (Creative)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  │
│         │                │                │                │            │
│         └────────────────┼────────────────┘                │            │
│                          │                                 │            │
│                          ▼                                 ▼            │
│              ┌─────────────────────────────────────────────────┐        │
│              │           Ollama-Link Orchestrator              │        │
│              │     - Routing decisions                        │        │
│              │     - Active model management                   │        │
│              │     - Host health monitoring                    │        │
│              └───────┬───────┬───────┬────────┬─────────┬───┘        │
│                      │       │       │        │          │           │
│                      ▼       ▼       ▼        ▼          ▼           │
│         ┌──────────────────────────┬───────────────┬─────────────┐  │
│         │          Host Pool A     │      Host      │   Host      │  │
│         │  - localhost:11434       │  Pool B        │  Pool C     │  │
│         │  - Model: llama3.1:8b    │                │             │  │
│         │  - Weight: 1.0            │   ┌────────┐   │ ┌──────────┐│  │
│         │  - Status: UP             │   │         │   │           ││  │
│         │  - Load: 65%              │   │ Remote  │   │  Remote   ││  │
│         └──────────────────────────┘   │  Host    │   │   Host    ││  │
│                                        │  Pool C   │   │   Pool    ││  │
│                                        │          │   │    D       ││  │
│                                        └──────────┴   └────────────┴│  │
│                                                                  │     │
│  ┌───────────────────────────────────────────────────────────┐     │
│  │                      Model Pool Management                  │    │
│  │    - Each host manages own model pool                       │    │
│  │    - Model conflicts prevented (1 primary per host)         │    │
│  │    - Resource isolation between pools                        │    │
│  └───────────────────────────────────────────────────────────┘     │
│                                                                      │
└───────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Role | Location |
|-----------|------|----------|
| **Agent** | Submit requests | User application |
| **Ollama-Link** | Route requests | Central orchestrator |
| **Host Pool A** | General models | localhost:11434 |
| **Host Pool B** | Code models | remote-code:11434 |
| **Host Pool C** | Creative models | remote-creative:11434 |

---

## 🖥️ Host Types

### 1. General Purpose Host

Suitable for broad model requests without specific specialization.

```bash
# General purpose configuration
ollama-link hosts define \
  --name "general" \
  --host "localhost:11434" \
  --models "llama3.1:8b,phi3.5:mini" \
  --weight 1.0 \
  --tags "general,multi-purpose"

# Use for: Conversational AI, general tasks, simple queries
# Best for: Broad capability, fast response
# Limitations: Less specialized than dedicated hosts
```

### 2. Code Specialized Host

Optimized for coding tasks with specialized models.

```bash
# Code specialized configuration
ollama-link hosts define \
  --name "code-specialized" \
  --host "code-host:11434" \
  --models "codellama:7b,codellama:13b,starcoder" \
  --weight 0.9 \
  --tags "code,programming,coding"

# Use for: Code generation, debugging, refactoring
# Best for: Programming tasks, documentation generation
# Limitations: Less suited for creative writing
```

### 3. Creative Specialized Host

Optimized for creative tasks with specific models.

```bash
# Creative specialized configuration
ollama-link hosts define \
  --name "creative" \
  --host "creative-host:11434" \
  --models "llama2:13b,mistral:7b,tinyllama:1.1b" \
  --weight 0.8 \
  --tags "creative,creative"

# Use for: Story generation, poetry, creative writing
# Best for: Creative tasks, artistic generation
# Limitations: Less optimal for code tasks
```

### 4. High-Performance Host

Optimized with larger models for complex tasks.

```bash
# High-performance configuration
ollama-link hosts define \
  --name "high-performance" \
  --host "high-perf-host:11434" \
  --models "llama3.1:70b,hermes:3.0" \
  --weight 0.7 \
  --tags "high-performance,large-model"

# Use for: Complex reasoning, large context tasks
# Best for: Complex queries, long context windows
# Limitations: High VRAM requirement, slower response
```

---

## 🚀 Deployment Scenarios

### Scenario 1: Single Machine Multi-Host

Multiple Ollama instances on one machine using different ports.

```bash
# Setup on single machine
# Terminal 1
ollama serve -p 11434
ollama pull llama3.1:8b

# Terminal 2
ollama serve -p 11435
ollama pull codellama:7b

# Terminal 3
ollama serve -p 11436
ollama pull llama2:13b

# Configure multi-host link
OLLAMA_HOSTS="localhost:11434,localhost:11435,localhost:11436"
OLLAMA_ROUTE_BY_MODEL=true
OLLAMA_ACTIVE_HOST="localhost:11434"
```

### Scenario 2: Multi-Machine Cluster

Multiple hosts across multiple machines.

```bash
# Machine 1 (General)
ollama serve -p 11434
ollama pull llama3.1:8b,phi3.5:mini

# Machine 2 (Code)
ollama serve -p 11434
ollama pull codellama:7b,codellama:13b

# Machine 3 (Creative)
ollama serve -p 11434
ollama pull llama2:13b,mistral:7b

# Configure link
OLLAMA_HOSTS="localhost:11434,code.example.com:11434,creative.example.com:11434"
OLLAMA_ROUTE_BY_MODEL=true
OLLAMA_PRIORITY_CODES="code:host2,creative:host3,general:host1"
```

### Scenario 3: Containerized Deployment

Docker/Kubernetes deployment of multiple hosts.

```bash
# docker-compose.yml
version: "3.8"

services:
  ollama-general:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
      - ./models/llama3.1:/models
    command: ollama serve
    deploy:
      resources:
        limits:
          memory: 12G

  ollama-code:
    image: ollama/ollama:latest
    ports:
      - "11435:11434"
    volumes:
      - ollama-data:/root/.ollama
      - ./models/codellama:/models
    command: ollama serve
    deploy:
      resources:
        limits:
          memory: 8G

  ollama-creative:
    image: ollama/ollama:latest
    ports:
      - "11436:11434"
    volumes:
      - ollama-data:/root/.ollama
      - ./models/llama2:/models
    command: ollama serve
    deploy:
      resources:
        limits:
          memory: 12G

volumes:
  ollama-data:
```

### Scenario 4: Production Deployment

Production-ready multi-host setup with monitoring and failover.

```bash
# Production configuration
ollama-link deploy production \
  --hosts="prod-host1:11434,prod-host2:11434,prod-host3:11434" \
  --monitoring=true \
  --failover=true \
  --load-balancing="smart" \
  --health-check=/api/version

# Expected output:
# Production cluster deployed to 3 hosts
# Health check enabled
# Failover configured
# Automatic load balancing enabled
```

---

## 📦 Model Pools

### Model Pool Management

Each host manages its own model pool, preventing conflicts.

```bash
# Host 1 model pool
Pool A:
  - General: llama3.1:8b
  - Secondary: phi3.5:mini

# Host 2 model pool
Pool B:
  - Code: codellama:7b
  - Secondary: codellama:13b

# Host 3 model pool
Pool C:
  - Creative: llama2:13b
  - Secondary: mistral:7b
```

### Pool Assignment Rules

```bash
# Rule 1: Maximum models per host
OLLAMA_MAX_MODELS_PER_HOST=2

# Rule 2: Model priority order (primary, secondary, tertiary)
OLLAMA_MODEL_PRIORITY="primary,secondary,tertiary"

# Rule 3: Automatic model assignment based on request type
ollama-link models assign \
  --model "llama3.1:8b" \
  --host "localhost:11434" \
  --priority primary

ollama-link models assign \
  --model "codellama:7b" \
  --host "code.example.com:11434" \
  --priority primary
```

### Pool Health Monitoring

```bash
ollama-link pool check --all-pools

# Expected output:
# Pool Name   | Status  | Host               | Models Used   | Memory Used
# --------   |--------|-------------------|--------------|---------------
# Pool A      | HEALTHY  | localhost:11434   | 2/3           | 8/12GB
# Pool B      | HEALTHY  | code.example.com   | 2/3           | 6/8GB
# Pool C      | HEALTHY  | creative.example.com | 2/3         | 10/12GB

# Get detailed pool info
ollama-link pool inspect <pool-name>
```

---

## 🎯 Active Host Management

### Active Model Selection

```bash
# Default: Round-robin across all active hosts
ollama-link rotate --hosts=all

# Switch to specific model on specific host
ollama-link switch \
  --host "localhost:11434" \
  --model "llama3.1:8b"

# Verify active model
ollama-link select --show-state

# Expected output:
# Active Model State:
# Host         | Active Model     | Status
# -----------|------------------|--------
# localhost   | llama3.1:8b      | READY
# code-host  | codellama:7b     | READY
# creative   | llama2:13b       | READY
```

### Active Host Selection Methods

#### Method 1: Round-Robin

```bash
ollama-link rotate \
  --hosts="localhost:11434,code-host:11434,creative-host:11434"

# Selects next host in rotation
```

#### Method 2: Host Priority

```bash
ollama-link priority \
  --rule "code:host1,creative:host2,general:host3" \
  --apply

# Routes based on priority rules:
# - Code requests -> host1
# - Creative requests -> host2
# - General requests -> host3
```

#### Method 3: Model-Based Routing

```bash
ollama-link route add \
  --model "codellama:7b" \
  --host "code-host:11434"

ollama-link route add \
  --model "llama2:13b" \
  --host "creative-host:11434"

# Requests route based on model name
```

#### Method 4: Weight-Based

```bash
ollama-link weight \
  --weights "host1:0.8,host2:0.5,host3:0.3" \
  --apply

# Routes based on weights:
# - host1 gets 80% of requests
# - host2 gets 50% of requests
# - host3 gets 30% of requests
```

---

## ⚖️ Load Balancing

### Load Balancing Strategies

```bash
# Strategy 1: Round-Robin (Even distribution)
ollama-link load-balance set \
  --strategy "round-robin"

# Strategy 2: Weight-Based (By capacity)
ollama-link load-balance set \
  --strategy "weight-based" \
  --weights "host1:1.0,host2:0.8,host3:0.6"

# Strategy 3: Smart (By load and latency)
ollama-link load-balance set \
  --strategy "smart" \
  --threshold 80  # Scale when >80% load
  --timeout 30000

# Strategy 4: Priority-Weighted
ollama-link load-balance set \
  --strategy "priority-weighted" \
  --priority "code:high,creative:normal,general:medium"
```

### Load Balance Monitoring

```bash
ollama-link monitor --load-balance

# Expected output:
# Load Balance Status:
# Host         | Load | Requests/s | P99 Latency | Status
# -----------|------|-----------|------------|--------
# host1       | 45%  | 25        | 250ms      | HEALTHY
# host2       | 72%  | 30        | 300ms      | WARNING
# host3       | 28%  | 15        | 180ms      | HEALTHY

# Scale out if needed
ollama-link hosts add \
  --host "new-host:11434" \
  --weight 0.5
```

---

## 🛡️ Failover Strategies

### Primary-Failover Configuration

```bash
# Configure primary host with failover targets
ollama-link failover configure \
  --primary "localhost:11434" \
  --backup "backup-host:11434" \
  --monitor true \
  --health-check=/api/version

# Failover triggers:
# - Host unreachable (3 retry attempts)
# - Health check fails
# - Memory/CPU >90% for 5 minutes
# - Active model unavailable
```

### Failover Testing

```bash
# Test failover
ollama-link failover test \
  --simulate "offline" \
  --host "localhost:11434"

# Expected behavior:
# 1. Primary host goes offline
# 2. Backup host selected automatically
# 3. Active model migrates if available
# 4. Service continues with reduced capacity

# Restore primary
ollama-link failover restore \
  --host "localhost:11434"
```

### Auto-Failover Configuration

```bash
ollama-link failover auto \
  --enabled true \
  --monitor-interval 30000 \
  --failover-timeout 10000 \
  --recovery-time 30000 \
  --max-fails-5
```

---

## 🚀 Performance Optimization

### Performance Tuning

```bash
# Optimize request routing
ollama-link optimize \
  --criteria "latency:low,load:balanced"

# Set concurrent request limits
ollama-link concurrency set \
  --max 10 \
  --stream-chunk 1024

# Enable caching for frequently-used models
ollama-link cache enable \
  --models "llama3.1,phi3.5,codellama"
  cache --timeout 86400

# Monitor performance
ollama-link metrics --all-hosts
```

### Bottleneck Diagnostics

```bash
ollama-link diagnose \
  --check-connections \
  --check-models \
  --check-resources \
  --check-network

# Expected output:
# Diagnostic Report:
# Connection Pool: HEALTHY (Avg: 45ms)
# Model Availability: 100% active
# Resource Usage: 65% average
# Network Latency: 15ms avg, 45ms p99
# Bottlenecks: None detected
```

---

## 🔒 Security

### Host Authentication

```bash
# Configure host authentication
ollama-link security configure \
  --auth-token "your-token" \
  --cors-enabled true \
  --allowed-origin "*"

# Use with header
curl -H "Authorization: Bearer token" \
  http://localhost:11434/api/generate
```

### Network Isolation

```bash
# Isolate hosts by network
ollama-link security isolate \
  --host "internal-host:11434" \
  --network "internal" \
  --allowed-from "0.0.0.0/16"

ollama-link security isolate \
  --host "public-host:11434" \
  --network "public" \
  --allowed-from "0.0.0.0/0"
```

---

## 📚 Examples

### Example: Full Multi-Host Setup

```bash
# Define all hosts
ollama-link hosts define \
  --name "general" \
  --host "localhost:11434" \
  --models "llama3.1:8b,phi3.5:mini" \
  --weight 1.0

ollama-link hosts define \
  --name "code" \
  --host "code.example.com:11434" \
  --models "codellama:7b,codellama:13b" \
  --weight 0.9

ollama-link hosts define \
  --name "creative" \
  --host "creative.example.com:11434" \
  --models "llama2:13b,mistral:7b" \
  --weight 0.8

# Configure routing
ollama-link route set --mode smart \
  --priority-rule "code:host2,creative:host3"

# Deploy with monitoring
ollama-link deploy --monitor=true \
  --load-balancing="smart" \
  --failover=true
```

### Example: Load Balancing Configuration

```bash
# Setup for high availability
OLLAMA_LOAD_BALANCE=smart
OLLAMA_WEIGHTS="host1:1.0,host2:0.8,host3:0.6"

# Route based on request type
ollama-link route add \
  --model "codellama" \
  --host "host2" \
  --priority high

ollama-link route add \
  --model "llama2" \
  --host "host3" \
  --priority medium
```

---

## 📖 Related Documents

- [🛠️ Configuration Guide](README_CONFIG.md)
- [📝 Usage Examples](examples/README.md)
- [🚀 Deployment Guide](DEPLOY.md)

## 🔗 API Reference

See the [API Documentation](examples/API.md) for complete command reference.

## 📞 Support

- **Documentation:** [Ollama Docs](https://docs.ollama.ai)
- **GitHub:** [zerwiz/piwithstuff](https://github.com/zerwiz/piwithstuff)

# Model Configuration Plan

## Agent Model Assignments

### Lightweight Agents (Qwen3.5:9b-32k)
These agents benefit from the efficient, token-efficient capabilities of Qwen3.5:9b with 32k context window:

- **Scout Agent**
- **Documenter Agent**

### Heavy Agents (Nemotron-Cascade-2:30b)
These agents require the larger capacity and reasoning capabilities of Nemotron-Cascade-2:30b:

- **Pi Orchestrator (pi-orchestrator)**
- **Planner**
- **Builder**
- **Reviewer**

## Configuration Options

### Per-Agent Model Specification
Users may specify different models for each agent through configuration files. This allows fine-grained control over agent behavior and resource allocation.

- Each agent has its own model configuration option
- Models can be changed individually per agent
- Ideal for environments with heterogeneous compute resources

### Default System Model
Alternatively, users can set a default system model that applies to all agents.

- Simplified configuration management
- Single model for all agents
- Recommended for homogeneous environments or initial setups

## Flexibility Notes

Using different models for different agents is **optional for users**:

1. **Per-agent configuration**: Specify a different model for each agent
2. **Default model**: Use a single default system model for all agents
3. **Mixed approaches**: Use default for some agents, custom models for others

This flexibility allows users to:
- Optimize costs by using cheaper models for simpler agents
- Match agent complexity to available compute resources
- Upgrade individual agents without affecting the entire system
- Simplify deployments by using a consistent model across all agents

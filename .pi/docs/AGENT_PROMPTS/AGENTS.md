# 🤖 Agent Prompting Guide

Complete guide for writing effective prompts for Multi-Host Ollama agents, including agent-specific guides, prompt templates, and communication patterns.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Agent System Architecture](#agent-system-architecture)
- [Prompt Structure Requirements](#prompt-structure-requirements)
- [Best Practices](#best-practices)
- [Individual Agent Guides](#individual-agent-guides)
- [Prompt Structure Template](#prompt-structure-template)
- [Communication Flow](#communication-flow)
- [Examples](#examples)
- [Common Mistakes](#common-mistakes)

---

## 🌍 Overview

### What is Agent Prompting?

Agent prompting is the art of crafting precise instructions that enable AI agents to perform specific tasks effectively. Multi-Host Ollama's intelligent agent routing system uses custom prompts to:

- **Route requests** to the appropriate agent
- **Manage state** across agent interactions
- **Coordinate tasks** between agents
- **Maintain consistency** in outputs
- **Handle edge cases** intelligently

### Agent System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Routing System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │  Scout   │───▶│  Planner │───▶│  Developer│               │
│  │  Discovery│   │  &      │    │  Code     │               │
│  │& Analysis │   │Scheduler│    │Execution  │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│        │              │                   │                  │
│        ▼              ▼                   ▼                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │  Red-Team│───▶│  Reviewer│───▶│  Document│               │
│  │  Testing │    │& Quality │    │   er     │               │
│  └──────────┘    └──────────┘    └──────────┘               │
│                                                               │
│         ┌──────────┐    ┌──────────┐                         │
│         │ Session  │    │  Ext-    │                         │
│         │ Manager  │    │ Builder  │                         │
│         │& Monitor │    │  &      │                         │
│         └──────────┘    │ Planner │                         │
│                         └──────────┘                         │
│                         │Agent Template                       │
│         ┌──────────────┴─────────────┐                       │
│         │           Frontend Coder    │                       │
│         └─────────────────────────────┘                       │
│                                                               │
│         ┌──────────┐    ┌──────────┐                         │
│         │ Skill    │    │  Pi-Dev   │                         │
│         │ Builder  │    │  Expert   │                         │
│         └──────────┘    └──────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Prompt Structure Requirements

Every agent prompt must include:

1. **[ROLE]** - Clear definition of agent purpose
2. **[CONTEXT]** - Current state and environment
3. **[GOAL]** - Specific objective to achieve
4. **[CONSTRAINTS]** - Boundaries and limitations
5. **[WORKFLOW]** - Step-by-step process
6. **[FORMAT]** - Expected output structure
7. **[INPUT]** - Data received
8. **[OUTPUT]** - Expected results

### Best Practices

#### ✅ Do

- **Be specific** about desired behavior
- **Define clear constraints** on what to avoid
- **Use examples** in complex tasks
- **Chain reasoning** for multi-step tasks
- **Iterate** prompts based on performance
- **Test** with edge cases
- **Document** reasoning behind prompt choices

#### ❌ Don't

- **Be vague** about objectives
- **Ignore context** from previous interactions
- **Over-complicate** simple tasks
- **Conflict** between constraints
- **Assume knowledge** without providing context
- **Use jargon** not understood by AI

---

## 🤖 Individual Agent Guides

### 🔴 Red-Team Agent

**Purpose:** Security testing, vulnerability identification, adversarial analysis

```bash
# Location: docs/AGENT_PROMPTS/red-team.md
# Purpose: Security testing prompts for adversarial evaluation
```

#### Key Guidelines

```bash
# Focus areas:
- Input injection vulnerabilities
- Prompt injection attacks
- Output filtering bypasses
- Authentication bypass attempts
- Data leakage detection
- Rate limit abuse
- Resource exhaustion attacks

# Output format:
Security Report Format:
- VULNERABILITY_NAME
- SEVERITY: [low/medium/high/critical]
- DESCRIPTION
- REPRODUCTION STEPS
- MITIGATION SUGGESTIONS
- CONFIDENCE LEVEL
```

#### Example Use Case

```bash
# Task: Test authentication bypass
Task: "Assess if user_id=1 returns admin panel"
Response: "Detected IDOR vulnerability - can access admin without auth"
```

---

### 📚 Documenter Agent

**Purpose:** Documentation generation, knowledge organization, content creation

```bash
# Location: docs/AGENT_PROMPTS/documenter.md
# Purpose: Documentation prompts for content generation
```

#### Key Guidelines

```bash
# Documentation types:
- API documentation
- User guides
- Technical specifications
- README files
- Contribution guidelines
- Release notes

# Writing style:
- Clear and concise
- Use markdown formatting
- Include code examples
- Link to relevant resources
- Maintain consistency in terminology

# Documentation structure:
1. Title and overview
2. Prerequisites
3. Installation
4. Usage examples
5. API reference (if applicable)
6. Troubleshooting
7. Contributing
```

---

### 📋 Plan Reviewer Agent

**Purpose:** Code review, quality assurance, improvement suggestions

```bash
# Location: docs/AGENT_PROMPTS/plan-reviewer.md
# Purpose: Code review and improvement evaluation prompts
```

#### Key Guidelines

```bash
# Review criteria:
- Code correctness
- Performance considerations
- Security best practices
- Documentation completeness
- Testing coverage
- Error handling
- Code style consistency

# Review output:
- Overall assessment
- Critical issues (blocking)
- Minor issues (warnings)
- Suggested improvements
- Code style notes

# Severity levels:
CRITICAL: Will break functionality
WARNING: Needs attention but not blocking
SUGGESTION: Optimization or style fix
INFO: informational only
```

---

### 🏴󠁧󠁢󠁳󠁣󠁴󠁿 Bowser Agent (Placeholder)

```bash
# Location: docs/AGENT_PROMPTS/bowser.md
# Status: Not implemented yet
# Purpose: Placeholder for potential specialized agent
```

```bash
# Pending Implementation
bowser.md should contain:
- Agent persona definition
- Primary responsibilities
- Knowledge areas
- Communication style
- Task examples

This placeholder exists for future agent development.
```

---

### 🔁 Session Manager Agent

**Purpose:** Agent lifecycle management, state tracking, progress monitoring

```bash
# Location: docs/AGENT_PROMPTS/session-manager.md
# Purpose: Agent lifecycle and state management prompts
```

#### Key Guidelines

```bash
# State management:
- Track pending operations
- Monitor task progress
- Handle state persistence
- Coordinate agent handoffs
- Manage timeout scenarios
- Track execution history

# Session commands:
- Initialize session
- Update state
- Save progress
- Resume operation
- Complete session
- Rollback changes

# Session state:
ID: uuid
Status: [active/paused/completed]
Created: timestamp
Last updated: timestamp
Progress: current/total
Error count: number
```

---

### 📄 Agent Template

**Purpose:** Template for creating new agent prompts

```bash
# Location: docs/AGENT_PROMPTS/agenttemplate.md
# Purpose: Standard template for new agent creation
```

#### Template Usage

Use this template as a starting point for any new agent:

```markdown
[AGENT TEMPLATE]

[ROLE] I am a {agent_name} who {primary function}.

[CONTEXT] Current state: {context_description}.

[GOAL] Generate output that {objective}.

[CONSTRAINTS] 
- Rule 1: {constraint}
- Rule 2: {constraint}
- Rule 3: {constraint}

[WORKFLOW]
1. {step 1}
2. {step 2}
3. {step 3}
4. {step 4}

[FORMAT] Output in {format}.

[INPUT] Received: {input_data}.

[OUTPUT] {expected_result}.

[KNOWLEDGE] Relevant domain knowledge: {knowledge}

[EXAMPLES] Examples of expected behavior: {examples}
```

---

### 🔧 Ext Builder Agent

**Purpose:** Extension development, capability enhancement, feature building

```bash
# Location: docs/AGENT_PROMPTS/ext-builder.md
# Purpose: Extension development and enhancement prompts
```

#### Key Guidelines

```bash
# Extension development:
- Identify capability gaps
- Propose new features
- Write extension code
- Test extension functionality
- Document extension usage
- Handle version compatibility

# Extension lifecycle:
1. Identify need
2. Design extension
3. Implement code
4. Test thoroughly
5. Document usage
6. Deploy safely
7. Monitor performance

# Extension patterns:
- API hooks
- UI components
- Process automation
- Integration modules
- Utility functions
```

---

### 🎨 Frontend Coder Agent

**Purpose:** Frontend UI generation, component creation, styling

```bash
# Location: docs/AGENT_PROMPTS/frontendcoder.md
# Purpose: Frontend UI and component generation prompts
```

#### Key Guidelines

```bash
# Frontend focus:
- Component structure
- Styling and theming
- Responsive design
- Accessibility standards
- Performance optimization
- Browser compatibility
- State management

# UI patterns:
- Modern CSS frameworks
- Component architecture
- Design system compliance
- Progressive enhancement
- Touch-friendly design
- SEO considerations
```

---

### 🐍 Pi-Dev Expert Agent

**Purpose:** Python development, scripting, automation

```bash
# Location: docs/AGENT_PROMPTS/pi-dev-expert.md
# Purpose: Python development and scripting prompts
```

#### Key Guidelines

```bash
# Python expertise:
- Modern Python best practices
- Type hints and annotations
- Async programming
- API integration
- Testing best practices
- Package management
- Virtual environments

# Code quality:
- PEP 8 compliance
- Documentation strings
- Type safety
- Error handling
- Dependency management
- Performance optimization
```

---

### 📈 Skill Builder Agent

**Purpose:** Training, skill development, capability building

```bash
# Location: docs/AGENT_PROMPTS/skillbuilder.md
# Purpose: Training and skill development prompts
```

#### Key Guidelines

```bash
# Training approaches:
- Incremental learning
- Progressive complexity
- Practical examples
- Real-world scenarios
- Performance tracking
- Gap analysis

# Skill matrix:
Basic → Intermediate → Advanced → Expert → Master
Track progress through:
- Task completion metrics
- Error reduction
- Performance improvements
- Knowledge acquisition
```

---

### 👨‍💻 Developer Agent

**Purpose:** General development tasks, implementation, problem-solving

```bash
# Location: docs/AGENT_PROMPTS/developer.md
# Purpose: General development and implementation prompts
```

#### Key Guidelines

```bash
# Development areas:
- Code implementation
- Bug fixing
- Feature development
- Refactoring
- Code optimization
- Integration work
- Debug assistance

# Development workflow:
1. Analyze requirements
2. Design solution
3. Implement code
4. Write tests
5. Document code
6. Request review
7. Deploy and monitor
```

---

### 🏗️ Agent Builder Agent

**Purpose:** Agent system configuration, agent creation, system setup

```bash
# Location: docs/AGENT_PROMPTS/agentbuilder.md
# Purpose: Agent system and configuration prompts
```

#### Key Guidelines

```bash
# Agent configuration:
- Create new agents
- Configure routing rules
- Set up agent hierarchies
- Define agent capabilities
- Manage agent lifecycle
- Configure agent permissions

# Configuration tasks:
- Define agent persona
- Set agent capabilities
- Configure routing behavior
- Set up monitoring
- Handle agent updates
- Manage agent scaling
```

---

### 📅 Planner Agent

**Purpose:** Planning, scheduling, task organization

```bash
# Location: docs/AGENT_PROMPTS/planner.md
# Purpose: Planning and scheduling coordination prompts
```

#### Key Guidelines

```bash
# Planning capabilities:
- Task breakdown
- Resource allocation
- Timeline creation
- Priority assignment
- Dependency mapping
- Progress tracking

# Planning templates:
- Sprint plans
- Project timelines
- Resource plans
- Risk assessments
- Rollout schedules

# Schedule formats:
- Gantt charts
- Kanban boards
- Timeline views
- Priority lists
- Milestone trackers
```

---

### 🔍 Reviewer Agent

**Purpose:** Code quality review, validation, quality assurance

```bash
# Location: docs/AGENT_PROMPTS/reviewer.md
# Purpose: Code quality review and validation prompts
```

#### Key Guidelines

```bash
# Review criteria:
- Code correctness
- Performance analysis
- Security validation
- Error handling
- Documentation quality
- Test coverage
- Code style compliance

# Review report structure:
Severity | Issue | Location | Impact | Resolution
---------|-------|----------|--------|------------
Critical | ...   | ...      | High   | ...
Warning  | ...   | ...      | Medium | ...
Info     | ...   | ...      | Low    | ...
```

---

### 🧭 Scout Agent

**Purpose:** Information discovery, context gathering, exploration

```bash
# Location: docs/AGENT_PROMPTS/scout.md
# Purpose: Discovery and exploration prompting
```

#### Key Guidelines

```bash
# Discovery tasks:
- Information gathering
- Context research
- Resource location
- Pattern recognition
- Trend analysis
- Capability mapping

# Research workflow:
1. Define scope
2. Gather information
3. Analyze patterns
4. Identify gaps
5. Document findings
6. Report results

# Research outputs:
- Status reports
- Findings summaries
- Gap analysis documents
- Trend analyses
- Recommendation reports
```

---

## 📝 Prompt Structure Template

### Full Template

```markdown
[ROLE] I am a {agent_name} who {primary function}.

[CONTEXT] Current state: {context_description}.

[GOAL] Generate output that {objective}.

[CONSTRAINTS] 
- Rule 1: {constraint}
- Rule 2: {constraint}
- Rule 3: {constraint}

[WORKFLOW]
1. {step 1}
2. {step 2}
3. {step 3}
4. {step 4}

[FORMAT] Output in {format}.

[INPUT] Received: {input_data}.

[OUTPUT] {expected_result}.

[KNOWLEDGE] Relevant domain knowledge: {knowledge}.

[EXAMPLES] Examples of expected behavior: {examples}.
```

### Template Customization

#### For Code Generation

```markdown
[ROLE] I am a developer expert who writes clean, efficient code.

[CONTEXT] Current state: Building a new feature for the project.

[GOAL] Generate code that is functional, well-documented, and follows best practices.

[CONSTRAINTS] 
- Rule 1: Use type hints for all functions
- Rule 2: Include comprehensive docstrings

[WORKFLOW]
1. Understand requirements
2. Design solution architecture
3. Write implementation code
4. Add unit tests
5. Write documentation

[FORMAT] Python with mypy type checking

[INPUT] Requirements: {requirements}.

[OUTPUT] Code that runs correctly.
```

#### For Code Review

```markdown
[ROLE] I am a code reviewer who ensures quality standards.

[CONTEXT] Current state: Evaluating pull request changes.

[GOAL] Provide detailed feedback on code quality and improvements.

[CONSTRAINTS] 
- Rule 1: Focus on critical issues first
- Rule 2: Consider security implications

[WORKFLOW]
1. Review code changes
2. Test functionality
3. Identify problems
4. Categorize by severity
5. Write comprehensive review

[FORMAT] Markdown with severity classification

[INPUT] Code changes: {changes}.

[OUTPUT] Review report with action items.
```

---

## 🔄 Communication Flow

### Agent Interaction Model

```
┌────────────────────────────────────────────────────────────┐
│                    Agent Communication Flow                   │
├────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                  │
│  │   Scout │───▶│ Planner │───▶│ Dev     │ ───────┐         │
│  │  Task   │    │  &      │    │  Exec   │         │         │
│  │ Analysis│    │Sched    │    │         │         │         │
│  └─────────┘    │  ule     │    └─────────┘         │         │
│                 └─────────┘                         │         │
│                 ▲         ┌─────────┐               │         │
│                 │         │ Reviewer│──────────────┘         │
│                 │         │ Quality │                         │
│                 │         └─────────┘                         │
│                 │         ┌─────────┐                         │
│                 │         │ Doc     │                         │
│                 │         │  er     │                         │
│                 │         └─────────┘                         │
│                 │         ┌─────────┐                         │
│                 └────────▶│Ext      │                         │
│                           │ Builder │                         │
│                           └─────────┘                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Agent Patterns

#### Pattern 1: Sequential Handoff

```bash
# Task flow:
1. Scout analyzes task
2. Planner creates schedule
3. Developer implements
4. Reviewer validates
5. Documenter creates docs
6. Ext Builder adds features

# Message passing:
Scout → Planner: "Task identified: {task_id}"
Planner → Developer: "Start work on {task_id}"
Developer → Reviewer: "Code ready: {code}"
Reviewer → Developer: "Feedback: {feedback}"
Developer → Documenter: "Implementation complete"
```

#### Pattern 2: Parallel Processing

```bash
# Independent tasks:
Task A: Developer handles implementation
Task B: Ext Builder adds features
Task C: Reviewer validates both

# Coordination:
Synchronization point after parallel work
Merge conflicts resolution
Integrated delivery
```

#### Pattern 3: Feedback Loops

```bash
# Iterative refinement:
1. Initial implementation → Reviewer
2. Reviewer feedback → Developer
3. Revision → Reviewer
4. Final approval → Documenter

# Quality gates:
Code Quality Gate: Pass or fail
Security Gate: Security scan required
Documentation Gate: Docs must be complete
```

### Handoff Protocol

```markdown
## 📤 Handoff Protocol

```json
{
  "handoff_type": "sequential|parallel|iterative",
  "from_agent": "previous_agent_id",
  "to_agent": "next_agent_id",
  "data": {
    "task_id": "string",
    "status": "in_progress|completed",
    "result": "string|code|analysis",
    "notes": "string"
  }
}
```

## State Transfer

```bash
# Include in handoff:
- Current context
- Pending operations
- Error history
- Resource usage
- Progress metrics
```

---

## 📊 Examples

### 🔴 Red-Team Example

```markdown
## 🔴 Red-Team Prompt Example

[ROLE] I am a red-team security researcher who identifies vulnerabilities.

[CONTEXT] User is testing authentication bypass vulnerability.

[GOAL] Demonstrate if unauthorized access is possible.

[CONSTRAINTS] 
- Rule 1: Only test with provided credentials
- Rule 2: Do not exploit in production
- Rule 3: Document all findings

[WORKFLOW]
1. Analyze input parameters
2. Test authentication flow
3. Attempt bypass techniques
4. Document findings
5. Provide mitigation suggestions

[FORMAT] Security report with severity ratings

[INPUT] User credentials: guest, Admin panel: /admin

[OUTPUT] Analysis of authentication bypass attempts and vulnerabilities found.
```

### 👨‍💻 Developer Example

```markdown
## 👨‍💻 Developer Prompt Example

[ROLE] I am a developer expert who builds clean, maintainable code.

[CONTEXT] Implementing a new user authentication feature.

[GOAL] Write secure, efficient authentication code.

[CONSTRAINTS] 
- Rule 1: Use proper password hashing
- Rule 2: Implement rate limiting
- Rule 3: Handle errors gracefully

[WORKFLOW]
1. Analyze requirements
2. Design API endpoints
3. Implement authentication logic
4. Add error handling
5. Write unit tests
6. Document API usage

[FORMAT] Python with complete documentation

[INPUT] Auth requirements: OAuth2, password reset, MFA support

[OUTPUT] Complete authentication module with tests and docs.
```

### 📅 Planner Example

```markdown
## 📅 Planner Prompt Example

[ROLE] I am a planner who organizes complex tasks.

[CONTEXT] User needs to migrate a legacy system to cloud.

[GOAL] Create migration plan with timeline and milestones.

[CONSTRAINTS] 
- Rule 1: Include risk assessment
- Rule 2: Define rollback procedures
- Rule 3: Set realistic timelines

[WORKFLOW]
1. Assess current state
2. Design migration strategy
3. Create timeline
4. Identify dependencies
5. Plan resources
6. Document risks

[FORMAT] Markdown with Gantt chart

[INPUT] Current system state, target cloud platform

[OUTPUT] Migration plan with timeline, resources, and risk assessment.
```

### 🔍 Reviewer Example

```markdown
## 🔍 Reviewer Prompt Example

[ROLE] I am a code quality reviewer who ensures standards.

[CONTEXT] Reviewing pull request #42 with authentication improvements.

[GOAL] Identify issues and provide detailed feedback.

[CONSTRAINTS] 
- Rule 1: Focus on critical issues first
- Rule 2: Consider security implications
- Rule 3: Provide actionable suggestions

[WORKFLOW]
1. Review code changes
2. Run static analysis
3. Test functionality
4. Check documentation
5. Categorize findings
6. Write review report

[FORMAT] Review report with severity classification

[INPUT] Code diffs, test results, security scan output

[OUTPUT] Comprehensive code review with categorized issues.
```

### 🧭 Scout Example

```markdown
## 🧭 Scout Prompt Example

[ROLE] I am a scout who gathers information and discovers context.

[CONTEXT] User wants to integrate payment processing.

[GOAL] Identify payment processors, APIs, and integration approaches.

[CONSTRAINTS] 
- Rule 1: Focus on reliable providers
- Rule 2: Consider compliance requirements
- Rule 3: Evaluate cost factors

[WORKFLOW]
1. Research payment options
2. Compare APIs
3. Check integration docs
4. Evaluate security
5. Compare pricing
6. Recommend options

[FORMAT] Research summary with comparison table

[INPUT] Target market, volume expectations, compliance needs

[OUTPUT] Payment processor comparison and recommendation.
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Vague Objectives

```bash
# Bad:
"Help me build an API"

# Good:
"Build a REST API endpoint that retrieves user data with proper authentication"

# Mistake:
- Ambiguous requirements
- Undefined success criteria
- Unrealistic expectations
```

### ❌ Missing Context

```bash
# Bad:
"Fix the bug"

# Good:
"Fix the null pointer exception in the user service when userId is empty string"

# Mistake:
- No background information
- Missing prerequisites
- Insufficient details
```

### ❌ Overly Complex Workflows

```bash
# Bad:
"Build a system that does everything"

# Good:
"Build module A. In next iteration, build module B"

# Mistake:
- Attempting too much at once
- No clear prioritization
- Overwhelming scope
```

### ❌ Ignoring Constraints

```bash
# Bad:
"Create any tool you want"

# Good:
"Create a tool that runs in browser, no server dependencies"

# Mistake:
- Constraints ignored or forgotten
- Resources exceeded
- Budget limits exceeded
```

---

## 🔬 Advanced Techniques

### Chain of Thought Prompting

```java
// Step-by-step reasoning
"I need to build a feature. Let me think through this:

Steps:
1. First, I understand the requirements
2. Then, I design the architecture
3. After that, I implement individual components
4. Finally, I test the complete system
"
```

### Few-Shot Prompting

```java
// Provide examples
"I need to classify text sentiment. Examples:

Positive: "I love this!" → POSITIVE
Neutral: "It's okay." → NEUTRAL
Negative: "This is terrible." → NEGATIVE

Apply these patterns to: {input}"
```

### Self-Correction Loops

```java
// Enable agent to self-correct
"If you are unsure, ask clarifying questions before proceeding.
If you make an error, admit it and correct yourself."
```

---

## 🎯 Quick Reference Card

```bash
# Essential Prompt Components:
[ROLE] = Who the agent is
[CONTEXT] = Current state of task
[GOAL] = What needs to be achieved
[CONSTRAINTS] = Boundaries and limits
[WORKFLOW] = Step-by-step process
[FORMAT] = Expected output structure
[INPUT] = Data provided to agent
[OUTPUT] = Expected results

# Common Patterns:
- Sequential handoffs
- Parallel processing
- Iterative refinement
- Feedback loops
- Decision trees
- State tracking

# Best Practices:
- Be specific about requirements
- Provide relevant context
- Set clear constraints
- Use examples
- Test with edge cases
- Iterate based on feedback
```

---

## 📚 Related Documents

- [🛠️ Agent Configuration](../README.md)
- [📖 API Reference](../api.md)
- [📦 Deployment Guide](../DEPLOYMENT.md)

---

## 📞 Support

- **Documentation:** [Agent Docs](docs/)
- **Examples:** [examples/PROMPT_EXAMPLES.md](examples/PROMPT_EXAMPLES.md)
- **GitHub:** [zerwiz/piwithstuff](https://github.com/zerwiz/piwithstuff)

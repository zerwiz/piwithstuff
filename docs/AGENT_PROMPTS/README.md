# Agent Prompt Library

A comprehensive collection of prompts for software development agents, organized by role and task type.

## 📋 Table of Contents

- [Agents Overview](#agents-overview)
- [Quick Start](#quick-start)
- [Agent Types](#agent-types)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [License](#license)

---

## 👥 Agents Overview

| Agent | Purpose | Key Capabilities |
|-------|---------|------------------|
| **Developer** | Code implementation | Feature dev, bug fixing, refactoring |
| **Architect** | System design | Architecture, scalability, migration |
| **Reviewer** | Code quality | Reviews, validation, security checks |
| **Tests** | Testing | Unit, integration, e2e, TDD |
| **Orchestrator** | Coordination | Task distribution, workflow management |
| **Code Writer** | Document generation | API docs, error messages, logs |

---

## 🚀 Quick Start

### For Developers

- Read [`developer.md`](developer.md)
- Understand task types and workflows
- Use examples in [`examples/`](examples/)
- Write testable, maintainable code

### For Architects

- Read [`architect.md`](architect.md)
- Plan system architecture
- Consider scalability and security
- Review examples in [`examples/`](examples/)

### For Reviewers

- Read [`reviewer.md`](reviewer.md)
- Conduct code reviews
- Check style compliance
- Validate quality

### For Orchestrators

- Read [`orchestrator.md`](orchestrator.md)
- Manage agent workflows
- Handle failures gracefully
- Monitor system health

### For Others

- Use [`tools.md`](tools.md) for task breakdown
- Reference [`examples/`](examples/) for templates

---

## 📦 Agent Types

### Developer Agent

Focuses on practical implementation tasks:

```markdown
- Feature implementation
- Bug fixing
- Code refactoring
- API development
- Integration development
```

### Architect Agent

Focuses on high-level design:

```markdown
- Initial system architecture
- Scalability analysis
- Technology migration
- Security architecture
- Infrastructure planning
```

### Reviewer Agent

Focuses on quality assurance:

```markdown
- Code quality reviews
- Security reviews
- Performance reviews
- Documentation reviews
- Style compliance
```

### Testing Agent

Focuses on test creation and execution:

```markdown
- Unit test generation
- Integration test writing
- E2E test creation
- Test suite organization
- Security testing
```

### Code Writer Agent

Focuses on documentation:

```markdown
- API documentation
- Error messages
- Log templates
- Usage examples
- Maintenance guides
```

### Orchestrator Agent

Focuses on coordination:

```markdown
- Task distribution
- Workflow management
- System health monitoring
- Quality control
- Failure handling
```

---

## 💡 Usage Examples

### Example 1: Creating a New Feature

```bash
# Use developer.md template
# Context: Implement user authentication

cat > feature-auth.txt <<'EOF'
[ROLE] I am a developer implementing user authentication.

[CONTEXT] Current state: {authentication_requirements}

[GOAL] Implement secure auth system with OPA and JWT.

[CONSTRAINTS] 
- Rule 1: Follow secure coding practices
- Rule 2: Use bcrypt for passwords
- Rule 3: Validate all inputs
EOF
```

### Example 2: System Architecture Request

```bash
# Use architect.md template
# Context: Design microservices architecture

# Prompt structure:
# - Requirements
# - Constraints
# - Deliverables
# - Examples to include
```

### Example 3: Code Review

```bash
# Use reviewer.md template
# Context: Review pull request

# Include:
# - Code changes
# - Review criteria
# - Action items
```

---

## ✅ Best Practices

### For All Agents

1. **Be specific** - Clear constraints yield better results
2. **Provide context** - Help agents understand the domain
3. **Iterate** - Refine prompts with feedback
4. **Check examples** - Learn from the example prompts
5. **Validate output** - Verify agent responses

### For Each Agent Type

#### Developer

- ✅ Include type hints
- ✅ Write comprehensive tests
- ✅ Document public APIs
- ✅ Handle edge cases

#### Architect

- ✅ List scalability requirements
- ✅ Define performance targets
- ✅ Plan for security
- ✅ Budget for costs

#### Reviewer

- ✅ Be constructive
- ✅ Focus on critical issues
- ✅ Validate quality
- ✅ Prioritize by severity

#### Testing

- ✅ Define test coverage goals
- ✅ Use appropriate strategies
- ✅ Test with failure scenarios
- ✅ Document test cases

---

## 📁 File Organization

```
docs/AGENT_PROMPTS/
├── README.md                  # Repository overview
├── developer.md               # Developer agent guide
├── architect.md               # Architect agent guide
├── reviewer.md                # Reviewer agent guide
├── tools.md                   # General task tools
├── tests-examples.md          # Testing examples
├── examples/
│   ├── code-writer-examples.md  # Document examples
│   ├── architect-examples.md    # Architecture examples
│   └── tests-examples.md        # Test examples
└── orchestrator.md            # Orchestrator agent guide
```

---

## 🔧 Customization

To customize prompts:

1. Copy relevant template
2. Add specific requirements
3. Include constraints
4. Specify expected output

Example:

```markdown
# Custom Prompt

[ROLE] Implement {feature} in {language}

[CONTEXT] {current_state}

[GOAL] {goal}

[CONSTRAINTS] 
- Include tests
- Follow style guide
- Document APIs
```

---

## 📚 Additional Resources

- [Airbnb Style Guide](https://github.com/airbnb/python)
- [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- [Python Testing Guide](https://docs.python-guide.org/writing/tests/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 📄 License

This prompt library is for educational purposes. Feel free to adapt and use in your own projects.

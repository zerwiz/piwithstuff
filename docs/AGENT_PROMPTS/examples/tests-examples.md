# Example Prompt Files for Testing Agent

## Examples directory

This directory contains example testing prompts and scenarios.

```
examples/
├── tests-examples/
│   ├── unit-test-1.md
│   ├── integration-test-2.md
│   └── e2e-test-3.md
```

---

## Example 1: Unit Tests

### file: examples/tests-examples/unit-test-1.md

This example shows writing comprehensive unit tests.

```markdown
# Unit Test Writing Example

## Prompt

Write unit tests for the following {language} code:

```
# Code to test
{code here}
```

### Requirements

- Use {testing_framework}
- Test all functions individually
- Achieve {target_coverage}% coverage
- Test edge cases
- Test error conditions
- Use parametric tests

### Deliverables

- Test file(s)
- Coverage report
- Test documentation
- Setup instructions

---

## Unit Test Structure

```
{code}
def test_function_name():
    """Test happy path."""
    # Test normal case

def test_function_name_error():
    """Test error case."""
    # Test error handling

def test_function_name_edge():
    """Test edge case."""
    # Test boundaries
    
@mark.parametrize
```

### Test Cases to Include

1. **Happy Path Tests**
   - Normal input, normal output
   - Valid cases
   - Expected behavior

2. **Error Handling Tests**
   - Invalid input
   - Boundary conditions
   - Exception cases

3. **Edge Case Tests**
   - Empty input
   - Maximum values
   - Boundary values

4. **Regression Tests**
   - Previous failures
   - Known issues

---

## Test Coverage Targets

| Test Type | Minimum Coverage | Recommended |
|-----------|------------------|-------------|
| Functions | 80% | 90%+ |
| Classes | 60% | 80%+ |
| Modules | 75% | 90%+ |

---

## Tips for Unit Test Prompts

1. **Provide complete code** - All imports, context
2. **Specify framework** - pytest, unittest, etc.
3. **List edge cases** - What to test specifically
4. **Request coverage** - Target coverage percentage
5. **Ask for organization** - Group tests logically
6. **Include fixtures** - Setup/teardown requirements
```

---

## Example 2: Integration Tests

### file: examples/tests-examples/integration-test-2.md

This example shows writing integration tests for components.

```markdown
# Integration Test Writing Example

## Prompt

Write integration tests for the following {project}:

### Components

- {component1}
- {component2}
- {component3}

### Integration Points

- {integration_point1}
- {integration_point2}

### Test Scope

- Test {component1} ↔ {component2} interaction
- Test {component2} ↔ {component3} interaction
- Test API contracts
- Test database integration

### Requirements

- Use {testing_framework}
- Test real integrations OR mocks
- Achieve {target_coverage}% coverage
- Document setup requirements

### Deliverables

- Integration test files
- Test setup script
- API contract tests
- Documentation

---

## Integration Test Structure

```
integration_tests/
├── test_api_contract.py
├── test_database_integration.py
├── test_component_interaction.py
└── fixtures/
    ├── api_client.py
    ├── database.py
    └── mocks/
```

### Test Scenarios

1. **API Contract Tests**
   - Test request/response schemas
   - Test validation rules
   - Test error responses

2. **Database Integration**
   - Test CRUD operations
   - Test transaction handling
   - Test migrations

3. **Component Interaction**
   - Test service-to-service calls
   - Test message queues
   - Test event publishing

---

## Mock vs Real Decisions

### When to Use Mocks

- External services unstable
- Performance concerns
- Testing internal contracts
- Development environment

### When to Use Real

- Final tests
- Contract verification
- Performance validation
- Integration verification

---

## Tips for Integration Test Prompts

1. **Define boundaries** - What's being tested
2. **Specify integration points** - API boundaries, data flows
3. **Choose mock/real strategy** - When to use each
4. **Document setup** - How to prepare environment
5. **List components** - All parts involved
6. **Specify expectations** - What to test for
```

---

## Example 3: End-to-End Tests

### file: examples/tests-examples/e2e-test-3.md

This example shows writing end-to-end tests for user journeys.

```markdown
# E2E Test Writing Example

## Prompt

Write end-to-end tests for the following {user_journey}:

### User Scenario

{description of user scenario}

### User Flow

1. {step1}
2. {step2}
3. {step3}

### Test Requirements

- Use {test_tool}
- Test complete user flow
- Test error paths
- Test recovery flows
- Document setup

### Deliverables

- E2E test scripts
- Test data setup
- Run scripts
- Documentation

---

## E2E Test Structure

```
e2e/
├── scenarios/
│   ├── happy_path.py
│   └── error_handling.py
├── fixtures/
│   ├── users.py
│   └── data/
└── conftest.py
```

### Test Scenarios

1. **Happy Path**
   - Complete successful flow
   - Expected outcomes
   - Page verification

2. **Error Handling**
   - Invalid input handling
   - Network failures
   - Recovery steps

3. **User Journeys**
   - New user flow
   - Existing user flow
   - Admin flows

---

## E2E Testing Best Practices

### Test Data Management

- Seed database with test data
- Create/destroy test users
- Clean up after tests
- Use fixtures for setup

### Test Isolation

- Each test independent
- No shared mutable state
- Clean setup for each test
- Proper teardown

### Performance Considerations

- Run in parallel
- Don't run all tests frequently
- Cache results when appropriate
- Use lightweight verification

---

## Tips for E2E Test Prompts

1. **Define complete user flow** - From start to finish
2. **List error scenarios** - What failures to test
3. **Specify tooling** - Selenium, Playwright, Cypress
4. **Document setup** - Data requirements, prerequisites
5. **Request cleanups** - How to reset environment
6. **Be realistic** - Don't expect perfect results
```

---

## Example 4: Test Suite Organization

### file: examples/tests-examples/test-suites-4.md

This example shows organizing comprehensive test suites.

```markdown
# Test Suite Organization Example

## Prompt

Organize a comprehensive test suite for the following project:

### Project Structure

```
project/
├── src/
│   ├── api/
│   ├── core/
│   └── utilities/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── examples/
```

### Test Categories

- {category1}
- {category2}
- {category3}

### Requirements

- Use {testing_framework}
- Organize by feature
- Achieve target coverage
- Document each test
- Handle test dependencies

### Deliverables

- Test files organized
- Test runner configuration
- Coverage report setup
- Documentation

---

## Test Suite Structure

```
tests/
├── __init__.py
├── conftest.py          # Shared fixtures
├── __pytest__.cfg       # Configuration
├── unit/
│   ├── test_api.py
│   ├── test_core.py
│   └── __init__.py
├── integration/
│   ├── test_database.py
│   └── test_external.py
└── e2e/
    ├── test_flows.py
    └── __init__.py
```

### pytest Configuration

```python
# pytest.ini
[pytest]
addopts = -v --cov=src
testpaths = tests/
```

### Test Organization

1. **Unit Tests** (`tests/unit/`)
   - Test individual functions
   - Isolated tests
   - Fast execution

2. **Integration Tests** (`tests/integration/`)
   - Test component interactions
   - Use mocks where appropriate
   - Slower execution

3. **E2E Tests** (`tests/e2e/`)
   - Complete user flows
   - Use real data
   - Slowest execution

---

## Tips for Test Organization Prompts

1. **Specify structure** - How to organize tests
2. **Define categories** - What kinds of tests
3. **Set target coverage** - Coverage percentage
4. **Document organization** - Explain the structure
5. **Request fixtures** - Shared setup/teardown
6. **Configure runner** - pytest.ini, test config

---

## Example 5: Security Tests

### file: examples/tests-examples/security-tests-5.md

This example shows writing security-focused tests.

```markdown
# Security Test Writing Example

## Prompt

Write security tests for the following {application}:

### Security Concerns

- {concern1}
- {concern2}
- {concern3}

### Test Requirements

- Test authentication flows
- Test authorization
- Test input validation
- Test for vulnerabilities
- Document findings

### Deliverables

- Security test files
- Vulnerability scanner config
- Audit report template
```

---

## Tips for All Testing Prompts

1. **Provide complete context** - Code, requirements, constraints
2. **Specify testing framework** - pytest, Jest, etc.
3. **Define test scope** - What to test specifically
4. **Set coverage goals** - Target percentage
5. **Request documentation** - Test explanations
6. **Be realistic** - Don't expect perfect results
```

---

## Quick Test Prompt Checklist

When creating test prompts:

- [ ] Code provided for testing
- [ ] Testing framework specified
- [ ] Test scope defined
- [ ] Coverage target set
- [ ] Edge cases listed
- [ ] Real vs mock strategy chosen
- [ ] Documentation requested
- [ ] Constraints specified

---

## Sample Test Prompts by Type

### Unit Test

```markdown
Write unit tests for:
- Code: {full_code}
- Framework: {pytest}
- Coverage target: {90}%
- Edge cases: {list}
```

### Integration Test

```markdown
Write integration tests for:
- Components: {component_list}
- Integration points: {points}
- Use strategy: {mock/real}
- Mock external services
```

### E2E Test

```markdown
Write e2e tests for:
- User flow: {description}
- Tool: {playwright}
- Error paths: {list}
- Recovery scenarios
```

---

## Common Patterns in Test Prompts

### Feature Tests

```markdown
Write tests for the following new feature:
- Feature: {name}
- Test happy path
- Test error handling
- Test edge cases
- Use {testing_framework}
```

### Regression Tests

```markdown
Write regression tests after this fix:
- Fix addresses: {issue_number}
- Test with original failing case
- Test with other scenarios
- Ensure no new issues
```

### Contract Tests

```markdown
Write contract tests for this API:
- Test request schemas
- Test response schemas
- Test validation rules
- Test error responses
```

---

## Summary

This examples directory provides templates for:
- Writing unit tests
- Creating integration tests
- Building e2e test suites
- Organizing comprehensive test suites
- Writing security tests
```

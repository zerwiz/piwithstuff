# Example Prompt Files for Code Writer Agent

## Examples directory

This directory contains example prompts showing different code writing scenarios.

```
examples/
├── code-writer-examples/
│   ├── feature-implementation-1.md
│   ├── bug-fix-2.md
│   ├── refactoring-3.md
│   └── api-development-4.md
```

---

## Example 1: Feature Implementation

### file: examples/code-writer-examples/feature-implementation-1.md

This example shows implementing a new feature in Python.

```markdown
# Feature Implementation Example

## Prompt

Implement a data processing feature that:
1. Reads CSV file
2. Cleans data
3. Transforms values
4. Writes to output CSV
5. Handles errors gracefully

### Constraints

- Use Python 3.x
- Handle encoding issues
- Validate input file
- Provide progress reporting
- Exit cleanly on errors

---

## Agent Response Structure

```
1. **Analysis Phase**
   - Understand requirements
   - Identify libraries
   - Plan implementation

2. **Implementation Phase**
   - Write code
   - Add error handling
   - Add documentation

3. **Testing Phase**
   - Write tests
   - Run tests
   - Fix failures

4. **Completion Phase**
   - Summarize features
   - Document public API
   - Request review
```

---

## Expected Code Quality

- ✅ Type hints used
- ✅ Unit tests included
- ✅ Clear error messages
- ✅ Progress reporting
- ✅ Documentation complete
```

---

## Example 2: Bug Fix

### file: examples/code-writer-examples/bug-fix-2.md

This example shows fixing a reported bug while preventing regression.

```markdown
# Bug Fix Example

## Prompt

Fix the following bug:
- **Error**: `KeyError` when processing file
- **Location**: `process_csv()` function
- **Scenario**: Missing column headers
- **Requirements**: 
  - Handle missing columns
  - Log warning
  - Continue processing
  - Don't crash

---

## Agent Response Structure

```
1. **Analysis Phase**
   - Reproduce bug
   - Identify root cause
   - Plan fix

2. **Implementation Phase**
   - Implement fix
   - Add validation
   - Add error handling

3. **Testing Phase**
   - Write regression test
   - Write bug reproduction test
   - Run test suite

4. **Completion Phase**
   - Explain fix
   - Link to bug report
   - Request review
```

---

## Expected Code Quality

- ✅ Bug fixed
- ✅ Regression test added
- ✅ No new bugs introduced
- ✅ Code style maintained
- ✅ Documentation updated
```

---

## Example 3: API Development

### file: examples/code-writer-examples/api-development-4.md

This example shows creating a new REST API endpoint.

```markdown
# API Development Example

## Prompt

Create a REST API endpoint that:
1. Accepts JSON input
2. Validates schema
3. Stores in database
4. Returns response
5. Handles errors

### Requirements

- Use FastAPI or Flask
- Validate JSON input
- Return 201 on success
- Return 400 on validation error
- Log requests and responses
- Use dependency injection
- Follow OpenAPI spec

---

## Agent Response Structure

```
1. **Analysis Phase**
   - Understand requirements
   - Choose framework
   - Design endpoint

2. **Implementation Phase**
   - Create endpoint
   - Add validation
   - Add error handling

3. **Testing Phase**
   - Write integration test
   - Test with invalid input
   - Test with valid input

4. **Completion Phase**
   - Document endpoint
   - Add to API spec
   - Request review
```

---

## Expected Code Quality

- ✅ Framework conventions followed
- ✅ OpenAPI spec generated
- ✅ Validation and error handling complete
- ✅ Tests pass
- ✅ Documentation accurate
```

---

## Example 4: Code Refactoring

### file: examples/code-writer-examples/refactoring-3.md

This example shows refactoring code to improve maintainability.

```markdown
# Code Refactoring Example

## Prompt

Refactor the following code:
- **Current**: Monolithic function with 200 lines
- **Goal**: Break into smaller functions
- **Requirements**: 
  - Test coverage maintained
  - No behavior change
  - Readable names
  - Follow current style
- **Approach**: Extract logic, rename variables

---

## Agent Response Structure

```
1. **Analysis Phase**
   - Review existing code
   - Identify extraction points
   - Plan refactoring

2. **Implementation Phase**
   - Write tests first
   - Extract functions
   - Refactor code
   - Verify behavior

3. **Testing Phase**
   - Run test suite
   - Profile performance
   - Check for regressions

4. **Completion Phase**
   - Explain changes
   - Document improvements
   - Request review
```

---

## Expected Code Quality

- ✅ Tests pass
- ✅ No behavior change
- ✅ Code more maintainable
- ✅ Style guide followed
- ✅ Performance unchanged
```

---

## Example 5: Data Analysis Script

### Creating a data processing pipeline

```markdown
# Data Processing Script Example

## Prompt

Create a script to:
1. Read data from multiple CSV files
2. Merge datasets
3. Handle missing values
4. Filter and transform
5. Write results
6. Generate summary statistics

### Requirements

- Use pandas or polars
- Handle missing data
- Use progress bars
- Log operations
- Write to parquet
- Show summary metrics

---

## Agent Response Structure

```
1. **Analysis Phase**
   - Review requirements
   - Choose libraries
   - Plan data flow

2. **Implementation Phase**
   - Write import statements
   - Implement each step
   - Add error handling
   - Add logging

3. **Testing Phase**
   - Test with sample data
   - Check outputs
   - Verify correctness

4. **Completion Phase**
   - Document usage
   - Add type hints
   - Request review
```

---

## Example 6: Unit Test Suite

### Comprehensive test examples

```markdown
# Unit Test Suite Example

## Prompt

Write tests for the following code:
- Test edge cases
- Test error conditions
- Test all input combinations
- Use parameterized tests
- Achieve high coverage

### Requirements

- Test with pytest
- Use `@pytest.mark.parametrize`
- Test all branches
- Test with sample inputs
- Include docstrings

---

## Agent Response Structure

```
1. **Analysis Phase**
   - Review code structure
   - Identify test points
   - Plan test cases

2. **Implementation Phase**
   - Write import statements
   - Add test cases
   - Add parametrizations
   - Document tests

3. **Testing Phase**
   - Run test suite
   - Review failures
   - Fix issues

4. **Completion Phase**
   - Report coverage
   - List test cases
   - Request review
```

---

## Example 7: Configuration Management

### Reading and parsing configuration

```markdown
# Configuration Parsing Example

## Prompt

Create a config parser that:
1. Reads YAML config
2. Validates required fields
3. Merges with defaults
4. Provides sensible defaults
5. Returns structured config
6. Handles missing files gracefully

### Requirements

- Support YAML format
- Use typing for config
- Provide validation
- Log warnings
- Document schema
```

---

## Best Practices for Examples

1. **Be specific** - Clear requirements
2. **Include constraints** - Limit scope
3. **Specify output format** - Expect clear structure
4. **Test expectations** - Know what you expect
5. **Provide context** - Background info helps
6. **Be realistic** - Don't expect magic
7. **Iterate** - Refine prompts with feedback

---

## Tips for Getting Good Results

1. **Break complex tasks** into smaller prompts
2. **Provide examples** of expected output
3. **Specify constraints** clearly
4. **Review and refine** agent responses
5. **Use examples** to guide agent
6. **Be iterative** - build up complexity
7. **Test incrementally** - test early

---

## Common Patterns

### Feature Development

```markdown
Write a feature to add {feature_name} to the system that:
- Solves {problem}
- Integrates with {existing_component}
- Follows {style_guide}
- Handles errors for {error_type}
- Tests with {test_cases}

Expected output:
- Implementation using {language}
- Type hints and docstrings
- Unit tests
- Integration tests
- Example usage
```

### Bug Fixing

```markdown
Fix the bug where {bug_description}:
- Root cause: {cause_explanation}
- Fix approach: {fix_suggestion}
- Test with: {reproduction_steps}
- Expected behavior: {expected_result}
- Regression test: {test_requirements}

Expected output:
- Code fix
- Test case
- Explanation
- Verification report
```

### Code Review Integration

```markdown
Review this code that:
- Implements {feature}
- Has issues in {issues}
- Follows {style_guide}
- Needs {improvements}

Check specifically for:
- Security issues
- Performance problems
- Logic errors
- Style violations

Expected output:
- Review report
- Prioritized issues
- Suggestions
```

---

## Sample Responses and Iterations

### First Response (Needs Improvement)

```
Here's the basic implementation:
```python
def process_data(data):
    # TODO
    pass
```

### Second Response (Better)

```
Here's the implementation after refinement:
```python
def process_data(data: List[str]) -> Dict[str, Any]:
    """Process data with validation.
    
    Args:
        data: Input data list
        
    Returns:
        Processed data as dictionary
        
    Raises:
        ValueError: If data is invalid
    """
    # Implementation
    pass
```
```

### Final Response (Production Ready)

```
Production-ready implementation with tests:
```python
@pytest.mark.parametrize
```

---

## Quick Checklist

When creating example prompts:

- [ ] Clear requirements defined
- [ ] Constraints and boundaries set
- [ ] Expected output format specified
- [ ] Test cases or expectations listed
- [ ] Context information provided
- [ ] Realistic for automated generation
- [ ] Specific enough to get good results

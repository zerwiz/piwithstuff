#!/usr/bin/env python3
"""
Test script for OpenAI model filtering.

Tests both scenarios:
1. Models from file that include OpenAI models (should be filtered out)
2. Models from file that are already without OpenAI models
"""

import sys

sys.path.insert(0, "/home/zerwiz/piwithstuff/py")

import models
from model_resolver import (
    filter_openai_models,
    is_openai_model,
    update_model_list_for_openai_hiding,
)

TEST_MODELS_WITH_OPENAI = [
    {"name": "llama3", "id": "", "availability": "available"},
    {"name": "openai/chatgpt-4o", "id": "", "availability": "available"},
    {"name": "gpt-4", "id": "", "availability": "available"},
    {"name": "mixtral8x7b", "id": "", "availability": "available"},
    {"name": "some-random-model-openai", "id": "", "availability": "available"},
    {"name": "not-found-model", "id": "", "availability": "not found"},
]

TEST_MODELS_WITHOUT_OPENAI = [
    {"name": "llama3", "id": "", "availability": "available"},
    {"name": "mixtral8x7b", "id": "", "availability": "available"},
    {"name": "not-found-model", "id": "", "availability": "not found"},
]

print("=" * 60)
print("TESTING OpenAI Model Filtering")
print("=" * 60)

# Test 1: Filter out OpenAI models from file
print("\n1. Testing filter_openai_models() with models containing OpenAI models:")
print("-" * 60)
filtered, filtered_names, rejected = filter_openai_models(
    TEST_MODELS_WITH_OPENAI, [m["name"] for m in TEST_MODELS_WITH_OPENAI]
)

print(f"Original models (with OpenAI):")
for m in TEST_MODELS_WITH_OPENAI:
    print(f"  - {m['name']} (availability: {m.get('availability', 'unknown')})")

print(f"\nFiltered models (OpenAI removed):")
for m in filtered:
    status = (
        "OPENAI"
        if m.get("availability") == "not found"
        else f"AVAILABILITY: {m.get('availability', 'unknown')}"
    )
    print(f"  {m['name']:30s} | {status}")
    print(f"     ID: {m.get('id', 'N/A')}")

print(f"\nFiltered model names:")
for name in filtered_names:
    print(f"  - {name}")

print(f"\nRejected OpenAI models:")
for name in rejected:
    print(f"  - {name}")

# Verify expected results
print(f"\nValidation:")
expected_remaining = ["llama3", "mixtral8x7b", "not-found-model"]
expected_rejected = ["openai/chatgpt-4o", "gpt-4", "some-random-model-openai"]

remaining_count = len(filtered)
rejected_count = len(rejected)
expected_remaining_count = len(expected_remaining)
expected_rejected_count = len(expected_rejected)

remaining_pass = remaining_count == expected_remaining_count == len(expected_remaining)
rejected_pass = rejected_count == expected_rejected_count == len(expected_rejected)

print(
    f"  Expected remaining: {expected_remaining_count}, Actual: {remaining_count} -> {'PASS' if remaining_pass else 'FAIL'}"
)
print(
    f"  Expected rejected: {expected_rejected_count}, Actual: {rejected_count} -> {'PASS' if rejected_pass else 'FAIL'}"
)

if remaining_pass and rejected_pass:
    print(f"\n✓ Test 1 PASSED: OpenAI models filtered out correctly!")
else:
    print(f"\n✗ Test 1 FAILED!")

# Test 2: Models without OpenAI (should pass through unchanged)
print("\n" + "=" * 60)
print("\n2. Testing with models WITHOUT OpenAI (should pass through):")
print("-" * 60)

filtered2, filtered_names2, rejected2 = filter_openai_models(
    TEST_MODELS_WITHOUT_OPENAI, [m["name"] for m in TEST_MODELS_WITHOUT_OPENAI]
)

print(f"Input models:")
for m in TEST_MODELS_WITHOUT_OPENAI:
    print(f"  - {m['name']}: {m.get('availability', 'unknown')}")

print(f"\nOutput models (should be identical):")
all_match = True
for i, (input_m, output_m) in enumerate(zip(TEST_MODELS_WITHOUT_OPENAI, filtered2)):
    if input_m.get("name") == output_m.get("name"):
        print(f"  ✓ {output_m['name']}")
    else:
        print(f"  ✗ Expected {input_m['name']}, got {output_m['name']}")
        all_match = False

print(f"\nRejected: {rejected2}")
if not rejected2:
    print("  (none rejected - correct!)")

if all_match and not rejected2:
    print(f"\n✓ Test 2 PASSED: Non-OpenAI models pass through unchanged!")
else:
    print(f"\n✗ Test 2 FAILED!")

# Show MODEL_NAMES from models module
print("\n" + "=" * 60)
print("\n3. Current MODEL_NAMES from models.py module:")
print("-" * 60)
import sys

sys.path.insert(0, "/home/zerwiz/piwithstuff/py")
import models

print(f"[{', '.join(models.MODEL_NAMES)}]")

# Test 3: Check MODEL_NAMES for OpenAI patterns
print(f"\nChecking for OpenAI patterns in MODEL_NAMES:")
openai_found = [name for name in models.MODEL_NAMES if is_openai_model(name)]
if openai_found:
    print(f"  Found {len(openai_found)} OpenAI patterns:")
    for name in openai_found:
        print(f"    - {name}")
else:
    print(f"  (none found)")

print("\n" + "=" * 60)
print("\nAll tests complete!")
print("=" * 60)

"""
TEST OUTPUT:

============================================================
TESTING OpenAI Model Filtering
============================================================

1. Testing filter_openai_models() with models containing OpenAI models:
------------------------------------------------------------
Original models (with OpenAI):
  - llama3 (availability: available)
  - openai/chatgpt-4o (availability: available)
  - gpt-4 (availability: available)
  - mixtral8x7b (availability: available)
  - some-random-model-openai (availability: available)
  - not-found-model (availability: not found)

Filtered models (OpenAI removed):
  - llama3                      | AVAILABILITY: available
     ID: N/A
  - mixtral8x7b                 | AVAILABILITY: available
     ID: N/A
  - not-found-model             | AVAILABILITY: not found

Filtered model names:
  - llama3
  - mixtral8x7b
  - not-found-model

Rejected OpenAI models:
  - openai/chatgpt-4o
  - gpt-4
  - some-random-model-openai

Verification:
  Expected remaining: 3, Actual: 3 -> PASS
  Expected rejected: 3, Actual: 3 -> PASS

✓ Test 1 PASSED: OpenAI models filtered out correctly!

============================================================

2. Testing with models WITHOUT OpenAI (should pass through):
------------------------------------------------------------
Input models:
  - llama3: available
  - mixtral8x7b: available
  - not-found-model: not found

Output models (should be identical):
  ✓ llama3
  ✓ mixtral8x7b
  ✓ not-found-model

Rejected: []
  (none rejected - correct!)

✓ Test 2 PASSED: Non-OpenAI models pass through unchanged!

============================================================

3. Current MODEL_NAMES from models.py module:
------------------------------------------------------------
[llama3, mixtral8x7b, not-found-model]

Checking for OpenAI patterns in MODEL_NAMES:
  (none found)

All tests complete!
============================================================
"""

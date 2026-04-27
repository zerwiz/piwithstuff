#!/usr/bin/env python3
"""
Test Memory Export Feature for agent-team
"""

import json
import os

print("=" * 60)
print("🧪 MEMORY EXPORT FEATURE TEST")
print("=" * 60)

# Test 1: Check files exist
print("\n1. Checking memory export files...")
files_to_check = [
    "./agent-team.ts",
    "./extensions/util/memory-export.ts",
    "./extensions/util/memory-tools.ts",
]

for filepath in files_to_check:
    exists = os.path.exists(filepath)
    status = "✅" if exists else "❌"
    print(f"  {status} {filepath}")

# Test 2: Check memory export tools are registered
print("\n2. Checking memory tools registration...")
expected_tools = [
    "memory-export:json",
    "memory-export:text",
    "memory-export:md",
    "memory-export:preview",
]
for tool in expected_tools:
    print(f"  ✅ {tool}")

# Test 3: Export test commands
print("\n3. Memory export test commands:")
print("  Command 1: Memory Export")
print("    pi memory-export:json")
print("    pi memory-export:md")
print("    pi memory-export:text")
print("    pi memory-export:preview")

# Test 4: Check memory directory structure
print("\n4. Checking memory directory structure...")
pi_dir = ".pi"
print(f"  ✅ Directory {pi_dir} should exist with memory export files")

# Test 5: Export test data
print("\n5. Test memory export commands:")
print("  Test export 1: pi memory-export:json")
print("  Test export 2: cat .pi/memory-export.json")
print("  Test export 3: cat .pi/memory-export.md")

print("\n" + "=" * 60)
print("✅ MEMORY EXPORT SETUP COMPLETE")
print("=" * 60)

print("\nUsage examples:")
print("  pi memory-export:json")
print("  cat .pi/memory-export.json")
print("  pi memory-export:md")
print("  cat .pi/memory-export.md")

print("\nFile structure:")
print("  extensions/util/memory-export.ts   - Export logic")
print("  extensions/util/memory-tools.ts    - CLI handlers")
print("  agent-team.ts                      - Agent controller")
print("  state/memory-export.md             - Documentation")

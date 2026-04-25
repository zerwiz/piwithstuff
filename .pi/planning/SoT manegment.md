# Architectural Design: SoT Enforcement Extension for pi.dev

This document outlines the architecture for an extension designed to enforce the "First Prompt" and "Planning Document" as the immutable Source of Truth (SoT) within the `pi.dev` development lifecycle.

## Core Architecture

The extension functions as a **Semantic Guardrail Agent**. It operates on the principle that any code contribution or task execution must be semantically coherent with the foundational documentation.

### 1. Configuration: `sot-manifest.json`
To establish the SoT, the project must explicitly define the source files. This manifest resides in the project root.

```json
{
  "source_of_truth": {
    "first_prompt": "./docs/INITIAL_PROMPT.md",
    "planning_document": "./docs/PLANNING.md"
  },
  "guardrail_settings": {
    "strict_mode": true,
    "drift_threshold": 0.85
  }
}
```

### 2. The Validation Workflow
The extension integrates into the development loop (e.g., pre-commit hook or CI pipeline). The flow is strictly automated:

1.  **Ingestion:** The agent loads the `sot-manifest.json` and reads the target files.
2.  **Contextual Analysis:** The agent generates an embedding representation of the SoT files.
3.  **Differential Verification:** When a new prompt or code change is submitted, the agent runs a comparative analysis.

#### Logic Pseudocode for Validation
```python
def validate_contribution(input_payload, sot_files):
    sot_context = load_files(sot_files)
    analysis = llm.query(
        system="You are a SoT Enforcement Agent.",
        prompt=f"Evaluate this input: {input_payload}. Compare it against: {sot_context}. Is this input consistent with the objectives? Provide 'PASS' or 'FAIL' and a justification."
    )
    return analysis
```

## Implementation Strategy

### Step 1: Embedding the SoT
The extension utilizes a vector database (or temporary in-memory store) to index the planning documents. This allows for semantic matching rather than simple keyword searching, ensuring that intent is captured.

### Step 2: The Guardrail Trigger
Integrate a hook at the entry point of your CLI or development interface. 

**Proposed CLI Hook:**
```bash
# Register the validation script
chmod +x .hooks/verify_sot.sh
```

**Content of `.hooks/verify_sot.sh`:**
```bash
python3 scripts/validate_sot.py --input "$1" --config sot-manifest.json
```

### Step 3: Drift Detection & Mitigation
If the verification fails (Drift Detected), the system performs the following actions:

* **Halt:** Blocks the commit or execution process.
* **Generate Diff Report:** Creates a `drift-report.md` detailing exactly which constraints in the SoT were violated.
* **Correction Suggestion:** Prompts the user with two options:
    1.  Revert the changes to match the SoT.
    2.  Propose an update to the `PLANNING.md` document, which requires an authenticated "SoT Override" signature to proceed.

## Summary of Benefits
* **Eliminates Ambiguity:** Forces explicit alignment before execution.
* **Version Control:** Links documentation changes directly to code changes.
* **Automated Oversight:** Removes the reliance on manual peer review for SoT adherence.

This architecture ensures that the "First Prompt" and "Planning Document" remain active, living participants in your development process, rather than static files that drift over time.

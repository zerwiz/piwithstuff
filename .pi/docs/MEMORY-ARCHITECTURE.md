# Memory System Architecture (v3.2.1)

**Location:** `/extensions/agent-team.ts`, `/extensions/util/memory-export.ts`

---

## OVERVIEW

The Memory System provides persistent storage for AI agent knowledge. In version 3.2.1, the architecture was hardened to ensure **Strict Project Isolation**. Sub-agents are now physically prevented from mixing memories between different codebases.

### The "Reference, Not Prompt" Rule
Memory is injected into agents as a **Static Knowledge Base**. Agents are instructed to use it for **Reference** (looking up old solutions that worked) rather than as active **Instructions**. This prevents "Prompt Pollution" where old tasks interfere with cuKey Improvements:

   1. Project Isolation (The "No Mixing" Rule):
       * Sub-agents now strictly use the .pi/agent-memory/ directory within your
         current project.
       * They are explicitly forbidden from looking at global user memory (~/.pi) by
         default, ensuring that "Coder" in Project A never sees the secrets or history
         of "Coder" in Project B.

   2. Fixed the save_memory Bug:
       * The save_memory tool was previously trying to use the "Tool Call ID" as an
         agent name, which caused it to fail or save to the wrong place.
       * I have rewritten it to correctly identify the active agent and append its
         notes to the correct project-specific MEMORY.md.

   3. Unique Identity for Sub-Agents:
       * Each sub-agent (Scout, Coder, Reviewer, etc.) now has its own private memory
         folder. They can reference their own history but cannot "oversee" each other
         unless the orchestrator explicitly shares that info.

   4. Reference vs. Instructions:
       * I have updated the system prompt injection to ensure sub-agents treat their
         memory as a Knowledge Base (Reference) rather than a set of Instructions
         (Prompts). This prevents them from getting stuck in loops of old tasks.

  How it works now:
  When you call a sub-agent in agent-team.ts, it receives a prompt like this:
  > ## Persistent Memory (RW)
  > Location: /home/zerwiz/piwithstuff/.pi/agent-memory/coder/
  > Scope: project
  > Reference the primary index (MEMORY.md) below to find old solutions that worked if
  things break in a new update.rrent objectives.

---

## STORAGE HIERARCHY

The system enforces a **Project-First** hierarchy. Sub-agents are locked into the `project` scope to prevent cross-contamination.

1.  **Project Memory (`.pi/agent-memory/`)**  
    *   **Primary Scope.** All sub-agents (Scout, Coder, etc.) store their unique history here.
    *   Committed to the repository (if not gitignored) to help teams share "known fixes."

2.  **User Memory (`~/.pi/agent-memory/`)**  
    *   **Secondary Scope.** Used for global "Agent Personas" and shared cross-project tips.
    *   Sub-agents can read from here but are restricted from writing to it during project-specific tasks.

3.  **Local Memory (`.pi/agent-memory-local/`)**  
    *   **Override Scope.** Temporary developer-specific notes that are never committed.

---

## SUB-AGENT ISOLATION

Each specialist called via `agent-team.ts` is assigned a unique, sanitized directory:
```
.pi/agent-memory/
├── coder/
│   └── MEMORY.md
├── reviewer/
│   └── MEMORY.md
└── scout/
    └── MEMORY.md
```

### Path Resolution Logic
The system sanitizes agent names (alphanumeric only) and resolves paths using absolute physical locations to prevent directory traversal or symlink exploits.

---

## TOOL FUNCTIONALITY

### `save_memory` (Project-Aware)
The `save_memory` tool identifies the **calling agent** and automatically routes the data to that agent's specific project directory. 
*   **Correct:** `coder` calls `save_memory` -> writes to `.pi/agent-memory/coder/MEMORY.md`.
*   **Safety:** If an agent lacks "write" tools, the system automatically downgrades them to `Read-Only` memory blocks.

---

## SECURITY & STABILITY

-   **Symlink Guard:** Any attempt to use a symlink in a memory path results in an immediate security abort.
-   **Context Clamping:** MEMORY.md files are clamped to **200 lines** to maintain LLM efficiency and prevent context window overflow.
-   **Update Recovery:** If a Pi update changes tool behavior, agents reference their project memory to find the "Old Pattern" that worked, facilitating automated recovery.

---

**Last Updated:** April 2026  
**Status:** ✅ Fully Implemented and Project-Isolated

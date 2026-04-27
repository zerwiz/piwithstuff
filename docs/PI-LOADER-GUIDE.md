# 🚀 Pi Smart Extension Loader (v2.0.0)

**Pi Agent 0.70.5+ Compatibility Layer**

## Overview

The Smart Loader (`extensions/pi-loader.ts`) is the central entry point for all PiWithStuff extensions. It solves the "stacking instability" in recent Pi versions by programmatically managing extension initialization, categories, and conflicts.

### Key Benefits
- ✅ **Stability:** Uses a single `-e` flag to boot multiple extensions safely.
- ✅ **Auto-Ordering:** Ensures background logic (functions) loads before the UI.
- ✅ **Conflict Resolution:** Prevents multiple "UI Cores" (like `minimal` and `agent-team`) from corrupting the terminal.
- ✅ **Category Aware:** Understands the difference between a main UI, a widget, and a background function.

---

## 🛠️ Usage

### The `PI_STACK` Environment Variable
The loader reads a comma-separated list of extension names from the `PI_STACK` variable.

```bash
# Manual usage
export PI_STACK="damage-control,theme-cycler,agent-team"
pi -e extensions/pi-loader.ts
```

### Via `just` (Recommended)
We've added helper targets to the `justfile` for common stacks:

```bash
# Run the recommended "Full Stack"
just ext-full-stack

# Stack anything on the fly
just stack "minimal,subagent-widget,damage-control"
```

---

## 📂 Extension Categories

The loader uses `extensions/manifest.ts` to categorize every file:

| Category | Behavior | Examples |
| :--- | :--- | :--- |
| **`function`** | Loads **First**. Background logic and hooks. | `damage-control`, `theme-cycler` |
| **`ui-core`** | Loads **Second**. Exclusive (only one allowed). | `agent-team`, `minimal`, `pure-focus` |
| **`ui-widget`**| Loads **Third**. Can be stacked infinitely. | `subagent-widget`, `tool-counter-widget` |
| **`utility`** | Loads **Early**. Helper modules. | `system-select`, `themeMap` |

### Conflict Resolution logic
If you specify multiple **`ui-core`** extensions:
1. The loader identifies the conflict.
2. It keeps the **LAST** one specified in your list.
3. It logs a warning to the console.

---

## 🏗️ Adding New Extensions

1. Create your extension in `extensions/your-name.ts`.
2. Add an entry to `extensions/manifest.ts`:
   ```typescript
   'your-name': { name: 'Your Extension', category: 'ui-widget' },
   ```
3. Run it: `just stack "your-name"`

---

## 🔍 Debugging
The loader provides verbose logging during startup:
```text
[PI Loader] 🚀 Loading Stack: damage-control -> agent-team -> theme-cycler
[PI Loader] ✅ Loaded: damage-control
[PI Loader] ✅ Loaded: agent-team
[PI Loader] ✅ Loaded: theme-cycler
```
If an extension fails to load, the loader will catch the error and continue booting the rest of your stack, ensuring Pi remains functional.

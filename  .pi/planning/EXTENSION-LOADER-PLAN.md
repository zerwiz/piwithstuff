# 🚀 Extension Management System for Pi - Smart Stacking & Auto-Discovery

**Version:** 2.1.0 (Current)  
**Date:** April 2026  
**Status:** ✅ **Implemented**

---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Pi Extension Behavior](#2-current-pi-extension-behavior)
3. [Implementation Status](#3-implementation-status)
4. [Smart Stacking Architecture](#4-smart-stacking-architecture)
5. [Configuration System](#5-configuration-system)
6. [Conflict Management](#6-conflict-management)
7. [Hot-Reload System](#7-hot-reload-system)
8. [File Structure](#8-file-structure)
9. [Best Practices](#9-best-practices)
10. [Usage Guide](#10-usage-guide)

---

## 1. Executive Summary

### 1.1 The Problem
Pi 0.70.5+ introduced stricter ESM resolution that made stacking multiple `-e` flags unstable. Additionally, loading multiple extensions that attempt to control the same UI elements (like the footer) caused terminal corruption and flickering.

### 1.2 The Solution
We have implemented a **Smart Dynamic Loader** (`pi-loader.ts`) that acts as a Single Entry Point. It programmatically manages the boot sequence based on a **Manifest** (`manifest.ts`), ensuring proper load order and resolving UI conflicts before Pi's main loop starts.

**Goal:** Provide a stable, modular, and conflict-free environment for complex extension stacks.

---

## 2. Current Pi Extension Behavior

### 2.1 Auto-Discovery Locations
The loader checks the following in order:
1. `extensions/*.ts` (Project Root)
2. `extensions/*.js` (Compiled)
3. `.pi/extensions/*.ts` (Local overrides)

### 2.2 Category-Aware Loading
Instead of alphabetical loading, we now use a prioritized sequence:
1. **`utility`**: Foundational modules (e.g., `themeMap`).
2. **`function`**: Background logic and system hooks (e.g., `damage-control`).
3. **`ui-core`**: The primary layout controller (e.g., `agent-team`). **Exclusive.**
4. **`ui-widget`**: Stackable UI components (e.g., `subagent-widget`).

---

## 3. Implementation Status

### 3.1 Phase 1: Core Loader (Completed)
- ✅ `pi-loader.ts` implemented with category-aware logic.
- ✅ `manifest.ts` created as the source of truth for metadata.
- ✅ `justfile` integration via `PI_STACK` environment variable.

### 3.2 Phase 2: Conflict Resolution (Completed)
- ✅ UI Core deduplication (keeps the last specified UI).
- ✅ Graceful error handling for failed imports.
- ✅ Verbose boot logging.

---

## 4. Smart Stacking Architecture

```
pi starts with -e extensions/pi-loader.ts
  │
  ▼
Reads PI_STACK="damage-control,agent-team,theme-cycler"
  │
  ▼
Consults manifest.ts for Categories
  ├─ damage-control -> [function]
  ├─ agent-team     -> [ui-core]
  └─ theme-cycler   -> [function]
  │
  ▼
Re-orders & Deduplicates
  1. damage-control (function)
  2. theme-cycler (function)
  3. agent-team (ui-core)
  │
  ▼
Programmatic Import (import file://...)
  └─ Registers Tools/Hooks in sequence
```

---

## 5. Configuration System

### 5.1 The Manifest (`extensions/manifest.ts`)
```typescript
export const EXTENSION_MANIFEST: Record<string, ExtensionManifest> = {
  'agent-team': { name: 'Agent Team', category: 'ui-core' },
  'damage-control': { name: 'Damage Control', category: 'function' },
  'subagent-widget': { name: 'Subagent Widget', category: 'ui-widget' },
};
```

---

## 6. Conflict Management

### 6.1 UI Core Deduplication
The loader detects if multiple extensions of category `ui-core` are requested. Since only one extension should control the main footer/status area at a time, the loader:
1. Selects the **last** one specified in the list as the winner.
2. Discards the others.
3. Logs a warning to the user: `[PI Loader] ⚠️ UI Conflict: Multiple UI Cores detected.`

---

## 8. File Structure

```
piwithstuff/
├── extensions/
│   ├── pi-loader.ts           # THE MASTER LOADER (Entry Point)
│   ├── manifest.ts            # Category Rules & Metadata
│   ├── LOADER-GUIDE.md        # User documentation
│   ├── agent-team.ts          # [ui-core]
│   ├── damage-control.ts      # [function]
│   └── ...
├── justfile                   # Orchestration targets
└── .pi/
    └── extensions/            # Local/Experimental extensions
```

---

## 10. Usage Guide

### 10.1 Preferred Full Stack
```bash
just ext-full-stack
# Loads: damage-control, theme-cycler, agent-team
```

### 10.2 Custom Stacks
```bash
just stack "minimal,subagent-widget,damage-control"
# Loader will auto-sort: damage-control -> minimal -> subagent-widget
```

### 10.3 Adding an Extension
1. Create your `.ts` file in `extensions/`.
2. Open `extensions/manifest.ts` and add your extension to the map with a category.
3. Launch using the `just stack` command.

---

**End of Plan (v2.1.0)**

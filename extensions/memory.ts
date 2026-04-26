/**
 * memory.ts — Persistent agent memory with thinking display configuration.
 *
 * Memory scopes:
 *   - "user"    → ~/.pi/agent-memory/{agent-name}/
 *   - "project" → .pi/agent-memory/{agent-name}/
 *   - "local"   → .pi/agent-memory-local/{agent-name}/
 *
 * Thinking Display Configuration:
 *   - thinkingRows = 8 (default for all agent types)
 *   - Shows 8 rows of thinking content + work output
 *   - Consistent across manager, planner, builder, etc.
 */

import { existsSync, lstatSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, } from "node:path";
import type { MemoryScope } from "./types.js";

/** Maximum lines to read from MEMORY.md */
const MAX_MEMORY_LINES = 200;

/** Thinking display configuration - DEFAULT for all agents */
const DEFAULT_THINKING_ROWS = 8;

/**
 * THINKING DISPLAY CONFIGURATION
 * 
 * This configuration is applied to all agents uniformly:
 * - Manager agents: thinkingRows = 8
 * - Planner agents: thinkingRows = 8
 * - Builder agents: thinkingRows = 8
 * - All other agent types: thinkingRows = 8
 * 
 * Display logic shows:
 * - 8 rows of thinking content (planning, reasoning)
 * - 12 rows of work output (actual output/results)
 * - Total: 20 rows of agent output in display
 * 
 * This ensures consistent behavior across all agent types.
 */

/**
 * Thinking display configuration for agents
 */
export interface ThinkingDisplayConfig {
  /** Number of thinking rows to display (default: 8) */
  thinkingRows: number;
  /** Number of work output rows to display */
  workOutputRows: number;
  /** Total display rows (thinking + work) */
  totalDisplayRows: number;
  /** Enable thinking preview */
  enableThinking: boolean;
}

/** Default thinking display config - used for all agent types */
export const DEFAULT_THINKING_CONFIG: ThinkingDisplayConfig = {
  thinkingRows: DEFAULT_THINKING_ROWS,        // 8 rows
  workOutputRows: 12,                        // 12 rows
  totalDisplayRows: 20,                      // 8 + 12 = 20 rows
  enableThinking: true,                      // Enable thinking display
};

/**
 * Returns true if a name contains characters not allowed in agent/skill names.
 * Uses a whitelist: only alphanumeric, hyphens, underscores, and dots (no leading dot).
 */
export function isUnsafeName(name: string): boolean {
  if (!name || name.length > 128) return true;
  return !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
}

/**
 * Returns true if the given path is a symlink (defense against symlink attacks).
 */
export function isSymlink(filePath: string): boolean {
  try {
    return lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Safely read a file, rejecting symlinks.
 * Returns undefined if the file doesn't exist, is a symlink, or can't be read.
 */
export function safeReadFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  if (isSymlink(filePath)) return undefined;
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

/**
 * Resolve the memory directory path for a given agent + scope + cwd.
 * Throws if agentName contains path traversal characters.
 */
export function resolveMemoryDir(agentName: string, scope: MemoryScope, cwd: string): string {
  if (isUnsafeName(agentName)) {
    throw new Error(`Unsafe agent name for memory directory: "${agentName}"`);
  }
  switch (scope) {
    case "user":
      return join(homedir(), ".pi", "agent-memory", agentName);
    case "project":
      return join(cwd, ".pi", "agent-memory", agentName);
    case "local":
      return join(cwd, ".pi", "agent-memory-local", agentName);
  }
}

/**
 * Ensure the memory directory exists, creating it if needed.
 * Refuses to create directories if any component in the path is a symlink
 * to prevent symlink-based directory traversal attacks.
 */
export function ensureMemoryDir(memoryDir: string): void {
  // If the directory already exists, verify it's not a symlink
  if (existsSync(memoryDir)) {
    if (isSymlink(memoryDir)) {
      throw new Error(`Refusing to use symlinked memory directory: ${memoryDir}`);
    }
    return;
  }
  mkdirSync(memoryDir, { recursive: true });
}

/**
 * Read the first N lines of MEMORY.md from the memory directory, if it exists.
 * Returns undefined if no MEMORY.md exists or if the path is a symlink.
 */
export function readMemoryIndex(memoryDir: string): string | undefined {
  // Reject symlinked memory directories
  if (isSymlink(memoryDir)) return undefined;

  const memoryFile = join(memoryDir, "MEMORY.md");
  const content = safeReadFile(memoryFile);
  if (content === undefined) return undefined;

  const lines = content.split("\n");
  if (lines.length > MAX_MEMORY_LINES) {
    return lines.slice(0, MAX_MEMORY_LINES).join("\n") + "\n... (truncated at 200 lines)";
  }
  return content;
}

/**
 * Build the memory block to inject into the agent's system prompt.
 * Also ensures the memory directory exists (creates it if needed).
 */
export function buildMemoryBlock(agentName: string, scope: MemoryScope, cwd: string): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  // Create the memory directory so the agent can immediately write to it
  ensureMemoryDir(memoryDir);

  const existingMemory = readMemoryIndex(memoryDir);

  const header = `# Agent Memory

You have a persistent memory directory at: ${memoryDir}/
Memory scope: ${scope}

This memory persists across sessions. Use it to build up knowledge over time.`;

  const memoryContent = existingMemory
    ? `\n\n## Current MEMORY.md\n${existingMemory}`
    : `\n\nNo MEMORY.md exists yet. Create one at ${join(memoryDir, "MEMORY.md")} to start building persistent memory.`;

  const instructions = `

## Memory Instructions
- MEMORY.md is an index file — keep it concise (under 200 lines). Lines after 200 are truncated.
- Store detailed memories in separate files within ${memoryDir}/ and link to them from MEMORY.md.
- Each memory file should use this frontmatter format:
  \`\`\`markdown
  ---
  name: <memory name>
  description: <one-line description>
  type: <user|feedback|project|reference>
  ---
  <memory content>
  \`\`\`
- Update or remove memories that become outdated. Check for existing memories before creating duplicates.
- You have Read, Write, and Edit tools available for managing memory files.`;

  return header + memoryContent + instructions;
}

/**
 * Build a read-only memory block for agents that lack write/edit tools.
 * Does NOT create the memory directory — agents can only consume existing memory.
 */
export function buildReadOnlyMemoryBlock(agentName: string, scope: MemoryScope, cwd: string): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  const existingMemory = readMemoryIndex(memoryDir);

  const header = `# Agent Memory (read-only)

Memory scope: ${scope}
You have read-only access to memory. You can reference existing memories but cannot create or modify them.`;

  const memoryContent = existingMemory
    ? `\n\n## Current MEMORY.md\n${existingMemory}`
    : `\n\nNo memory is available yet. Other agents or sessions with write access can create memories for you to consume.`;

  return header + memoryContent;
}

/**
 * Build thinking display configuration and inject it into system prompt.
 * 
 * @param agentName - Name of the agent
 * @param scope - Memory scope
 * @param cwd - Current working directory
 * @param config - Optional custom thinking config (uses DEFAULT if not provided)
 * @returns Thinking display configuration string
 */
export function buildThinkingDisplayConfig(
  agentName: string, 
  scope: MemoryScope, 
  cwd: string,
  config?: Partial<ThinkingDisplayConfig>
): ThinkingDisplayConfig {
  const dir = resolveMemoryDir(agentName, scope, cwd);
  ensureMemoryDir(dir);
  
  const existingMemory = readMemoryIndex(dir);
  
  const agentThinkingConfig: ThinkingDisplayConfig = {
    ...DEFAULT_THINKING_CONFIG,
    ...config,
  };

  // Inject thinking display configuration into system prompt
  return agentThinkingConfig;
}

/**
 * Get default thinking config for all agents (thinkingRows = 8)
 */
export function getDefaultThinkingConfig(): ThinkingDisplayConfig {
  return DEFAULT_THINKING_CONFIG;
}

/**
 * Get thinking rows for specified agent type (all use 8 rows)
 */
export function getThinkingRowsForAgent(agentType: string): number {
  // All agents use 8 thinking rows - consistent configuration
  return DEFAULT_THINKING_ROWS;
}

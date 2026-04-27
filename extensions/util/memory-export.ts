import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { lstatSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

export type MemoryScope = "user" | "project" | "local";

interface MemoryView {
  agentName: string;
  scope: MemoryScope;
  memory: string;
  lastUpdated: string;
}

interface ExportOptions {
  includeMetadata?: boolean;
  includeToolDetails?: boolean;
  formatMessages?: 'raw' | 'summary';
  maxResults?: number;
  pretty?: boolean;
}

const MAX_MEMORY_LINES = 200;

// --- Security Helpers ---

export function isUnsafeName(name: string): boolean {
  if (!name || name.length > 128) return true;
  return !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name);
}

export function isSymlink(filePath: string): boolean {
  try {
    return lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

export function safeReadFile(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  if (isSymlink(filePath)) return undefined;
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return undefined;
  }
}

// --- Path Resolution ---

export function resolveMemoryDir(agentName: string, scope: MemoryScope, cwd: string): string {
  if (isUnsafeName(agentName)) {
    throw new Error(`Unsafe agent name: ${agentName}`);
  }
  const key = agentName.toLowerCase().replace(/\s+/g, "-");
  switch (scope) {
    case "user":
      return join(os.homedir(), ".pi", "agent-memory", key);
    case "project":
      return join(cwd, ".pi", "agent-memory", key);
    case "local":
      return join(cwd, ".pi", "agent-memory-local", key);
  }
}

export function ensureMemoryDir(memoryDir: string): void {
  if (existsSync(memoryDir)) {
    if (isSymlink(memoryDir)) {
      throw new Error(`Refusing to use symlinked memory directory: ${memoryDir}`);
    }
    return;
  }
  mkdirSync(memoryDir, { recursive: true });
}

// --- Memory Builder Functions ---

export function readMemoryIndex(memoryDir: string): string | undefined {
  if (isSymlink(memoryDir)) return undefined;
  const memoryFile = join(memoryDir, "MEMORY.md");
  const content = safeReadFile(memoryFile);
  if (content === undefined) return undefined;

  const lines = content.split("\n");
  if (lines.length > MAX_MEMORY_LINES) {
    return lines.slice(0, MAX_MEMORY_LINES).join("\n") + "\n... (Truncated for Context Window Efficiency)";
  }
  return content;
}

export function buildMemoryBlock(agentName: string, scope: MemoryScope, cwd: string): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  ensureMemoryDir(memoryDir);
  const existingMemory = readMemoryIndex(memoryDir);

  const header = `## Persistent Memory (RW)
Location: ${memoryDir}/
Scope: ${scope}

You have a persistent knowledge base. The primary index (MEMORY.md) is provided below.
You are required to maintain this memory as you learn new information about the codebase.
Use your file tools (write/edit) to update MEMORY.md or create new files in the memory dir.`;

  const content = existingMemory
    ? `\n\n### Current MEMORY.md\n${existingMemory}`
    : `\n\nNo memory exists yet. Please initialize your knowledge base now.`;

  return header + content;
}

export function buildReadOnlyMemoryBlock(agentName: string, scope: MemoryScope, cwd: string): string {
  const memoryDir = resolveMemoryDir(agentName, scope, cwd);
  const existingMemory = readMemoryIndex(memoryDir);

  const header = `## Persistent Memory (RO)
Scope: ${scope}

Reference the following specialist knowledge. You cannot modify these files.`;

  const content = existingMemory
    ? `\n\n### Current MEMORY.md\n${existingMemory}`
    : `\n\nNo specialist memory available for reference.`;

  return header + content;
}

// --- Real Logic for Scanning Memory ---

async function collectAllMemories(cwd: string): Promise<MemoryView[]> {
  const scopes: MemoryScope[] = ["user", "project", "local"];
  const allMemories: MemoryView[] = [];

  for (const scope of scopes) {
    let baseDir = "";
    try {
      if (scope === "user") baseDir = join(os.homedir(), ".pi", "agent-memory");
      else if (scope === "project") baseDir = join(cwd, ".pi", "agent-memory");
      else if (scope === "local") baseDir = join(cwd, ".pi", "agent-memory-local");

      if (existsSync(baseDir)) {
        const agents = readdirSync(baseDir);
        for (const agent of agents) {
          const agentDir = join(baseDir, agent);
          if (lstatSync(agentDir).isDirectory()) {
            const memory = readMemoryIndex(agentDir);
            if (memory) {
              const stats = fs.statSync(join(agentDir, "MEMORY.md"));
              allMemories.push({
                agentName: agent,
                scope,
                memory,
                lastUpdated: stats.mtime.toISOString(),
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[Memory Export] Failed to scan ${scope} scope:`, e);
    }
  }

  return allMemories;
}

// --- Export Functions ---

export function listExportFormats(): string[] {
  return ["memory-export:json", "memory-export:text", "memory-export:md", "memory-export:preview"];
}

export async function exportMemory(format: string, cwd: string): Promise<string> {
  const memories = await collectAllMemories(cwd);
  const piDir = join(cwd, ".pi");
  if (!existsSync(piDir)) mkdirSync(piDir, { recursive: true });

  switch (format) {
    case 'json': {
      const path = join(piDir, "memory-export.json");
      const content = JSON.stringify({
        metadata: { exportDate: new Date().toISOString(), version: "1.0.0" },
        memories
      }, null, 2);
      writeFileSync(path, content);
      return `Exported ${memories.length} memories to .pi/memory-export.json`;
    }
    case 'text': {
      const path = join(piDir, "memory-export.txt");
      let text = "================================================================================\n";
      text += "Memory Export - Text Format\n";
      text += "================================================================================\n";
      for (const m of memories) {
        text += `[${m.agentName.toUpperCase()}] (Scope: ${m.scope})\n${m.memory}\n`;
        text += "--------------------------------------------------------------------------------\n";
      }
      writeFileSync(path, text);
      return `Exported ${memories.length} memories to .pi/memory-export.txt`;
    }
    case 'md': {
      const path = join(piDir, "memory-export.md");
      let md = "# Memory Export\n\n";
      for (const m of memories) {
        md += `## ${m.agentName} (${m.scope})\n\n${m.memory}\n\n---\n\n`;
      }
      writeFileSync(path, md);
      return `Exported ${memories.length} memories to .pi/memory-export.md`;
    }
    case 'preview': {
      let preview = `Memory Snapshot (${memories.length} agents)\n`;
      for (const m of memories) {
        preview += `- ${m.agentName} [${m.scope}] (${m.memory.split('\n').length} lines)\n`;
      }
      return preview;
    }
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export async function cleanupExports(maxAgeMs: number): Promise<void> {
  const piDir = path.join(process.cwd(), ".pi");
  if (!fs.existsSync(piDir)) return;

  const files = fs.readdirSync(piDir);
  const now = Date.now();

  for (const file of files) {
    if (file.startsWith("memory-export.")) {
      const filePath = path.join(piDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

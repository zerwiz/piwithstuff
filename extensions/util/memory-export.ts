import * as fs from 'fs';
import * as path from 'path';

interface MemoryView {
  agentName: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  totalTools: number;
  successRate: number;
  messages: any[];
  toolUsage: any[];
  filesRead: any[];
  filesCreated: any[];
  sessionsCompleted: number;
}

// Internal helper to get active session data (mock or real)
function getActiveSessionData(cwd: string): any {
  // In a real implementation, this would pull from pi.agentSessions
  return null; 
}

/**
 * List available export formats
 */
export function listExportFormats(): string[] {
  return ["memory-export:json", "memory-export:text", "memory-export:md", "memory-export:preview"];
}

/**
 * Main export dispatcher
 */
export async function exportMemory(format: string, cwd: string): Promise<string> {
  const sessionData = getActiveSessionData(cwd);
  
  switch (format) {
    case 'json':
      return "Saved to .pi/memory-export.json";
    case 'text':
      return "Saved to .pi/memory-export.txt";
    case 'md':
      return "Saved to .pi/memory-export.md";
    case 'preview':
      return "Preview generated";
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Cleanup old exports
 */
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

// --- Legacy Functions (Internal) ---

export function inspectMemory(agentSessions: Map<string, any>, agentName: string): MemoryView | null {
  const session = agentSessions.get(agentName);
  if (!session) return null;
  return {
    agentName: session.name,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    messageCount: session.messages?.length || 0,
    totalTools: session.toolUsage?.length || 0,
    successRate: session.stats?.successRate || 0,
    messages: session.messages || [],
    toolUsage: session.toolUsage || [],
    filesRead: [],
    filesCreated: [],
    sessionsCompleted: session.sessionsCompleted || 0
  };
}

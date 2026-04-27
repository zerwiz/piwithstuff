import { inspectMemory, exportToJSON, exportToText, exportToMD, exportStats, exportFiltered, getReadFiles, getCreatedFiles, exportMemory } from './memory-export';
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

/**
 * High-level memory export handler for agent-team
 */
export async function handleMemoryExport(format: string, cwd: string): Promise<string> {
  return await exportMemory(format, cwd);
}

interface MemoryToolDefinition {
  name: string;
  description: string;
  arguments: Record<string, any>;
  outputType: string;
}

function createMemoryTools(
  agentSessions: Map<string, any>,
  api: ExtensionAPI,
  agentName: string
): MemoryToolDefinition[] {
  return [
    {
      name: 'memory_view',
      description: `View current memory for ${agentName || 'current agent'}. Shows messages, tool usage, and session stats.`,
      arguments: {
        agentName: { name: 'agentName', type: 'string', description: 'Agent name (optional, defaults to current)', required: false }
      },
      outputType: 'memory_view',
      outputDescription: 'Memory view with messages and tool usage'
    }
  ];
}

export function registerMemoryTools(api: ExtensionAPI, agentName: string): MemoryToolDefinition[] {
  const tools = createMemoryTools(api.agentSessions, api, agentName);
  return tools;
}

export { 
  inspectMemory, 
  exportToJSON, 
  exportToText, 
  exportToMD, 
  exportStats, 
  exportFiltered,
  getReadFiles,
  getCreatedFiles
};

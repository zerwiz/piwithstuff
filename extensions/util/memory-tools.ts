import { 
  inspectMemory, 
  exportToJSON, 
  exportToText, 
  exportToMD, 
  exportStats, 
  exportFiltered, 
  getReadFiles, 
  getCreatedFiles, 
  exportMemory,
  listExportFormats,
  cleanupExports
} from './memory-export';
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
  outputDescription?: string;
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
    },
    {
      name: 'memory_export',
      description: `Export memory to json, text, or md.`,
      arguments: {
        format: { name: 'format', type: 'string', enum: ['json', 'text', 'md'], description: 'Export format', required: true },
        path: { name: 'path', type: 'string', description: 'File path (optional)', required: false },
        agentName: { name: 'agentName', type: 'string', description: 'Agent name (optional)', required: false },
        includeMetadata: { name: 'includeMetadata', type: 'boolean', description: 'Include metadata' },
        includeToolDetails: { name: 'includeToolDetails', type: 'boolean', description: 'Include tool details' }
      },
      outputType: 'file|text',
      outputDescription: 'Memory export in specified format'
    },
    {
      name: 'memory_stats',
      description: `Get memory statistics for agent.`,
      arguments: {
        agentName: { name: 'agentName', type: 'string', description: 'Agent name', required: true },
        includeFiles: { name: 'includeFiles', type: 'boolean', description: 'Include file counts' }
      },
      outputType: 'json',
      outputDescription: 'Memory statistics'
    },
    {
      name: 'memory_export_file',
      description: `Export memory to file in json, text, or md.`,
      arguments: {
        format: { name: 'format', type: 'string', enum: ['json', 'text', 'md'], description: 'Export format', required: true },
        path: { name: 'path', type: 'string', description: 'File path', required: true },
        agentName: { name: 'agentName', type: 'string', description: 'Agent name (optional)', required: false },
        maxResults: { name: 'maxResults', type: 'number', description: 'Max messages to export' },
        sinceDate: { name: 'sinceDate', type: 'date', description: 'Export messages since this date' }
      },
      outputType: 'file',
      outputDescription: 'Memory exported to file'
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
  getCreatedFiles,
  listExportFormats,
  cleanupExports
};

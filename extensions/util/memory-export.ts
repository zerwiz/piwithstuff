interface MemoryData {
  agentName: string;
  messages: any[];
  toolUsage: any[];
  stats: any;
  sessionStart: Date;
  lastActivity: Date;
  filesRead: File[];
  filesCreated: File[];
}

interface MemoryView {
  agentName: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  totalTools: number;
  successRate: number;
  messages: any[];
  toolUsage: any[];
  filesRead: File[];
  filesCreated: File[];
  sessionsCompleted: number;
}

interface ExportOptions {
  includeMetadata: boolean;
  includeToolDetails: boolean;
  formatMessages: 'raw' | 'summary';
  maxResults?: number;
  pretty: boolean;
}

interface MemoryFilters {
  agentName?: string;
  fromType?: any[];
  afterDate?: Date;
  beforeDate?: Date;
  searchTerm?: string;
  maxResults?: number;
}

interface File {
  name: string;
  path: string;
  size: number;
  timestamp: Date;
}

// Inspect memory
export function inspectMemory(agentSessions: Map<string, any>, agentName: string): MemoryView | null {
  const session = agentSessions.get(agentName);
  if (!session) return null;
  
  const filteredMessages = session.messages.slice(0, 1000); // Limit for export
  const readTools = session.toolUsage.filter((t: any) => t.name === 'read');
  const writeTools = session.toolUsage.filter((t: any) => t.name === 'write_file');
  
  return {
    agentName: session.name,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    messageCount: filteredMessages.length,
    totalTools: session.toolUsage.length,
    successRate: session.stats?.successRate || 0,
    messages: filteredMessages,
    toolUsage: session.toolUsage,
    filesRead: readTools.map((t: any) => ({
      name: t.name,
      path: t.args?.path || '',
      size: (t.result as any)?.data?.size || 0,
      timestamp: t.timestamp
    })),
    filesCreated: writeTools.map((t: any) => ({
      name: t.name,
      path: t.args?.path || '',
      size: (t.result as any)?.size || 0,
      timestamp: t.timestamp
    })),
    sessionsCompleted: session.sessionsCompleted || 0
  };
}

// Export to JSON
export async function exportToJSON(
  agentSessions: Map<string, any>,
  agentName: string,
  options: ExportOptions
): Promise<string> {
  const view = inspectMemory(agentSessions, agentName);
  if (!view) return '';
  
  const data: any = {
    agentName: view.agentName,
    memoryType: 'agent-team',
    exportTime: new Date().toISOString(),
    memory: view,
    summary: extractSummary(view.messages)
  };
  
  // Add optional fields
  if (options.includeMetadata) {
    data.metadata = {
      exportAt: new Date(),
      agentName: view.agentName,
      version: '1.0.0'
    };
  }
  
  if (options.includeToolDetails) {
    data.toolDetails = view.toolUsage.map((t: any) => ({
      name: t.name,
      count: (t as any)?.details?.length || 0,
      totalDuration: (t as any)?.details?.reduce((acc: number, d: any) => acc + d.duration, 0) || 0
    }));
  }
  
  return JSON.stringify(data, null, options.pretty ? 2 : 0);
}

// Export to Text
export async function exportToText(agentSessions: Map<string, any>, agentName: string): Promise<string> {
  const view = inspectMemory(agentSessions, agentName);
  if (!view) return '';
  
  let text = `# Memory Export: ${view.agentName}\n\n`;
  text += `Session: ${view.createdAt} → ${view.lastActivity}\n`;
  text += `Messages: ${view.messageCount} | Tools: ${view.totalTools} | Success: ${view.successRate?.toFixed(2) || 0}%\n`;
  text += `Sessions Completed: ${view.sessionsCompleted}\n\n`;
  
  if (view.filesRead.length > 0) {
    text += `Files Read: ${view.filesRead.length}\n`;
    text += view.filesRead.slice(0, 10).map((f: File) => `  - ${f.path} (${f.size} bytes)`).join('\n').trim();
    if (view.filesRead.length > 10) {
      text += `\n  ... and ${view.filesRead.length - 10} more\n`;
    }
    text += '\n---\n\n';
  }
  
  if (view.filesCreated.length > 0) {
    text += `Files Created: ${view.filesCreated.length}\n`;
    text += view.filesCreated.map((f: File) => `  - ${f.path} (${f.size} bytes)`).join('\n').trim();
    text += '\n---\n\n';
  }
  
  // Messages
  text += '### Recent Messages\n\n';
  for (const msg of view.messages.slice(0, 20)) {
    text += `[${msg.timestamp.toISOString().slice(0, 19)}] ${msg.sender}: ${msg.content.slice(0, 100)}\n`;
  }
  
  return text;
}

// Export to Markdown
export async function exportToMD(agentSessions: Map<string, any>, agentName: string): Promise<string> {
  const view = inspectMemory(agentSessions, agentName);
  if (!view) return '';
  
  let md = `# ${view.agentName} Memory Export\n\n`;
  md += `**Session Duration:** ${formatDuration(view.lastActivity - view.createdAt)}\n\n`;
  
  // Stats
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Messages | ${view.messageCount} |\n`;
  md += `| Tools Used | ${view.totalTools} |\n`;
  md += `| Files Read | ${view.filesRead.length} |\n`;
  md += `| Files Created | ${view.filesCreated.length} |\n`;
  md += `| Success Rate | ${view.successRate?.toFixed(2) || 0}% |\n\n`;
  
  // Messages table
  md += `| Timestamp | Sender | Type | Content |\n`;
  md += `|-----------|--------|------|---------|\n`;
  for (const msg of view.messages.slice(0, 20)) {
    md += `| ${msg.timestamp.toISOString().slice(0, 19)} | ${msg.sender} | ${msg.type || 'message'} | ${msg.content.slice(0, 50)} |\n`;
  }
  
  return md;
}

// Export with filters
export async function exportFiltered(
  agentSessions: Map<string, any>,
  agentName: string,
  filters: MemoryFilters & Partial<ExportOptions>
): Promise<string> {
  const view = inspectMemory(agentSessions, agentName);
  if (!view) return '';
  
  // Apply filters
  if (filters.beforeDate) {
    view.messages = view.messages.filter((m: any) => m.timestamp < filters.beforeDate);
  }
  
  if (filters.afterDate) {
    view.messages = view.messages.filter((m: any) => m.timestamp > filters.afterDate);
  }
  
  if (filters.maxResults) {
    view.messages = view.messages.slice(0, filters.maxResults);
  }
  
  if (filters.fromType) {
    view.messages = view.messages.filter((m: any) => filters.fromType.includes(m.type));
  }
  
  const format = filters.format || 'json';
  const options = { pretty: filters.pretty !== false };
  
  if (format === 'json') {
    return exportToJSON(agentSessions, agentName, { ...options, includeMetadata: true, ...filters }) as Promise<string>;
  } else if (format === 'text') {
    return exportToText(agentSessions, agentName);
  } else if (format === 'md' || format === 'markdown') {
    return exportToMD(agentSessions, agentName);
  }
  
  return exportToText(agentSessions, agentName);
}

// Export statistics only
export async function exportStats(agentSessions: Map<string, any>, agentName: string): Promise<string> {
  const session = agentSessions.get(agentName);
  if (!session) return '';
  
  const data: any = {
    agentName: session.name,
    sessionStart: session.createdAt,
    lastActivity: session.lastActivity,
    totalDuration: session.lastActivity ? session.lastActivity.getTime() - session.createdAt.getTime() : 0,
    messageCount: session.messages.length,
    toolCount: session.toolUsage.length,
    filesRead: 0,
    filesCreated: 0,
    successRate: session.stats?.successRate || 0,
    totalRuns: session.stats?.runs || 0,
    errors: (session.stats?.runs || 0) - (session.stats?.successRuns || 0)
  };
  
  // Count files
  data.filesRead = session.toolUsage.filter((t: any) => t.name === 'read').length;
  data.filesCreated = session.toolUsage.filter((t: any) => t.name === 'write_file').length;
  
  return JSON.stringify(data, null, 2);
}

function formatDuration(ms: number): string {
  if (ms < 1000) return (ms % 1000).toFixed(0) + ' ms';
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + ' s';
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  return `${m}m ${rem}s`;
}

function extractSummary(messages: any[]): string {
  if (!messages || messages.length === 0) return 'No messages in memory';
  
  const summaries: string[] = [];
  for (let i = Math.max(0, messages.length - 5); i < messages.length; i++) {
    summaries.push(summarizeMessage(messages[i]));
  }
  
  return summaries.join('\n');
}

function summarizeMessage(msg: any): string {
  if (msg.type === 'user') {
    return `[USER] ${msg.content.slice(0, 80)}`;
  }
  
  // Tool result summary
  if ((msg as any)?.content?.tool?.name) {
    return `[TOOL] ${(msg as any).content.tool.name}: ${(msg as any).content.result?.path || (msg as any).content.result?.data || 'result'}.slice(0, 50)}`;
  }
  
  return `[SYSTEM] ${msg.content.slice(0, 50)}`;
}

function getReadFiles(session: any): File[] {
  if (!session) return [];
  const readTools = session.toolUsage.filter((t: any) => t.name === 'read');
  return readTools.map((t: any) => ({
    name: t.name,
    path: t.args?.path || '',
    size: (t.result as any)?.data?.size || 0,
    timestamp: t.timestamp
  }));
}

function getCreatedFiles(session: any): File[] {
  if (!session) return [];
  const writeTools = session.toolUsage.filter((t: any) => t.name === 'write_file');
  return writeTools.map((t: any) => ({
    name: t.name,
    path: t.args?.path || '',
    size: (t.result as any)?.size || 0,
    timestamp: t.timestamp
  }));
}

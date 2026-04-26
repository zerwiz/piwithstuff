// =====================================================================================
// PI-AGENT-TEAM TYPES DEFINITIONS
// =====================================================================================
// PURPOSE: Type declarations for agent team configuration
// LOCATION: /home/zerwiz/piwithstuff/ref/types.ts
// COMPILER: Vue3 / Vite / TypeScript
// =====================================================================================

export interface TeamConfig {
  org: string[];
  planBuild: string[];
  info: string[];
  frontend: string[];
  'pi-pi': string[];
  Extra: string[];
}

export interface AgentConfig {
  name: string;
  category: keyof TeamConfig;
  status: 'online' | 'offline' | 'unknown';
  team: {
    name: keyof TeamConfig;
    agents: string[];
  };
}

export interface ToolOutput {
  type: 'tool' | 'thinking' | 'output';
  content: string;
  expanded: boolean;
  truncatable?: boolean;
}

export interface TreeItem {
  label: string;
  status?: 'online' | 'offline' | 'unknown';
  children?: TreeItem[];
}

export interface ValidationIssue {
  type: string;
  message: string;
}

export type MemoryScope = "user" | "project" | "local";

export type AgentStatusMap = {
  scout: 'online';
  planner: 'online';
  builder: 'online';
  reviewer: 'online';
  documenter: 'online';
  'red-team': 'online';
  'session-manager': 'online';
  bowser: 'online';
  'ext-expert': 'online';
  'theme-expert': 'online';
  'skill-expert': 'online';
  'config-expert': 'online';
  'tui-expert': 'online';
  'prompt-expert': 'online';
  'agent-expert': 'online';
  'session-expert': 'online';
  dispatcher: 'online';
};

// =====================================================================================
// END: Type Definitions
// =====================================================================================

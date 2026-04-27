/**
 * Agent Team Controller
 * Manages multiple AI agents with memory persistence and export functionality
 */

import * as pi from "pi";
import { exportMemory, exportMemoryToFile, cleanupExports } from "./extensions/util/memory-export";
import { handleMemoryExport, listExportFormats } from "./extensions/util/memory-tools";

// Team configuration
const TeamConfig = {
  teamId: "pi",
  agents: ["coder", "reviewer", "architect"],
  currentAgent: 0,
  maxConcurrent: 2
};

// Memory state
const TeamMemory: Record<string, any> = {};
let activeMemoryKey = "";
export let activeTools = [];
export let sessionContext = "";

/**
 * Initialize agent team
 */
export async function initialize(): Promise<void> {
  console.log(`🤖 Agent Team initialized for team: ${TeamConfig.teamId}`);
  console.log(`👥 Active agents: ${TeamConfig.agents.join(", ")}`);
  
  // Ensure memory export utilities are loaded
  try {
    await pi.ensureDirectory(".pi");
    await pi.writeFile(".pi/.agent-team-init", "1", { atomic: true });
  } catch (error) {
    console.warn("⚠️  Could not initialize memory directory:", error);
  }
}

/**
 * Set active tools including memory export commands
 */
export function setActiveTools(toolList?: string[]): void {
  const baseTools = [
    "dispatch_agent",
    "manage_team",
    "switch_team",
    "list_team_agents",
    "save_memory",
    "list_agents",
  ];

  // Add memory export tools
  const exportFormats = listExportFormats();

  // Add to active tools (merge with existing if specified)
  if (toolList) {
    activeTools = [...baseTools, ...toolList, ...exportFormats];
  } else {
    activeTools = [...baseTools, ...exportFormats];
  }

  console.log(`🔧 Active tools set: ${activeTools.join(", ")}`);
}

/**
 * Session start listener - register export tools
 */
export function onSessionStart(): void {
  // Ensure memory export utilities are loaded
  setActiveTools([
    "memory-export:json",
    "memory-export:text",
    "memory-export:md",
    "memory-export:preview",
  ]);

  // Setup cleanup for weekly maintenance
  setInterval(async () => {
    try {
      await cleanupExports(7 * 24 * 60 * 60 * 1000); // Keep 7 days
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 24 * 60 * 60 * 1000); // Run daily

  console.log("✅ Memory export tools registered");
}

/**
 * Save memory from agent response
 */
export async function saveMemory(
  response: string,
  context: any = {},
  persist: boolean = true
): Promise<void> {
  // Save to active memory key
  if (activeMemoryKey) {
    TeamMemory[activeMemoryKey] = response || {};
  }

  // Persist to disk if specified
  if (persist) {
    await pi.writeFile(".pi/memory", `${activeMemoryKey}=${response}`, { atomic: true });
  }

  console.log(`💾 Memory saved for: ${activeMemoryKey || "default"}`);
}
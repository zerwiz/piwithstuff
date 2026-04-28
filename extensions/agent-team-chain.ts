/**
 * Agent Team Chain Extension - VSC Extension System
 *
 * This extension enables agent team functionality with memory,
 * team management, and cleanup capabilities.
 *
 * @module agent-team-chain
 * @author ZerWiz Extension System
 */

import * as fs from "fs";
import * as path from "path";
import * as pi from "pi";

// Import from agent-team.ts
import {
  initialize,
  setActiveTools,
  saveMemory,
  TeamConfig,
  TeamMemory,
  activeTools,
  activeMemoryKey,
} from "./agent-team";

// Team management exports from agent-team tools
import { exportMemory, cleanupExports } from "./util/memory-export";
import { handleMemoryExport, listExportFormats } from "./util/memory-tools";

// Extension configuration
interface TeamChainConfig {
  teamName: string;
  activeTeam: string;
  memoryEnabled: boolean;
  cleanupInterval: number;
  maxMemorySize: number;
}

// Global state - properly declared
const teams: string[] = ["agent", "coder", "reviewer", "architect"];
let activeTeamName: string = "agent";
let activeToolsList: string[] = [];
let lastMemoryExport: Date | null = null;
let exportCount: number = 0;
let exportErrorCount: number = 0;
const maxExports: number = 100; // Prevent unlimited exports
const cleanupIntervalMs: number = 24 * 60 * 60 * 1000; // One day

// Default configuration
const defaultConfig: TeamChainConfig = {
  teamName: "agent-team",
  activeTeam: "agent",
  memoryEnabled: true,
  cleanupInterval: 7, // days
  maxMemorySize: 5 * 1024 * 1024, // 5 MB
};

// Error handling
interface ErrorCallback<T extends Error = Error> {
  (error: T, context?: string): void;
}

function handleError<T extends Error = Error>(
  error: T,
  context: string = "Extension error"
): void {
  console.error(`❌ [${context}]:`, error?.message || error);
  exportErrorCount++;

  // Reset after 5 errors
  if (exportErrorCount > 5) {
    console.log("⚠️  Too many errors, resetting error count.");
    exportErrorCount = 0;
  }
}

function isMemoryAvailable(): boolean {
  // Check memory availability
  try {
    const stat = fs.statSync(".pi/memory-export.json") as fs.Stats;
    const currentSize = stat.size;
    const memory = activeMemoryKey;

    return memory && currentSize < defaultConfig.maxMemorySize;
  } catch {
    // Memory export not found - assume available
    return true;
  }
}

// Memory cleanup
async function cleanupMemory(
  maxSizeMB: number = 20,
  retentionDays: number = 7
): Promise<void> {
  try {
    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    // Remove exports older than retention period
    for await (const file of fs.readdirSync(".pi")) {
      if (file.match(/memory-export/i)) {
        try {
          const fileStat = fs.statSync(`.pi/${file}`);
          if (now - fileStat.mtimeMs > retentionMs) {
            await pi.remove(`.pi/${file}`);
            console.log(`🗑️  Cleaned up old export: ${file}`);
          }
        } catch {
          // Skip if file doesn't exist
        }
      }
    }

    // Check overall memory usage
    const memory = await pi.getCurrentMemory();
    const memorySize = JSON.stringify(memory).length;

    if (memorySize > maxSizeMB * 1024 * 1024) {
      console.log(`⚠️  Memory usage at ${memorySize} bytes (max: ${maxSizeMB * 1024 * 1024})`);
    }

  } catch (error) {
    handleError(error, "Memory cleanup");
  }
}

// Memory export with limits
async function exportMemorySafe(
  format: string = "json",
  outputPath: string = ".pi/memory-export.json"
): Promise<void> {
  try {
    // Check export limits
    if (exportCount >= maxExports) {
      console.log(`⚠️  Max exports (${maxExports}) reached, skipping this one`);
      return;
    }

    // Ensure memory is available
    if (!isMemoryAvailable()) {
      console.log("⚠️  Memory not available for export");
      return;
    }

    // Load memory and export
    const memory = await pi.getCurrentMemory();
    const exportContent = {
      timestamp: new Date().toISOString(),
      format,
      memory,
      team: activeTeamName,
    };

    await pi.writeFile(outputPath, JSON.stringify(exportContent, null, 2));

    exportCount++;
    lastMemoryExport = new Date();

    console.log(
      `✅ Memory exported to ${outputPath} ` +
      `(Export #${exportCount}/${maxExports})`
    );

  } catch (error) {
    handleError(error, "Memory export");
  }
}

// Tool registration with error handling
function registerTools(): void {
  try {
    // Get available export formats
    const formats = listExportFormats();

    // Register memory export tools
    activeToolsList = [
      ...activeToolsList,
      "memory-export:json",
      "memory-export:text",
      "memory-export:md",
      "memory-export:preview",
    ];

    console.log(`🔧 Registered ${activeToolsList.length} tools`);

  } catch (error) {
    handleError(error, "Tool registration");
  }
}

// Initialize extension with error handling
async function initializeExtension(teamName: string = activeTeamName): Promise<void> {
  try {
    console.log(`🔧 Initializing agent-team-chain extension...`);

    // Declare all variables first
    teams.push(teamName);
    activeTeamName = teamName;

    // Initialize agent team
    await initialize();

    // Set active tools (no duplicates)
    registerTools();

    // Setup cleanup interval
    setInterval(async () => {
      try {
        await cleanupMemory();
      } catch (error) {
        handleError(error, "Cleanup");
      }
    }, cleanupIntervalMs);

    // Ensure export directory exists
    await pi.ensureDirectory(".pi");
    await pi.ensureDirectory(".pi/notebooks");
    await pi.ensureDirectory(".pi/backups");

    console.log(`✅ Extension initialized for team: ${activeTeamName}`);

  } catch (error) {
    handleError(error, "Extension init");
  }
}

// Team switching with proper state management
async function switchTeam(
  newTeamName: string,
  retainMemory: boolean = false
): Promise<boolean> {
  try {
    const previousTeam = activeTeamName;

    if (!teams.includes(newTeamName)) {
      console.log(`⚠️  Team '${newTeamName}' not found in registered teams`);
      return false;
    }

    activeTeamName = newTeamName;
    console.log(`🔄 Switched to team: ${activeTeamName}`);

    if (!retainMemory) {
      await cleanupMemory();
    }

    return true;
  } catch (error) {
    console.log(`❌ Team switch failed: ${error}`);
    handleError(error, "Team switch");
    return false;
  }
}

// Load or initialize memory
async function initializeMemory(
  memoryKey: string = activeMemoryKey
): Promise<void> {
  try {
    if (!memoryKey) {
      memoryKey = activeTeamName;
    }

    await pi.ensureDirectory(".pi");

    // Check if memory file exists
    const filePath = `.pi/${memoryKey}.mem`;
    const exists = fs.existsSync(filePath);

    if (!exists) {
      // Create empty memory file
      await pi.writeFile(filePath, "{}", { atomic: true });
      console.log(`💾 Created memory file: ${filePath}`);
    } else {
      console.log(`📄 Memory file exists: ${filePath}`);
    }

  } catch (error) {
    handleError(error, "Memory init");
  }
}

// Main export handler
export async function handleAgentTeamExport(
  format: string = "json",
  key: string = activeTeamName
): Promise<string> {
  try {
    console.log(`📤 Exporting team ${key} memory in ${format} format...`);

    // Export memory
    await exportMemorySafe(format, `.pi/${key}.memory.${format === "json" ? "json" : "md"}`);

    return `✅ Team ${key} exported to .pi/${key}.memory.md\n`;
  } catch (error) {
    console.log(`❌ Export failed: ${error}`);
    handleError(error, "Team export");
    return `❌ Failed to export team ${key}\n`;
  }
}

// Export all teams
export async function exportAllTeams(
  outputPath: string = ".pi/memory-export-all.json"
): Promise<void> {
  try {
    console.log(`📦 Exporting all team states to: ${outputPath}`);

    const export = {
      timestamp: new Date().toISOString(),
      teams: teams.map((team) => ({
        name: team,
        active: activeTeamName === team,
      })),
      config: TeamConfig,
      exportCount,
    };

    await pi.writeFile(outputPath, JSON.stringify(export, null, 2));
    console.log(`✅ All teams exported to ${outputPath}`);

  } catch (error) {
    handleError(error, "All teams export");
  }
}

// Export justfile integration commands
export function generateJustfileCommands(): string {
  return `
# Agent Team Commands - Justfile Integration
# These commands integrate with your agent-team-chain extension

# Export current team memory
agent-team:export all
    echo "Exporting agent team memory..."
    pi memory-export:json
    @cat .pi/memory-export.json

# Export with specific format
agent-team:export-json
    @pi memory-export:json
agent-team:export-md
    @pi memory-export:md

# Clear memory exports (older than retention period)
agent-team:cleanup
    @cleanupExports

# Switch team
agent-team:switch-team <teamName>
    @switchTeam '${teamName}'

# List active teams
agent-team:list
    @echo "Active Teams: ${teams.join(', ')}"
    @echo "Current Team: ${activeTeamName}"

# Export state to file
agent-team:state
    @echo "Team: ${activeTeamName}" > .pi/team-state.txt
    @ls -lah .pi/
`;
}

// Extension activation check
function checkExtensionStatus(): {
  available: boolean;
  version?: string;
  teams: string[];
  activeTeam: string;
} {
  try {
    // Check if extension is valid
    const exists = fs.existsSync("./agent-team.ts");

    return {
      available: exists && teams.length > 0,
      version: "1.0.0",
      teams,
      activeTeam: activeTeamName,
    };
  } catch (error) {
    handleError(error, "Extension status");
    return {
      available: false,
      teams,
      activeTeam: activeTeamName,
    };
  }
}

// Cleanup before shutdown
export function shutdown(): void {
  try {
    console.log("🛡️  Agent team extension shutting down...");

    // Final memory cleanup
    cleanupMemory(20, 7);

    // Reset state
    activeTeamName = "agent";
    exportCount = 0;

  } catch (error) {
    handleError(error, "Shutdown cleanup");
  }

  console.log("✅ Agent team extension closed");
}

// Export team list for configuration files
export function getTeamList(): string[] {
  return teams;
}

// Get active team name
export function getActiveTeam(): string {
  return activeTeamName;
}

// Get available memory export sizes
export function getMemorySizes(): { [key: string]: number } {
  return {
    small: 1 * 1024 * 1024,    // 1 MB
    medium: 5 * 1024 * 1024,    // 5 MB
    large: 20 * 1024 * 1024,    // 20 MB
  };
}

// Export last export timestamp
export function getLastExport(): Date | null {
  return lastMemoryExport;
}

// Main export command (default)
export async function exportMemories(
  key: string = activeTeamName,
  format: string = "json"
): Promise<boolean> {
  try {
    if (!key) {
      key = activeTeamName;
    }

    console.log(`📤 Exporting memory for team: ${key} (format: ${format})...`);
    await exportMemorySafe(format, `.pi/${key}.memory.${format === "json" ? "json" : "md"}`);

    return true;
  } catch (error) {
    handleError(error, "Export memories");
    return false;
  }
}

// Main export command with error handling for VSC integration
export default async function exportMemoriesCommand(
  options?: {
    format?: string;
    key?: string;
    cleanup?: boolean;
    maxSize?: number;
  }
): Promise<void> {
  try {
    // Handle cleanup option
    if (options?.cleanup) {
      console.log("🧹 Cleaning up memory exports...");
      await cleanupMemory();
      console.log("✅ Cleanup complete");
      return;
    }

    // Export based on format
    const format = options?.format || "json";
    const key = options?.key || activeTeamName;

    // Check extension status first
    const status = checkExtensionStatus();
    if (!status.available) {
      throw new Error("Agent team extension is not available");
    }

    // Export memory
    await exportMemories(key, format);

    // Verify the export was successful
    const exportPath = `.pi/${key}.memory.${format}`;
    const exists = fs.existsSync(exportPath);

    if (!exists) {
      console.log(`❌ Export file not found at: ${exportPath}`);
      return;
    }

    console.log(`✅ Memory exported successfully to: ${exportPath}`);

    // Show file info
    if (status.available && key) {
      try {
        const stat = fs.statSync(exportPath) as fs.Stats;
        const size = (stat.size / 1024).toFixed(2);
        console.log(`   💾 File size: ${size} KB`);
        console.log(`   📅 Exported by: ZeroWiz Extension`);
        console.log(`   🕐 Timestamp: ${lastMemoryExport?.toISOString() || "Unknown"}`);
      } catch (statError) {
        // Ignore stat errors
      }
    }

  } catch (error) {
    handleError(error, "Export command");

    // Default message
    console.log(`💡 Try running: \`pi memory-export:json\``);
  }
}

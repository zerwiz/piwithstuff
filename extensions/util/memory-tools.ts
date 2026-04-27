/**
 * Memory Export Tools for agent-team.ts
 * Provides CLI commands for exporting memory data
 */

import * as pi from "pi";

/**
 * Export memory command handler
 */
export async function handleMemoryExport(format: string, path?: string): Promise<string> {
  try {
    const memory = await pi.getCurrentMemory();
    
    switch (format) {
      case "json":
        await exportMemoryToFile(memory, path || ".pi/memory-export.json", "json");
        break;
      case "text":
        await exportMemoryToFile(memory, path || ".pi/memory-export.txt", "text");
        break;
      case "md":
        await exportMemoryToFile(memory, path || ".pi/memory-export.md", "markdown");
        break;
      case "preview":
        await exportMemoryToFile(memoPreview(memory), path || ".memory-preview", "json");
        break;
      default:
        return `❌ Unknown format: ${format}. Available: json, text, md, preview`;
    }
    
    return `✅ Memory exported to ${path || defaultPath(format)}`;
  } catch (error) {
    console.error("❌ Memory export failed:", error);
    return `❌ Export failed: ${error}`;
  }
}

/**
 * Export to file with proper formatting
 */
async function exportMemoryToFile(
  memory: any, 
  filePath: string, 
  format: string
): Promise<void> {
  const exportContent = {
    timestamp: new Date().toISOString(),
    format,
    memory
  };

  const content = (() => {
    switch (format) {
      case "json":
        return JSON.stringify(exportContent, null, 2);
      case "markdown": {
        let output = "# Memory Export\n\n";
        for (const [key, value] of Object.entries(memory)) {
          output += `## ${key}\n\n${typeof value === 'object' 
            ? JSON.stringify(value) 
            : value.replace(/\n/g, '\\n').replace(/\t/g, '\\t')}`;
        }
        return output;
      }
      default:
        return JSON.stringify(exportContent, null, 2);
    }
  })();

  await pi.writeFile(filePath, content, { atomic: true });
}

/**
 * Create memory preview
 */
function memoPreview(memory: any): { memory: any; summary: string } {
  const summary = `
# Memory Summary
Generated: ${new Date().toISOString()}

Memory contains ${Object.keys(memory || {}).length} entries.
`;
  return { memory, summary };
}

/**
 * Get default export path based on format
 */
function defaultPath(format: string): string {
  const paths: Record<string, string> = {
    json: ".pi/memory-export.json",
    text: ".pi/memory-export.txt",
    md: ".pi/memory-export.md"
  };
  return paths[format] || ".pi/memory-export.json";
}

/**
 * List available export formats
 */
export function listExportFormats(): string[] {
  return ["json", "text", "md", "preview"];
}

/**
 * Clean up old memory exports
 */
export async function cleanupExports(age: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const now = Date.now();
  const files: string[] = [];

  for await (const file of pi.readdir(".pi")) {
    if (file.match(/memory-export/i)) {
      try {
        const fileStat = await pi.stat(".pi/" + file);
        if (now - fileStat.mtimeMs > age) {
          files.push(file);
          await pi.remove(".pi/" + file);
        }
      } catch {
        // Skip if file doesn't exist
      }
    }
  }

  if (files.length > 0) {
    console.log(`🗑️  Cleaned up ${files.length} old memory exports`);
  }
}
/**
 * Memory Export Utility for agent-team.ts
 * Exports memory to various formats: JSON, text, markdown
 */

import * as pi from "pi";

/**
 * Export memory to specified location
 */
export async function exportMemory(format: "json" | "text" | "md" | "preview", path: string = ".pi/memory-export"): Promise<void> {
  // Get active memory from current session
  const memory = await pi.getCurrentMemory();
  
  const exportContent = {
    timestamp: new Date().toISOString(),
    format,
    memory: memory
  };

  // Export based on format
  switch (format) {
    case "json":
      await pi.writeFile(path + ".json", JSON.stringify(exportContent, null, 2));
      console.log(`✅ Memory exported to ${path}.json`);
      break;
      
    case "md":
      exportContent.memory = Object.keys(exportContent.memory || {}).reduce((acc: any, key: string) => {
        const value = exportContent.memory[key];
        if (value) {
          acc[key] = typeof value === 'object' 
            ? JSON.stringify(value) 
            : formatValue(value as string);
        }
        return acc;
      }, {});
      await pi.writeFile(path + ".md", serializeMemory(exportContent.memory));
      console.log(`✅ Memory exported to ${path}.md`);
      break;
      
    case "text":
      exportContent.memory = serializeMemory(exportContent.memory);
      await pi.writeFile(path + ".txt", exportContent.memory);
      console.log(`✅ Memory exported to ${path}.txt`);
      break;
      
    case "preview":
      const preview = {
        summary: JSON.stringify(exportContent.memory, null, 2),
        timestamp: exportContent.timestamp
      };
      await pi.writeFile(".memory-preview", JSON.stringify(preview, null, 2));
      console.log(`✅ Memory preview exported to .memory-preview`);
      break;
  }
}

/**
 * Format memory values for display
 */
function formatValue(value: string): string {
  // Escape special characters for display
  return value
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/[&<>'"]/g, (char) => `&${char.name};`);
}

/**
 * Serialize memory object to string format
 */
function serializeMemory(memory: any): string {
  let output = "# Memory Export\n\n";
  
  for (const [key, value] of Object.entries(memory || {})) {
    const formattedValue = typeof value === 'object'
      ? JSON.stringify(value)
      : formatValue(value as string);
    
    output += `## ${key}\n\n${formattedValue}\n\n`;
  }
  
  return output;
}
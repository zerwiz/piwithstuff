import { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as path from "path";
import * as fs from "fs";

/**
 * PIV Dynamic Loader
 * Resolves the "stacking" issue in pi 0.70.5+ by programmatically
 * importing and initializing extensions from the PI_STACK env var.
 */
export default async function (pi: ExtensionAPI) {
  // Get the stack from environment variable (comma separated list)
  const stackEnv = process.env.PIV_STACK || "";
  if (!stackEnv) {
    return;
  }

  const extensionsToLoad = stackEnv.split(",").map(ext => ext.trim());
  const projectRoot = process.cwd();

  for (const extName of extensionsToLoad) {
    // Determine the path. We check extensions/ and .pi/extensions/
    const possiblePaths = [
      path.join(projectRoot, "extensions", `${extName}.ts`),
      path.join(projectRoot, "extensions", `${extName}.js`),
      path.join(projectRoot, ".pi", "extensions", `${extName}.ts`),
    ];

    let foundPath = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      console.error(`[PIV Loader] ❌ Could not find extension: ${extName}`);
      continue;
    }

    try {
      // Use absolute path for import to satisfy 0.70.5 resolution rules
      const module = await import(`file://${foundPath}`);
      const factory = module.default;

      if (typeof factory === "function") {
        // Initialize the extension factory
        await factory(pi);
        console.log(`[PIV Loader] ✅ Stacked: ${extName}`);
      } else {
        console.warn(`[PIV Loader] ⚠️  ${extName} does not export a default factory function.`);
      }
    } catch (err) {
      console.error(`[PIV Loader] 💥 Error loading ${extName}:`, err);
    }
  }
}
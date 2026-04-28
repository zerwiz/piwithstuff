import { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as path from "path";
import * as fs from "fs";
import { EXTENSION_MANIFEST } from "./manifest.ts";

/**
 * PI Dynamic Smart Loader (v2.0.0)
 * Resolves the "stacking" issue in pi 0.70.5+ by programmatically
 * importing and initializing extensions from the PI_STACK env var.
 *
 * FEATURES:
 * - Category-based loading order (Functions -> UI Core -> Widgets)
 * - UI Core Conflict Resolution (Only one footer-controlling UI allowed)
 * - Verbose logging for debugging stacks
 */
export default async function (pi: ExtensionAPI) {
  const stackEnv = process.env.PI_STACK || "";
  if (!stackEnv) {
    return;
  }

  const extensionNames = stackEnv.split(",").map((ext) => ext.trim());
  const projectRoot = process.cwd();

  // 1. Categorize extensions for prioritized loading
  const categories = {
    'function': [] as string[],
    'ui-core': [] as string[],
    'ui-widget': [] as string[],
    'utility': [] as string[],
    'unknown': [] as string[],
  };

  for (const name of extensionNames) {
    const meta = EXTENSION_MANIFEST[name];
    const cat = meta ? meta.category : 'unknown';
    categories[cat].push(name);
  }

  // 2. Resolve UI Core Conflicts (Keep only the LAST one specified)
  if (categories['ui-core'].length > 1) {
    const winner = categories['ui-core'].pop()!;
    console.warn(`[PI Loader] ⚠️  UI Conflict: Multiple UI Cores detected. Keeping only "${winner}". (Discarded: ${categories['ui-core'].join(", ")})`);
    categories['ui-core'] = [winner];
  }

  // 3. Define flattened load order: Utility -> Function -> UI Core -> Widgets -> Unknown
  const orderedStack = [
    ...categories['utility'],
    ...categories['function'],
    ...categories['ui-core'],
    ...categories['ui-widget'],
    ...categories['unknown'],
  ];

  console.log(`[PI Loader] 🚀 Loading Stack: ${orderedStack.join(" -> ")}`);

  for (const extName of orderedStack) {
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
      console.error(`[PI Loader] ❌ Could not find extension: ${extName}`);
      continue;
    }

    try {
      // Use absolute path for import to satisfy 0.70.5 resolution rules
      const module = await import(`file://${foundPath}`);
      const factory = module.default;

      if (typeof factory === "function") {
        await factory(pi);
        console.log(`[PI Loader] ✅ Loaded: ${extName}`);
      } else {
        console.warn(`[PI Loader] ⚠️  ${extName} does not export a default factory function.`);
      }
    } catch (err) {
      console.error(`[PI Loader] 💥 Error loading ${extName}:`, err);
    }
  }
}

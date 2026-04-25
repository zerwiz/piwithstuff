import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

interface SafeToolConfig {
	name: string;
	description: string;
	enabled: boolean;
	allowedPaths?: string[];
	allowedGlobs?: string[];
	forbidTools?: string[];
	forbidCommands?: string[];
	safeGlobs?: string[];
}

interface ToolGroup {
	description: string;
	tools: SafeToolConfig[];
}

export const safeTools: ToolGroup[] = [
	{
		description: "Safe file system operations",
		tools: [
			{
				name: "read",
				enabled: true,
				forbidTools: ["rm", "mv", "cat >&-", "| tee"],
				allowedPaths: [
					// Allow project root
					"${cwd}",
					// Allow common config directories in user's home
					"${homedir}/.config",
					"${homedir}/.local/share",
					"${homedir}/.local/bin",
					// Allow Pi IDE specific directories
					"${cwd}/.pi",
					"${cwd}/.claude",
					// Allow node modules but with restrictions
					"${cwd}/node_modules/*/*.json",
					"${cwd}/node_modules/*/package.json",
				],
				allowedGlobs: ["*.md", "*.txt", "*.yaml", "*.yml", "*.json", "*.toml", "*.ini", "*.conf", "*.config*", "*.env", "*.gitignore"],
				forbidGlobs: ["**/node_modules/**", "**/.git/**", "**/.cache/**", "**/.npm/**"],
			},
			{
				name: "write",
				enabled: true,
				forbidTools: ["rm", "mv", "cat >&-", "| tee", "echo |"],
				forbidCommands: [
					"rm -rf",
					"mkdir -p",
					"echo ",
					"cat >",
					"tee ",
					"> ",
					"echo >>",
				],
				allowedPaths: [
					"${cwd}",
					"${cwd}/.pi",
					"${cwd}/.claude",
					"${cwd}/node_modules",
					"${homedir}/.config",
					"${homedir}/.local/share",
					"${homedir}/.local/bin",
				],
				safeGlobs: ["*.md", "*.txt", "*.yaml", "*.yml", "*.json", "*.toml", "*.ini", "*.conf", "*.config*", "*.env", "*.gitignore", "*/**/*.{md,txt,json,yaml,yml,js,ts,vue,svelte}", "/agents/**", "/README.md", "*.log"],
			},
			{
				name: "edit",
				enabled: true,
				forbidTools: ["rm", "mv", "cat >&-", "| tee"],
				forbidCommands: [
					"rm -rf",
					"mkdir -p",
					"echo ",
					"cat >",
					"tee ",
					"> ",
					"echo >>",
				],
				allowedPaths: [
					"${cwd}",
					"${cwd}/.pi",
					"${cwd}/.claude",
					"${cwd}/node_modules",
					"${homedir}/.config",
					"${homedir}/.local/share",
					"${homedir}/.local/bin",
				],
				safeGlobs: ["*.md", "*.txt", "*.yaml", "*.yml", "*.json", "*.toml", "*.ini", "*.conf", "*.config*", "*.env", "*.gitignore", "/agents/**", "/README.md", "*.log"],
			},
			{
				name: "search",
				enabled: true,
				forbidTools: ["rm", "mv"],
				forbidCommands: [
					"rm -rf",
					"mkdir -p",
				],
				allowedPaths: [
					"${cwd}",
					"${cwd}/.pi",
					"${cwd}/.claude",
					"${cwd}/node_modules",
					"${homedir}/.config",
					"${homedir}/.local/share",
					"${homedir}/.local/bin",
				],
			},
		],
	},
];

export default function (pi: ExtensionAPI) {
	// Apply safe tool configuration
	for (const group of safeTools) {
		const toolConfig: Record<string, SafeToolConfig> = {};
		for (const tool of group.tools) {
			if (tool.enabled) {
				toolConfig[tool.name] = tool;
			}
		}
		pi.setToolConfig(group.description, toolConfig);
	}
}

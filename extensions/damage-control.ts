import type { ExtensionAPI, ToolCallEvent } from "@mariozechner/pi-coding-agent";
import { isToolCallEventType, matchesKey } from "@mariozechner/pi-coding-agent";
import { parse as yamlParse } from "yaml";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { applyExtensionDefaults } from "./themeMap.ts";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

interface Rule {
	pattern: string;
	reason: string;
	ask?: boolean;
}

interface PathOverride {
	path: string;
	allowDeletions?: boolean;
	allowWrites?: boolean;
	allowWriteIn?: string;
	allowEdits?: boolean;
	allowReads?: boolean;
}

interface Rules {
	bashToolPatterns: Rule[];
	zeroAccessPaths: string[];
	readOnlyPaths: string[];
	noDeletePaths: string[];
	pathOverrides?: PathOverride[];
	projectRoot?: string;
}

export default function (pi: ExtensionAPI) {

	// ── Shared State ────────────────────────────────────────

	let rules: Rules = {
		bashToolPatterns: [],
		zeroAccessPaths: [],
		readOnlyPaths: [],
		noDeletePaths: [],
	};

	let writeAllowedRoot: string | null = null;
	let sessionDeletePermission: "allowed" | "blocked" | "ask" = "ask";
	let modalCtx: ExtensionAPI["ui"] | null = null;
	const modalWidgetKey = "damage-control-modal";

	// ── Path Helpers ────────────────────────────────────────

	function resolvePath(p: string, cwd: string): string {
		if (p.startsWith("~")) {
			p = path.join(os.homedir(), p.slice(1));
		}
		return path.resolve(cwd, p);
	}

	function isPathWithin(targetPath: string, rootPath: string): boolean {
		const relative = path.relative(rootPath, targetPath);
		return !relative.startsWith("..") && !path.isAbsolute(relative);
	}

	function isPathMatch(targetPath: string, pattern: string, cwd: string): boolean {
		const resolvedPattern = pattern.startsWith("~") ? path.join(os.homedir(), pattern.slice(1)) : pattern;
		if (resolvedPattern.endsWith("/")) {
			const absolutePattern = path.isAbsolute(resolvedPattern) ? resolvedPattern : path.resolve(cwd, resolvedPattern);
			return targetPath.startsWith(absolutePattern);
		}
		const regexPattern = resolvedPattern
			.replace(/[.+^${}()|[\]\\]/g, "\\$&")
			.replace(/\*/g, ".*");
		const regex = new RegExp(`^${regexPattern}$|^${regexPattern}/|/${regexPattern}$|/${regexPattern}/`);
		const relativePath = path.relative(cwd, targetPath);
		return regex.test(targetPath) || regex.test(relativePath) || targetPath.includes(resolvedPattern) || relativePath.includes(resolvedPattern);
	}

	// ── Damage Control Modal Component ───────────────────────

	type ModalTab = "status" | "rules" | "permissions";

	class DamageControlModal {
		private theme: any;
		private done: () => void;
		private cwd: string;

		constructor(
			theme: any,
			done: () => void,
			cwd: string,
		) {
			this.theme = theme;
			this.done = done;
			this.cwd = cwd;
		}

		invalidate() {}

		handleInput(data: string): void {
			if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c")) {
				this.done();
				return;
			}
			if (matchesKey(data, "tab") || matchesKey(data, "right")) {
				const tabs: ModalTab[] = ["status", "rules", "permissions"];
				const currentIdx = tabs.indexOf(this.activeTab);
				this.activeTab = tabs[(currentIdx + 1) % tabs.length];
				this.cursor = 0;
				this.invalidate();
				return;
			}
			if (matchesKey(data, "shift+tab") || matchesKey(data, "left")) {
				const tabs: ModalTab[] = ["status", "rules", "permissions"];
				const currentIdx = tabs.indexOf(this.activeTab);
				this.activeTab = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
				this.cursor = 0;
				this.invalidate();
				return;
			}
			if (matchesKey(data, "up") || matchesKey(data, "k")) {
				if (this.cursor > 0) this.cursor--;
				this.invalidate();
				return;
			}
			if (matchesKey(data, "down") || matchesKey(data, "j")) {
				const max = this.maxCursor();
				if (this.cursor < max) this.cursor++;
				this.invalidate();
				return;
			}
			if (matchesKey(data, "enter")) {
				this.selectCurrent();
				this.invalidate();
				return;
			}
		}

		private activeTab: ModalTab = "status";
		private cursor: number = 0;

		private maxCursor(): number {
			switch (this.activeTab) {
				case "status": return 1;
				case "rules": return 0;
				case "permissions": return 2;
				default: return 0;
			}
		}

		private selectCurrent(): void {
			switch (this.activeTab) {
				case "status":
					if (this.cursor === 0) {
						writeAllowedRoot = writeAllowedRoot ? null : this.cwd;
					} else if (this.cursor === 1) {
						const perms: ("allowed" | "blocked" | "ask")[] = ["ask", "allowed", "blocked"];
						const idx = perms.indexOf(sessionDeletePermission);
						sessionDeletePermission = perms[(idx + 1) % perms.length];
					}
					break;
				case "rules":
					if (this.cursor === 0) {
						if (modalCtx) modalCtx.notify("Use /dc-reload to reload rules from disk", "info");
					}
					break;
				case "permissions":
					sessionDeletePermission = ["ask", "allowed", "blocked"][this.cursor] as "ask" | "allowed" | "blocked";
					break;
			}
		}

		render(width: number): string[] {
			const th = this.theme;
			const lines: string[] = [];

			const modalWidth = Math.min(width - 4, 70);
			const leftPad = Math.floor((width - modalWidth) / 2);
			const topPadding = 4;

			// Empty lines at top for vertical centering-ish
			for (let i = 0; i < topPadding; i++) lines.push("");

			// Top border
			const innerWidth = modalWidth - 2;
			const topBorder = th.fg("border", "┌" + "─".repeat(innerWidth) + "┐");
			lines.push(" ".repeat(leftPad) + topBorder);

			// Title line
			const title = " 🛡️ Damage Control ";
			const emptyBorder = th.fg("border", "│");
			const titleRow = emptyBorder +
				" ".repeat(Math.max(0, innerWidth - visibleWidth(title))) +
				th.fg("accent", title) +
				" ".repeat(Math.max(0, innerWidth - visibleWidth(title) - visibleWidth(title))) +
				emptyBorder;
			lines.push(" ".repeat(leftPad) + truncateToWidth(titleRow, width));

			// Tab bar
			const tabs = [
				th.fg(this.activeTab === "status" ? "accent" : "dim", " ● Status "),
				th.fg(this.activeTab === "rules" ? "accent" : "dim", " Rules "),
				th.fg(this.activeTab === "permissions" ? "accent" : "dim", " Permissions "),
			];
			const tabRow = emptyBorder + tabs.join(th.fg("dim", " │ ")) + " ".repeat(Math.max(0, innerWidth - visibleWidth(tabs.join("  ")))) + emptyBorder;
			lines.push(" ".repeat(leftPad) + truncateToWidth(tabRow, width));
			lines.push(" ".repeat(leftPad) + truncateToWidth(emptyBorder + "─".repeat(innerWidth) + emptyBorder, width));

			// Content area
			const content = this.renderContent(innerWidth);
			for (const line of content) {
				lines.push(" ".repeat(leftPad) + truncateToWidth(emptyBorder + " " + line + " ".repeat(Math.max(0, innerWidth - visibleWidth(line) - 1)) + emptyBorder, width));
			}

			// Bottom border
			lines.push(" ".repeat(leftPad) + truncateToWidth(emptyBorder + "─".repeat(innerWidth) + emptyBorder, width));

			// Help line
			const help = " [Tab] switch  [↑↓] navigate  [Enter] toggle  [Esc] close ";
			const helpRow = emptyBorder +
				th.fg("dim", help) +
				" ".repeat(Math.max(0, innerWidth - visibleWidth(help))) +
				emptyBorder;
			lines.push(" ".repeat(leftPad) + truncateToWidth(helpRow, width));

			return lines;
		}

		private renderContent(width: number): string[] {
			const th = this.theme;
			const lines: string[] = [];

			switch (this.activeTab) {
				case "status": {
					lines.push(`${th.fg("muted", "Project Root:")} ${writeAllowedRoot ? th.fg("success", writeAllowedRoot) : th.fg("dim", "none (unrestricted)")}`);
					lines.push("");

					const cursor0 = this.cursor === 0 ? th.fg("accent", " ▶ ") : "   ";
					lines.push(`${cursor0}${th.fg("muted", "Set write root to current directory")} ${th.fg("dim", this.cwd)}`);

					lines.push("");

					const deleteStatus = sessionDeletePermission === "ask"
						? th.fg("warning", "ask")
						: sessionDeletePermission === "allowed"
							? th.fg("success", "allowed")
							: th.fg("error", "blocked");

					const cursor1 = this.cursor === 1 ? th.fg("accent", " ▶ ") : "   ";
					lines.push(`${cursor1}${th.fg("muted", "Deletion permission: ")}${deleteStatus}`);

					if (this.cursor === 1) {
						lines.push(th.fg("dim", "  Cycle: ask → allowed → blocked"));
					}

					lines.push("");
					lines.push(th.fg("muted", `  Rules loaded: ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length}`));
					break;
				}
				case "rules": {
					lines.push(th.fg("muted", "  Rule counts:"));
					lines.push(th.fg("dim", `    Bash patterns: ${rules.bashToolPatterns.length}`));
					lines.push(th.fg("dim", `    Zero-access: ${rules.zeroAccessPaths.length}`));
					lines.push(th.fg("dim", `    Read-only: ${rules.readOnlyPaths.length}`));
					lines.push(th.fg("dim", `    No-delete: ${rules.noDeletePaths.length}`));
					lines.push("");
					lines.push(th.fg("muted", `  Path overrides: ${rules.pathOverrides?.length || 0}`));
					lines.push("");
					const cursor0 = this.cursor === 0 ? th.fg("accent", " ▶ ") : "   ";
					lines.push(`${cursor0}${th.fg("muted", "Reload rules from disk")}  ${th.fg("dim", "(/dc-reload)")}`);
					break;
				}
				case "permissions": {
					lines.push(th.fg("muted", "  Deletion protection:"));
					lines.push("");
					const options = ["ask", "allowed", "blocked"];
					options.forEach((opt, i) => {
						const selected = sessionDeletePermission === opt;
						const marker = this.cursor === i
							? (selected ? th.fg("success", " ● ") : th.fg("accent", " ○ "))
							: (selected ? th.fg("success", " ● ") : th.fg("dim", " ○ "));
						const label = selected ? th.fg("accent", opt.charAt(0).toUpperCase() + opt.slice(1)) : th.fg("dim", opt);
						const desc = opt === "ask" ? "— prompt each time" : opt === "allowed" ? "— no prompts" : "— always block";
						if (this.cursor === i) {
							lines.push(` ${marker}${label} ${th.fg("dim", desc)}`);
						} else {
							lines.push(` ${marker}${label}  ${th.fg("dim", desc)}`);
						}
					});
					break;
				}
			}

			lines.push("");
			lines.push(th.fg("dim", "  Press Enter on an item to modify it"));

			return lines;
		}
	}

	/**
	 * Checks if any path override applies to the given target path/tool.
	 * Overrides take absolute precedence over all other rules.
	 */
	function checkPathOverrides(cwd: string, targetPath: string, toolName: string, command?: string): { blocked: boolean; reason: string | null } {
		if (!rules.pathOverrides || rules.pathOverrides.length === 0) {
			return { blocked: false, reason: null };
		}

		const resolvedTarget = resolvePath(targetPath, cwd);

		for (const override of rules.pathOverrides) {
			if (!isPathMatch(resolvedTarget, override.path, cwd)) {
				continue;
			}

			// Determine if this is a deletion operation
			const isDeleteOp = toolName === "bash" && command && /\b(rm|rmdir|unlink)\b/.test(command);

			// Check operation-specific allow flags
			if (isDeleteOp && override.allowDeletions === false) {
				return { blocked: true, reason: `Path override: Deletion blocked for path matching ${override.path}` };
			}

			if (toolName === "write") {
				if (override.allowWrites === false) {
					return { blocked: true, reason: `Path override: Write/create blocked for path matching ${override.path}` };
				}
				// Additional write location restriction: allowWriteIn
				if (override.allowWrites !== false && override.allowWriteIn) {
					// allowWriteIn can be absolute or relative to cwd; use isPathMatch directly
					if (!isPathMatch(resolvedTarget, override.allowWriteIn, cwd)) {
						return { blocked: true, reason: `Path override: Write not permitted at this location; only allowed in paths matching ${override.allowWriteIn}` };
					}
				}
			}

			if (toolName === "edit" || toolName === "replace") {
				if (override.allowEdits === false) {
					return { blocked: true, reason: `Path override: Edit/modify blocked for path matching ${override.path}` };
				}
			}

			if (toolName === "read" || toolName === "grep" || toolName === "find" || toolName === "ls") {
				if (override.allowReads === false) {
					return { blocked: true, reason: `Path override: Read/access blocked for path matching ${override.path}` };
				}
			}
		}

		return { blocked: false, reason: null };
	}

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		modalCtx = ctx.ui;

		const projectRulesPath = path.join(ctx.cwd, ".pi", "damage-control-rules.yaml");
		const globalRulesPath = path.join(os.homedir(), ".pi", "damage-control-rules.yaml");
		const rulesPath = fs.existsSync(projectRulesPath) ? projectRulesPath : fs.existsSync(globalRulesPath) ? globalRulesPath : null;
		try {
			if (rulesPath) {
				const content = fs.readFileSync(rulesPath, "utf8");
			const loaded = yamlParse(content) as Partial<Rules>;
			rules = {
				bashToolPatterns: loaded.bashToolPatterns || [],
				zeroAccessPaths: loaded.zeroAccessPaths || [],
				readOnlyPaths: loaded.readOnlyPaths || [],
				noDeletePaths: loaded.noDeletePaths || [],
				pathOverrides: loaded.pathOverrides || [],
				projectRoot: loaded.projectRoot,
			};

				if (rules.projectRoot) {
					writeAllowedRoot = resolvePath(rules.projectRoot, ctx.cwd);
				}

				const source = rulesPath === projectRulesPath ? "project" : "global";
				ctx.ui.notify(`🛡️ Damage-Control: Loaded ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length} rules (${source}).`);
				if (writeAllowedRoot) {
					ctx.ui.notify(`🏗️ Project Isolation: Write access restricted to ${writeAllowedRoot}`);
				}
			} else {
				ctx.ui.notify("🛡️ Damage-Control: No rules found at .pi/damage-control-rules.yaml (project or global)");
			}
		} catch (err) {
			ctx.ui.notify(`🛡️ Damage-Control: Failed to load rules: ${err instanceof Error ? err.message : String(err)}`);
		}

		const status = writeAllowedRoot
			? `🛡️ Isolation: ${path.basename(writeAllowedRoot)} | Rules Active`
			: `🛡️ Damage-Control Active: ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length} Rules`;
		ctx.ui.setStatus(status);
	});

	pi.registerCommand("dc-set-project", {
		description: "Set the root directory where write/edit access is allowed.",
		handler: async (args, ctx) => {
			if (!args?.trim()) {
				writeAllowedRoot = null;
				ctx.ui.notify("Project isolation disabled. Write access restored to all non-restricted paths.", "info");
			} else {
				writeAllowedRoot = resolvePath(args.trim(), ctx.cwd);
				ctx.ui.notify(`Project isolation enabled. Write access restricted to: ${writeAllowedRoot}`, "success");
			}
			const status = writeAllowedRoot
				? `🛡️ Isolation: ${path.basename(writeAllowedRoot)} | Rules Active`
				: `🛡️ Damage-Control Active: ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length} Rules`;
			ctx.ui.setStatus(status);
		}
	});

	pi.registerCommand("dc-reload", {
		description: "Reload damage-control rules from .pi/damage-control-rules.yaml",
		handler: async (_args, ctx) => {
			// Re-load rules from disk
			const projectRulesPath = path.join(ctx.cwd, ".pi", "damage-control-rules.yaml");
			const globalRulesPath = path.join(os.homedir(), ".pi", "damage-control-rules.yaml");
			const rulesPath = fs.existsSync(projectRulesPath) ? projectRulesPath : fs.existsSync(globalRulesPath) ? globalRulesPath : null;

			if (!rulesPath) {
				ctx.ui.notify("No rules file found at .pi/damage-control-rules.yaml", "warning");
				return;
			}

			try {
				const content = fs.readFileSync(rulesPath, "utf8");
				const loaded = yamlParse(content) as Partial<Rules>;
				rules = {
					bashToolPatterns: loaded.bashToolPatterns || [],
					zeroAccessPaths: loaded.zeroAccessPaths || [],
					readOnlyPaths: loaded.readOnlyPaths || [],
					noDeletePaths: loaded.noDeletePaths || [],
					pathOverrides: loaded.pathOverrides || [],
					projectRoot: loaded.projectRoot,
				};
				if (rules.projectRoot) {
					writeAllowedRoot = resolvePath(rules.projectRoot, ctx.cwd);
				} else {
					writeAllowedRoot = null;
				}

				const source = rulesPath === projectRulesPath ? "project" : "global";
				ctx.ui.notify(`🛡️ Reloaded ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length} rules (${source}).`, "success");

				const status = writeAllowedRoot
					? `🛡️ Isolation: ${path.basename(writeAllowedRoot)} | Rules Active`
					: `🛡️ Damage-Control Active: ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length} Rules`;
				ctx.ui.setStatus(status);
			} catch (err) {
				ctx.ui.notify(`Failed to reload rules: ${err instanceof Error ? err.message : String(err)}`, "error");
			}
		}
	});

	pi.registerCommand("damage-control", {
		description: "Open Damage Control settings and status modal",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("damage-control modal requires interactive mode", "error");
				return;
			}

			modalCtx = ctx.ui;

			const modal = new DamageControlModal(
				ctx.theme,
				() => {
					ctx.ui.setWidget(modalWidgetKey, undefined);
					modalCtx = null;
				},
				ctx.cwd,
			);

			ctx.ui.setWidget(modalWidgetKey, (_tui, theme) => ({
				render: (w) => modal.render(w),
				handleInput: (data) => modal.handleInput(data),
				invalidate: () => modal.invalidate(),
			}), { placement: "aboveEditor" });
		},
	});

	pi.on("tool_call", async (event, ctx) => {
		let violationReason: string | null = null;
		let shouldAsk = false;
		let isDeletion = false;

		// 1. Extract paths from tool input
		const inputPaths: string[] = [];
		if (isToolCallEventType("read", event) || isToolCallEventType("write", event) || isToolCallEventType("edit", event) || isToolCallEventType("replace", event)) {
			inputPaths.push(event.input.path);
		} else if (isToolCallEventType("grep", event) || isToolCallEventType("find", event) || isToolCallEventType("ls", event)) {
			inputPaths.push(event.input.path || ".");
		}

		// 1.5. Path Override Check (HIGHEST PRIORITY - runs before ALL other rules)
		if (!violationReason) {
			// Collect all paths to check: file tool paths + bash command paths
			const pathsToCheck = new Set<string>();
			for (const p of inputPaths) {
				try {
					pathsToCheck.add(resolvePath(p, ctx.cwd));
				} catch {}
			}

			// Also extract paths from bash commands
			if (isToolCallEventType("bash", event)) {
				const command = event.input.command;
				// Extract absolute and home-expanded paths from bash command
				const extractedPaths = command.match(/\/[^\s;|<>|]+|~\/[^\s;|<>|]+/g) || [];
				for (const p of extractedPaths) {
					try {
						pathsToCheck.add(resolvePath(p, ctx.cwd));
					} catch {}
				}
			}

			// Check each path against overrides
			for (const checkPath of pathsToCheck) {
				const overrideResult = checkPathOverrides(ctx.cwd, checkPath, event.toolName, isToolCallEventType("bash", event) ? event.input.command : undefined);
				if (overrideResult.blocked) {
					violationReason = overrideResult.reason;
					break;
				}
			}
		}

		// 2. Project Isolation & Deletion Check
		if (!violationReason) {
			const isModifyingTool = isToolCallEventType("write", event) || isToolCallEventType("edit", event) || isToolCallEventType("replace", event);
			
			if (isModifyingTool) {
				const target = resolvePath(event.input.path, ctx.cwd);
				if (writeAllowedRoot && !isPathWithin(target, writeAllowedRoot)) {
					violationReason = `Write access denied: Path ${event.input.path} is outside the allowed project root (${writeAllowedRoot})`;
				}
			} else if (isToolCallEventType("bash", event)) {
				const command = event.input.command;
				const isDeleteCmd = /\b(rm|rmdir|unlink)\b/.test(command);
				const mightModify = isDeleteCmd || /[\s>|]/.test(command) || /\b(mv|sed|tee|touch|mkdir|cp|git)\b/.test(command);
				
				if (isDeleteCmd) isDeletion = true;

				if (mightModify && writeAllowedRoot) {
					const pathsInCmd = command.match(/\/[^\s;|<>|]+/g) || [];
					for (const p of pathsInCmd) {
						if (path.isAbsolute(p) && !isPathWithin(p, writeAllowedRoot)) {
							violationReason = `Bash command may modify files outside project root: ${p}`;
							break;
						}
					}
				}
			}
		}

		// 3. Deletion Protection Confirmation
		if (isDeletion && !violationReason) {
			if (sessionDeletePermission === "blocked") {
				violationReason = "File deletion is blocked for this session.";
			} else if (sessionDeletePermission === "ask") {
				const options = [
					"Yes, allow this deletion",
					"Yes, allow deletions for this session",
					"No, block this deletion",
					"No, block all deletions for this session"
				];
				const choice = await ctx.ui.select("🛡️ Deletion Protection: Allow deletion?", options);
				
				if (choice === options[0]) {
					// Allowed this time
				} else if (choice === options[1]) {
					sessionDeletePermission = "allowed";
				} else if (choice === options[2] || choice === undefined) {
					violationReason = "User denied deletion request.";
				} else if (choice === options[3]) {
					sessionDeletePermission = "blocked";
					violationReason = "File deletion is blocked for this session.";
				}
			}
		}

		// 4. Check Zero Access Paths for all tools that use path or glob
		if (!violationReason) {
			const checkPaths = (pathsToCheck: string[]) => {
				for (const p of pathsToCheck) {
					const resolved = resolvePath(p, ctx.cwd);
					for (const zap of rules.zeroAccessPaths) {
						if (isPathMatch(resolved, zap, ctx.cwd)) {
							return `Access to zero-access path restricted: ${zap}`;
						}
					}
				}
				return null;
			};

			if (isToolCallEventType("grep", event) && event.input.glob) {
				// Check glob field as well
				for (const zap of rules.zeroAccessPaths) {
					if (event.input.glob.includes(zap) || isPathMatch(event.input.glob, zap, ctx.cwd)) {
						violationReason = `Glob matches zero-access path: ${zap}`;
						break;
					}
				}
			}

			if (!violationReason) {
				violationReason = checkPaths(inputPaths);
			}
		}

		// 5. Tool-specific logic (Original Damage Control)
		if (!violationReason) {
			if (isToolCallEventType("bash", event)) {
				const command = event.input.command;

				// Check bashToolPatterns
				for (const rule of rules.bashToolPatterns) {
					const regex = new RegExp(rule.pattern);
					if (regex.test(command)) {
						violationReason = rule.reason;
						shouldAsk = !!rule.ask;
						break;
					}
				}

				// Check if bash command interacts with restricted paths
				if (!violationReason) {
					for (const zap of rules.zeroAccessPaths) {
						if (command.includes(zap)) {
							violationReason = `Bash command references zero-access path: ${zap}`;
							break;
						}
					}
				}

				if (!violationReason) {
					for (const rop of rules.readOnlyPaths) {
						// Heuristic: check if command might modify a read-only path
						if (command.includes(rop) && (/[\s>|]/.test(command) || /\b(rm|mv|sed|tee|touch|mkdir|rmdir|cp)\b/.test(command))) {
							violationReason = `Bash command may modify read-only path: ${rop}`;
							break;
						}
					}
				}

				if (!violationReason) {
					for (const ndp of rules.noDeletePaths) {
						if (command.includes(ndp) && (command.includes("rm") || command.includes("mv"))) {
							violationReason = `Bash command attempts to delete/move protected path: ${ndp}`;
							break;
						}
					}
				}
			} else if (isToolCallEventType("write", event) || isToolCallEventType("edit", event) || isToolCallEventType("replace", event)) {
				// Check Read-Only paths
				for (const p of inputPaths) {
					const resolved = resolvePath(p, ctx.cwd);
					for (const rop of rules.readOnlyPaths) {
						if (isPathMatch(resolved, rop, ctx.cwd)) {
							violationReason = `Modification of read-only path restricted: ${rop}`;
							break;
						}
					}
				}
			}
		}

		if (violationReason) {
			if (shouldAsk) {
				const confirmed = await ctx.ui.confirm("🛡️ Damage-Control Confirmation", `Dangerous command detected: ${violationReason}\n\nCommand: ${isToolCallEventType("bash", event) ? event.input.command : JSON.stringify(event.input)}\n\nDo you want to proceed?`, { timeout: 30000 });

				if (!confirmed) {
					ctx.ui.setStatus(`⚠️ Last Violation Blocked: ${violationReason.slice(0, 30)}...`);
					pi.appendEntry("damage-control-log", { tool: event.toolName, input: event.input, rule: violationReason, action: "blocked_by_user" });
					ctx.abort();
					return { block: true, reason: `🛑 BLOCKED by Damage-Control: ${violationReason} (User denied)\n\nDO NOT attempt to work around this restriction. DO NOT retry with alternative commands, paths, or approaches that achieve the same result. Report this block to the user exactly as stated and ask how they would like to proceed.` };
				} else {
					pi.appendEntry("damage-control-log", { tool: event.toolName, input: event.input, rule: violationReason, action: "confirmed_by_user" });
					return { block: false };
				}
			} else {
				ctx.ui.notify(`🛑 Damage-Control: Blocked ${event.toolName} due to ${violationReason}`);
				ctx.ui.setStatus(`⚠️ Last Violation: ${violationReason.slice(0, 30)}...`);
				pi.appendEntry("damage-control-log", { tool: event.toolName, input: event.input, rule: violationReason, action: "blocked" });
				ctx.abort();
				return { block: true, reason: `🛑 BLOCKED by Damage-Control: ${violationReason}\n\nDO NOT attempt to work around this restriction. DO NOT retry with alternative commands, paths, or approaches that achieve the same result. Report this block to the user exactly as stated and ask how they would like to proceed.` };
			}
		}

		return { block: false };
	});
}

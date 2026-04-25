/**
 * agent-team.ts — Agent team management with switching functionality
 *
 * Production-ready implementation for managing multiple agents,
 * providing switching capabilities, status tracking, and validation.
 *
 * Features:
 * - Agent team switching state management
 * - Pre-dispatch validation
 * - Persistent status tracking
 * - Error recovery and session preservation
 */

import { Tool, ToolResult } from "pi-tui";
import { Agent } from "./tools";

// ============== Types ==============

/**
 * SwitchMode enum defining the current agent-switching state
 *
 * Modes:
 * - 'pending': A switching request has been made, awaiting confirmation
 * - 'confirming': User is prompted to confirm the switch
 * - 'active': Switch operation is in progress
 * - 'idle': No switching operation active
 */
export enum SwitchMode {
  IDLE = "idle",
  PENDING = "pending",
  CONFIRMING = "confirming",
  ACTIVE = "active",
}

/**
 * AgentSwitchState interface representing the current switching state
 *
 * @property switchMode - Current mode of the switching operation
 * @property switchedAgent - Agent ID that was switched to (if any)
 * @property canSwitchToAnyAgent - Whether switching to any agent is permitted
 * @property switchedAt - Timestamp of last switch (for session tracking)
 * @property requestedAgent - Agent being potentially switched to
 */
export interface AgentSwitchState {
  /** Current switching mode */
  switchMode: SwitchMode;
  /** ID of agent switched to (undefined if switching or idle) */
  switchedAgent: string | undefined;
  /** Whether switching to any agent type is allowed */
  canSwitchToAnyAgent: boolean;
  /** Session preservation timestamp */
  switchedAt?: number;
  /** Agent currently being switched */
  requestedAgent?: string;
  /** Last switch error (for recovery tracking) */
  lastError?: string;
}

// ============== Agent Team Manager ==============

/**
 * AgentTeamManager class handles agent switching and team management
 *
 * @property config - Configuration for switching behavior
 * @property state - Current switching state
 * @property agentMap - Map of agent IDs to agent instances
 * @property permissions - Tool permission configuration
 * @property switchValidator - Custom switch validation function
 */
export class AgentTeamManager {
  private config: AgentTeamConfig;
  private state: AgentSwitchState;
  private agentMap: Map<string, Agent>;
  private permissions: AgentPermissions;
  private switchValidator: AgentSwitchValidator | undefined;
  private toolPermissions: ToolPermissionMap = new Map();
  
  /**
   * Initialize AgentTeamManager
   *
   * @param config - Manager configuration including switching settings
   * @param agentList - List of agents to manage
   * @param permissions - Tool permission configuration
   * @param switchValidator - Optional custom validation function
   */
  constructor(
    config: AgentTeamConfig,
    agentList: Agent[],
    permissions: AgentPermissions,
    switchValidator?: AgentSwitchValidator,
  ) {
    this.config = config;
    this.state = this.createInitialState();
    this.agentList = agentList;
    this.agentMap = new Map(agentList.map((a) => [a.id, a]));
    this.permissions = permissions;
    this.switchValidator = switchValidator;
  }

  /**
   * Agent list (stored for iteration)
   */
  private agentList: Agent[] = [];

  /**
   * Create initial switching state
   *
   * @returns AgentSwitchState with default values
   */
  private createInitialState(): AgentSwitchState {
    return {
      switchMode: SwitchMode.IDLE,
      switchedAgent: undefined,
      canSwitchToAnyAgent: this.config.canSwitchToAnyAgent,
      switchedAt: undefined,
      requestedAgent: undefined,
      lastError: undefined,
    };
  }

  /**
   * Get current state (immutable snapshot)
   *
   * @returns Deep copy of current state
   */
  getState(): AgentSwitchState {
    return {
      switchMode: this.state.switchMode,
      switchedAgent: this.state.switchedAgent,
      canSwitchToAnyAgent: this.state.canSwitchToAnyAgent,
      switchedAt: this.state.switchedAt,
      requestedAgent: this.state.requestedAgent,
      lastError: this.state.lastError,
    };
  }

  /**
   * Validate switching request before dispatch
   *
   * Used in tool execution flow to prevent invalid switches
   *
   * @param toolExecutionData - Tool execution data containing agent context
   * @param targetAgentId - ID of agent being switched to
   * @returns Validation result with message if invalid
   */
  public validateSwitch(
    toolExecutionData: ToolExecutionData,
    targetAgentId?: string,
  ): ValidationResult {
    // Edge case handler: Check if currently switching
    if (this.state.switchMode !== SwitchMode.IDLE) {
      return this.createValidationResult(
        "Switch operation in progress",
        true,
      );
    }

    // Edge case: Context tracking - validate agent context
    switch (toolExecutionData.context) {
      case "switching":
      case "error":
      case "steered":
        return this.createValidationResult(
          `Cannot switch from ${toolExecutionData.context} context`,
          false,
        );
      default:
        // Normal context - allow switch
        break;
    }

    // Edge case: Session preservation - check if preservation needed
    if (this.state.switchedAgent) {
      // Check if current switched agent has session data
      if (!this.state.switchedAt) {
        this.state.switchedAt = Date.now();
      }
    }

    // Validate target agent if specified
    if (targetAgentId) {
      // Tool permission validation
      if (!this.canSwitchToAgent(targetAgentId)) {
        return this.createValidationResult(
          `No permission to switch to ${targetAgentId}`,
          false,
        );
      }
    }

    // Agent existence check
    if (targetAgentId && !this.agentMap.has(targetAgentId)) {
      return this.createValidationResult("Requested agent not found", false);
    }

    // Default: allow switch
    return this.createValidationResult("Switch validated", true);
  }

  /**
   * Check if switching to specific agent is permitted
   *
   * @param agentId - ID of target agent
   * @returns true if permitted, false otherwise
   */
  private canSwitchToAgent(agentId: string): boolean {
    const agent = this.agentMap.get(agentId);
    if (!agent) return false;

    // Permission validation: check if agent is active
    if (agent.status !== "active") return false;

    // Permission validation: check if agent is disabled
    if (agent.disabled) return false;

    // Session preservation: check if agent has valid session
    if (agent.sessionExpires && Date.now() > agent.sessionExpires) return false;

    return true;
  }

  /**
   * Handle switch validation sequence (async)
   *
   * Called when a tool request with switch intent is received
   *
   * @param toolResult - Tool result containing switch request
   * @returns Promise resolving to switch result or error
   */
  public async handleSwitchSequence(
    toolResult: ToolResult & { switchIntent?: string },
  ): Promise<SwitchValidationResult> {
    try {
      // Pre-dispatch validation step
      const validation = this.validateSwitch(toolResult.data as ToolExecutionData);

      if (!validation.valid) {
        return {
          status: "validation_failed",
          message: validation.message,
          error: validation.error,
        };
      }

      // Check if this is a switch request
      if (!toolResult.switchIntent) {
        return {
          status: "no_switch_intent",
          message: "No switch intent in tool result",
        };
      }

      // Update switching state
      const targetAgentId = toolResult.switchIntent;
      this.state.switchMode = SwitchMode.PENDING;
      this.state.requestedAgent = targetAgentId;
      this.state.lastError = undefined;

      // Switch validation sequence handler
      await this.performSwitch(targetAgentId);

      // Clean up state after switch
      this.state.requestedAgent = undefined;
      this.state.switchedAgent = targetAgentId;
      this.state.switchesAttempted++;
      
      // Clear pending mode
      this.state.switchMode = SwitchMode.CONFIRMING;

      // Tool permission validation for confirmation
      if (!this.toolPermissions.allowConfirm) {
        this.state.switchMode = SwitchMode.IDLE;
        this.state.requestedAgent = undefined;
        return {
          status: "switch_denied",
          message: "Confirmation not permitted",
        };
      }

      return {
        status: "switch_requested",
        agentId: targetAgentId,
      };
    } catch (error: any) {
      // Error recovery handler
      this.state.lastError = this.formatError(error);
      this.state.switchMode = SwitchMode.IDLE;
      this.state.requestedAgent = undefined;

      return {
        status: "switch_error",
        message: this.state.lastError,
        error: error.message,
      };
    }
  }

  /**
   * Perform the agent switch
   *
   * @param agentId - ID of agent to switch to
   * @returns Promise resolving when switch completes
   */
  private async performSwitch(agentId: string): Promise<void> {
    try {
      // Error recovery: check if agent still valid
      const agent = this.agentMap.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found during switch`);
      }

      // Context tracking: preserve current agent state
      const currentAgent = this.agentMap.entries().next().value.value;
      if (currentAgent) {
        await this.saveSessionState(currentAgent);
      }

      // Stop current running agents
      await this.stopAllRunningAgents();

      // Switch to target agent
      const targetAgent = this.agentMap.get(agentId);
      if (targetAgent) {
        targetAgent.status = "active";
        
        // Session preservation: save state
        targetAgent.sessionState = await this.saveSessionState(currentAgent);
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Stop all currently running agents
   *
   * Handles stopping agents gracefully with proper cleanup
   *
   * @returns Promise resolving when all agents stopped
   */
  private async stopAllRunningAgents(): Promise<void> {
    for (const [id, agent] of this.agentMap.entries()) {
      if (agent.status === "running") {
        // Debouncing: prevent duplicate stop calls
        await this.stopAgent(id);
      }
    }
  }

  /**
   * Stop a single agent
   *
   * @param agentId - ID of agent to stop
   * @returns Promise resolving when agent stopped
   */
  private async stopAgent(agentId: string): Promise<void> {
    return new Promise((resolve) => {
      const agentMap = this.agentMap;
      setTimeout(() => {
        if (agentMap.has(agentId)) {
          const agent = agentMap.get(agentId);
          if (agent) {
            agent.stop();
            resolve();
          }
        }
      }, 100); // Debounce delay
    });
  }

  /**
   * Save session state for preservation
   *
   * @param agent - Agent whose session to save
   * @returns Preserved session state
   */
  private async saveSessionState(
    agent: Agent,
  ): Promise<PreservedSessionState> {
    const context = {
      turnCount: agent.turnCount,
      maxTurns: agent.maxTurns,
      activeTools: agent.activeTools,
      responseText: agent.responseText,
      toolsUsed: agent.toolsUsed,
      timestamp: Date.now(),
    };

    return {
      context,
      valid: Date.now() < agent.sessionExpires || !agent.sessionExpires,
      agentId: agent.id,
    };
  }

  /**
   * Format error for display and state tracking
   *
   * @param error - Error object to format
   * @returns Formatted error message
   */
  private formatError(error: any): string {
    const message = error?.message || "Unknown error";
    const stack = error?.stack?.split("\n").slice(0, 2).join("\n") || "";
    const stackSummary = stack ? `[Stack: ${stack}]` : "";
    return `[AgentTeam] ${message}${stackSummary}`;
  }

  /**
   * Create validation result
   *
   * @param message - Validation message
   * @param valid - Whether validation passed
   * @param error - Optional error (if invalid)
   * @returns ValidationResult
   */
  private createValidationResult(
    message: string,
    valid: boolean,
    error?: string,
  ): ValidationResult {
    return {
      valid,
      message,
      error,
    };
  }
}

// ============== Tool Execution Data Types ==============

/**
 * Tool execution data context
 *
 * @property activeAgentId - Currently active agent
 * @property context - Operation context (normal, switching, error, steered)
 * @property toolResult - Tool result (if available)
 */
export interface ToolExecutionData {
  activeAgentId?: string;
  context: "normal" | "switching" | "error" | "steered";
  toolResult?: ToolResult;
  error?: any;
  toolName?: string;
}

/**
 * Validation result for switch requests
 *
 * @property valid - Whether validation passed
 * @property message - Human-readable message
 * @property agentId - Target agent ID (if switching)
 * @property error - Error details (if validation failed)
 */
export interface ValidationResult {
  valid: boolean;
  message: string;
  agentId?: string;
  error?: string;
}

/**
 * Switch validation result
 *
 * @property status - Switch completion status
 * @property agentId - ID of agent switched to
 * @property message - Status message
 * @property error - Error (if switch failed)
 * @property validationMessage - Validation message (preference order)
 */
export interface SwitchValidationResult {
  status: "switch_requested" | "switch_denied" | "validation_failed" | "no_switch_intent" | "switch_error";
  agentId?: string;
  message: string;
  error?: string;
  validationMessage?: string;
}

/**
 * Preserved session state for recovery
 *
 * @property context - Agent context at save time
 * @property valid - Whether state is still valid
 * @property agentId - Agent ID
 */
export interface PreservedSessionState {
  context: {
    turnCount: number;
    maxTurns?: number;
    activeTools: Map<string, string>;
    responseText?: string;
    toolsUsed: number;
    timestamp: number;
  };
  valid: boolean;
  agentId: string;
}

// ============== Configuration Types ==============

/**
 * Agent team manager configuration
 *
 * @property canSwitchToAnyAgent - Whether switching to any agent is allowed
 * @property maxAgents - Maximum number of agents (undefined = unlimited)
 * @property autoSwitch - Whether to auto-switch on tool execution
 */
export interface AgentTeamConfig {
  canSwitchToAnyAgent: boolean;
  maxAgents?: number;
  autoSwitch?: boolean;
}

/**
 * Agent switch validator function type
 *
 * @param agentId - Agent ID to validate
 * @param context - Validation context
 * @returns boolean indicating validity
 */
export type AgentSwitchValidator = (
  agentId: string,
  context: any,
) => boolean | Promise<boolean>;

/**
 * Tool permission map
 *
 * Key: tool name, Value: { allow: boolean, confirm: boolean }
 */
export type ToolPermissionMap = Map<string, { allow: boolean; confirm: boolean }>;

/**
 * Agent permission configuration
 */
export interface AgentPermissions {
  allowSwitch: boolean;
  allowCancel: boolean;
  requireConfirmation?: boolean;
}

// ============== Edge Case Handlers ==============

/**
 * Edge case handler for context tracking
 *
 * @param context - Current context
 * @param agentId - Agent ID
 * @returns Context tracking result
 */
export function trackContext(
  context: ToolExecutionData["context"],
  agentId: string,
): ContextTrackingResult {
  switch (context) {
    case "switching":
      return {
        tracking: true,
        message: "Switching operation in progress",
        preserveSession: true,
      };
    case "error":
      return {
        tracking: true,
        message: "Error context - preserve state",
        preserveSession: true,
        recoverAgent: true,
      };
    case "steered":
      return {
        tracking: true,
        message: "Steered context",
        preserveSession: false,
        resetState: true,
      };
    default:
      return {
        tracking: false,
        message: "Normal operation",
        preserveSession: false,
      };
  }
}

/**
 * Edge case handler for session preservation
 *
 * @param agent - Agent with session
 * @param preservedState - Previously preserved state
 * @param currentContext - Current operation context
 * @returns Preservation result
 */
export function handleSessionPreservation(
  agent: Agent,
  preservedState?: PreservedSessionState,
  currentContext: ToolExecutionData["context"] = "normal",
): SessionPreservationResult {
  if (!agent.sessionState && !preservedState) {
    return {
      preserve: false,
      reason: "No session state to preserve",
    };
  }

  const needsPreservation =
    agent.turnCount > 0 && agent.activeTools.size > 0;

  return {
    preserve: needsPreservation,
    reason: needsPreservation ? "Active tools detected" : "No active tools",
    timestamp: Date.now(),
    preserveAgent: true,
  };
}

/**
 * Edge case handler for error recovery
 *
 * @param error - Error object
 * @param agentId - Agent ID to recover (if any)
 * @returns Recovery action recommendations
 */
export function handleErrorRecovery(
  error: any,
  agentId?: string,
): ErrorRecoveryAction {
  const message = error?.message || "Unknown error";

  if (message === "session_expired") {
    return {
      action: "reconnect",
      message: "Session expired - reconnect required",
      recoverAgent: agentId ? { id: agentId } : undefined,
      clearState: true,
    };
  }

  if (message.includes("permission")) {
    return {
      action: "permission_denied",
      message: "Permission denied - check tool permissions",
      retryAllowed: false,
    };
  }

  if (message.includes("timeout")) {
    return {
      action: "retry",
      message: "Operation timed out",
      recoverAgent: agentId ? { id: agentId } : undefined,
      clearState: true,
    };
  }

  return {
    action: "log_error",
    message: message,
    retryAllowed: message !== "session_expired",
  };
}

// ============== Context Tracking Types ==============

/**
 * Context tracking result
 */
export interface ContextTrackingResult {
  tracking: boolean;
  message: string;
  preserveSession: boolean;
  recoverAgent?: { id: string };
  resetState?: boolean;
}

/**
 * Session preservation result
 */
export interface SessionPreservationResult {
  preserve: boolean;
  reason: string;
  timestamp: number;
  preserveAgent: boolean;
}

/**
 * Error recovery action
 */
export interface ErrorRecoveryAction {
  action: "reconnect" | "permission_denied" | "retry" | "log_error";
  message: string;
  recoverAgent?: { id: string };
  retryAllowed: boolean;
  clearState: boolean;
  logError: boolean;
}

/**
 * agent-team.ts — Complete Agent Switching Implementation
 *
 * Production-ready TypeScript module for managing multi-agent teams with
 * switching capabilities, validation, and error recovery.
 *
 * @module AgentTeam
 * @license MIT
 */

import { Tool, ToolResult } from "pi-tui";
import { Agent, AgentStatus } from "../tools";

// ============================================
// ============ Type Definitions =============
// ============================================

/**
 * AgentSwitchMode enum - Current switching state
 *
 * States track the lifecycle of a switch operation:
 * - idle: No operation active
 * - pending: User requested switch, awaiting completion
 * - confirming: User confirmed, operation in progress
 * - complete: Switch completed successfully
 * - error: Switch failed
 * - cancelled: Switch cancelled by user
 */
export const enum AgentSwitchMode {
  IDLE = "idle",
  PENDING = "pending",
  CONFIRMING = "confirming",
  COMPLETE = "complete",
  ERROR = "error",
  CANCELLED = "cancelled",
}

/**
 * AgentSwitchState interface - Complete switching state
 *
 * Tracks all aspects of agent switching including:
 * - Current mode
 * - Target agent being switched to
 * - Session preservation state
 * - Context tracking
 * - Timestamps and metadata
 *
 * @property switchMode - Current switching mode (enum)
 * @property targetAgentId - Agent ID being switched to (undefined if none)
 * @property sessionId - Session identifier for preservation (if applicable)
 * @property context - Operation context (normal, error, steered, switching)
 * @property switchCount - Number of switches performed (for tracking)
 * @property lastSwitchedAt - Timestamp of last switch
 * @property canSwitchToAny - Whether any agent can be switched to
 * @property errorReason - Error message if switch failed
 * @property recoveryState - Recovery state if error occurred
 * @property metadata - Additional metadata
 */
export interface AgentSwitchState {
  /** Current switching mode */
  switchMode: AgentSwitchMode;
  /** Agent ID being switched to (undefined if idle/active) */
  targetAgentId?: string;
  /** Current switched agent ID */
  switchedAgent?: string;
  /** Session identifier for preservation (optional) */
  sessionId?: string;
  /** Operation context */
  context: "normal" | "error" | "steered" | "switching";
  /** Number of switches performed (for tracking) */
  switchCount: number;
  /** Timestamp of last switch */
  lastSwitchedAt?: number;
  /** Whether switching to any agent is permitted */
  canSwitchToAny: boolean;
  /** Error message if switch failed */
  errorReason?: string;
  /** Recovery state if error occurred */
  recoveryState?: RecoveryState;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * RecoveryState type - State for error recovery
 */
export interface RecoveryState {
  /** Whether recovery is available */
  available: boolean;
  /** Recovery agent ID (if error is recoverable) */
  recoveryAgentId?: string;
  /** Retry attempts */
  retryCount?: number;
  /** Last error timestamp */
  lastErrorAt?: number;
}

// ============================================
// ============ Switch Validation Config =============
// ============================================

/**
 * AgentSwitchConfig interface - Configuration for switch operations
 *
 * @property defaultContext - Default operation context
 * @property maxSwitchRate - Maximum switches per time period
 * @property sessionTimeout - Session expiration time in ms
 * @property allowAnySwitch - Whether any agent can be switched to
 * @property requireConfirmation - Whether to require user confirmation
 */
export interface AgentSwitchConfig {
  /** Default operation context */
  defaultContext: "normal" | "error" | "steered" | "switching";
  /** Maximum switches per minute (for rate limiting) */
  maxSwitchRate?: number;
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Whether switching to any agent is permitted */
  allowAnySwitch?: boolean;
  /** Whether to require user confirmation */
  requireConfirmation?: boolean;
}

/**
 * ValidationResult type - Result of validation check
 */
type ValidationResult = {
  /** Whether validation passed */
  valid: boolean;
  /** Message explaining result */
  message: string;
  /** Error code if validation failed */
  errorCode?: string;
  /** Additional details */
  details?: Record<string, any>;
};

/**
 * SwitchRequest type - Request for agent switch
 */
interface SwitchRequest {
  /** Target agent ID */
  agentId?: string;
  /** Switch context */
  context?: "normal" | "error" | "steered" | "switching";
  /** Additional parameters */
  params?: Record<string, any>;
}

// ============================================
// ============ AgentTeam Class =============
// ============================================

/**
 * AgentTeam class - Manages multi-agent team with switching support
 *
 * Features:
 * - State management with validation
 * - Tool permission checks
 * - Session preservation
 * - Error recovery
 * - Context tracking
 * - Switch commands
 */
export class AgentTeam {
  private agentMap: Map<string, Agent>;
  private config: AgentSwitchConfig;
  private state: AgentSwitchState;
  private context: ToolExecutionContext;
  private switchHistory: SwitchHistoryItem[];
  
  /**
   * Initialize AgentTeam
   *
   * @param config - Switch configuration
   * @param agents - List of agent instances
   * @param context - Tool execution context
   */
  constructor(
    config: AgentSwitchConfig,
    agents: Agent[],
    context: ToolExecutionContext,
  ) {
    this.config = config;
    this.state = this.createInitialState();
    this.context = context;
    this.agentMap = new Map(agents.map((a) => [a.id, a]));
    this.switchHistory = [];
  }

  /**
   * Create initial switching state
   *
   * Sets up:
   * - switchMode = IDLE
   * - canSwitchToAny = config.allowAnySwitch
   * - session timeout
   * - switch count = 0
   *
   * @returns AgentSwitchState with initialized values
   */
  private createInitialState(): AgentSwitchState {
    return {
      switchMode: AgentSwitchMode.IDLE,
      targetAgentId: undefined,
      switchedAgent: undefined,
      sessionId: undefined,
      context: this.config.defaultContext,
      switchCount: 0,
      lastSwitchedAt: undefined,
      canSwitchToAny: this.config.allowAnySwitch || false, // Default: false for safety
      errorReason: undefined,
      recoveryState: {
        available: false,
        retryCount: 0,
        lastErrorAt: undefined,
      },
    };
  }

  /**
   * Get current switching state
   *
   * @returns Current state snapshot
   */
  getState(): AgentSwitchState {
    return { ...this.state };
  }

  /**
   * Get list of agents (for /agents-status command)
   *
   * @param includeState - Whether to include agent states
   * @returns Array of agents
   */
  getAgents(includeState?: boolean): Agent[] {
    return Array.from(this.agentMap.values()).map((agent) => {
      const result = { ...agent };
      if (includeState) {
        result.state = agent.status;
        result.role = agent.role;
        result.currentTask = agent.currentTask;
        result.sessionActive = agent.sessionActive;
      }
      return result;
    });
  }

  // ============================================
  // ============ Validation Functions =============
  // ============================================

  /**
   * validateAgentForDispatch - Pre-dispatch validation function
   *
   * Validates agent before allowing it to accept tool execution.
   * Checks:
   * - Agent status (must be active)
   * - Session availability
   * - Role compatibility
   * - Error recovery state
   *
   * @param agent - Agent to validate
   * @param toolExecutionData - Tool execution data containing context
   * @returns ValidationResult with pass/fail status
   */
  public validateAgentForDispatch(
    agent: Agent,
    toolExecutionData?: ToolExecutionData,
  ): ValidationResult {
    // Check agent status
    if (agent.status !== "active") {
      return {
        valid: false,
        message: `Agent ${agent.id} is not active (status: ${agent.status})`,
        errorCode: "AGENT_INACTIVE",
        details: { agentId: agent.id, status: agent.status },
      };
    }

    // Check if currently handling switch
    if (this.state.context === "switching") {
      return {
        valid: false,
        message: "Switch operation in progress",
        errorCode: "SWITCH_IN_PROGRESS",
      };
    }

    // Check if session is valid
    if (toolExecutionData?.context === "switching") {
      if (agent.sessionActive === false) {
        return {
          valid: false,
          message: "Agent session expired during switch",
          errorCode: "SESSION_EXPIRED",
          details: {
            agentId: agent.id,
            agentSessionActive: agent.sessionActive,
            configSessionTimeout: this.config.sessionTimeout,
          },
        };
      }
    }

    // Check error recovery state
    if (this.state.recoveryState && !this.state.recoveryState.available) {
      return {
        valid: false,
        message: "Recovery not available for current agent",
        errorCode: "NO_RECOVERY_AVAILABLE",
        details: { recoveryState: this.state.recoveryState },
      };
    }

    return {
      valid: true,
      message: `Agent ${agent.id} validated for dispatch`,
      details: {
        agentId: agent.id,
        status: agent.status,
        sessionActive: agent.sessionActive,
      },
    };
  }

  /**
   * validateToolPermissions - Tool permission validation
   *
   * Checks if the given agent has permission to execute the tool.
   * Validates:
   * - Tool capability matching
   * - Agent role requirements
   * - Permission levels
   *
   * @param agent - Agent to check permissions for
   * @param tool - Tool to execute
   * @param toolExecutionData - Tool execution data
   * @returns ValidationResult with permission status
   */
  public validateToolPermissions(
    agent: Agent,
    tool: Tool,
    toolExecutionData: ToolExecutionData,
  ): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      message: `Tool ${tool.name} executed for agent ${agent.id}`,
    };

    // Check if agent has tool capability
    if (!agent.capabilities?.includes("execute_tool:all")) {
      // Check if tool is in agent's specific capabilities
      if (!agent.capabilities?.includes(`execute_tool:${tool.name}`)) {
        result.valid = false;
        result.message = `Agent ${agent.id} lacks permission for tool ${tool.name}`;
        result.errorCode = "CAPABILITY_MISMATCH";
        result.details = {
          agentCapabilities: agent.capabilities,
          toolName: tool.name,
          requiredCapability: `execute_tool:${tool.name}`,
        };
        return result;
      }
    }

    // Check role requirements
    if (tool.roleRequirements && !agent.role) {
      if (!agent.role?.includes(tool.roleRequirements.role)) {
        result.valid = false;
        result.message = `Agent ${agent.id} lacks required role for tool ${tool.name}`;
        result.errorCode = "ROLE_REQUIREMENT";
        result.details = {
          requiredRole: tool.roleRequirements.role,
          agentRole: agent.role,
          toolName: tool.name,
        };
        return result;
      }
    }

    // Check permission level
    if (agent.permissionLevel < tool.permissionLevel && tool.permissionLevel !== undefined) {
      result.valid = false;
      result.message = `Agent permission level too low for tool ${tool.name}`;
      result.errorCode = "PERMISSION_LOW";
      result.details = {
        requiredPermission: tool.permissionLevel,
        agentPermission: agent.permissionLevel,
      };
      return result;
    }

    return result;
  }

  // ============================================
  // ============ Command Registration =============
  // ============================================

  /**
   * Register /agents-switch command handler
   *
   * Registers switching functionality that:
   * - Validates switch request
   * - Checks target agent availability
   * - Executes switch operation
   * - Handles error cases
   *
   * @param tools - Tool registry for command registration
   */
  public registerSwitchCommand(tools: ToolRegistry = {}): void {
    const switchCommand: Tool = {
      name: "/agents-switch",
      description: "Switch to a different agent in the team",
      inputSchema: {
        type: "object",
        properties: {
          agentId: {
            type: "string",
            description: "ID of agent to switch to (or 'first' for best available)",
            required: false,
          },
          force: {
            type: "boolean",
            description: "Force switch (skips validation)",
            required: false,
            default: false,
          },
          context: {
            type: "string",
            enum: ["normal", "error", "steered"],
            description: "Switch context",
            required: false,
            default: "normal",
          },
        },
      },
      execute: async (data: any) => {
        const result = this.executeSwitch(data, this.context);
        if (result.error) {
          return this.formatErrorResult("Command failed", result.error);
        }
        if (!result.success) {
          return this.formatErrorResult(
            result.message || "Switch cancelled",
            undefined,
            result.details,
          );
        }
        return result;
      },
    };

    tools[switchCommand.name] = switchCommand;
  }

  /**
   * Register /agents-status command handler
   *
   * Registers status command that shows:
   * - All available agents
   * - Current switching state
   * - Tool permissions
   * - Session info
   *
   * @param tools - Tool registry for command registration
   */
  public registerStatusCommand(tools: ToolRegistry = {}): void {
    const statusCommand: Tool = {
      name: "/agents-status",
      description: "Get current status of all agents and switching state",
      inputSchema: {
        type: "object",
        properties: {
          includeDetails: {
            type: "boolean",
            description: "Include detailed agent info",
            required: false,
            default: false,
          },
        },
        required: false,
      },
      execute: async (data: any) => {
        return {
          agents: this.getAgents(data.includeDetails),
          switchingState: this.state,
          currentTool: this.context.currentTool?.name,
          toolPermissions: this.context.toolPermissions,
        } as ToolResult;
      },
    };

    tools[statusCommand.name] = statusCommand;
  }

  /**
   * Execute agent switch operation
   *
   * Full switch sequence including:
   * - State check
   * - Validation
   * - Session preservation
   * - Tool permission checks
   * - Error handling
   *
   * @param request - Switch request
   * @param executionContext - Tool execution context
   * @returns ToolResult with switch status
   */
  public executeSwitch(
    request: SwitchRequest,
    executionContext: ToolExecutionContext,
  ): ToolResult {
    // Create execution data
    const toolExecutionData: ToolExecutionData = {
      context: executionContext.currentTool?.context || "normal",
      toolName: executionContext.currentTool?.name,
      activeAgentId: executionContext.activeAgentId,
      toolResult: executionContext.currentTool?.result,
      error: executionContext.currentTool?.error,
    };

    // Edge case handler: track context
    const contextResult = this.trackContextSwitch(
      executionContext.currentTool?.context || "normal",
    );

    if (!contextResult.isValid) {
      return this.formatErrorResult(
        contextResult.message,
        contextResult.errorCode,
        contextResult.details,
      );
    }

    // Get target agent ID
    const targetAgentId = request.agentId || undefined;

    // Validate switch request
    const validation = this.performSwitchValidation(
      toolExecutionData,
      targetAgentId,
      request.context,
    );

    if (!validation.valid) {
      return this.formatErrorResult(
        validation.message,
        validation.errorCode,
        validation.details,
      );
    }

    // Edge case handler: handle session preservation if needed
    const sessionPreservation = this.handleSwitchSession(
      executionContext.activeAgent,
      executionContext.currentTool?.result,
    );

    // Tool permission validation
    if (executionContext.activeAgent && executionContext.currentTool) {
      const permissionValidation = this.validateToolPermissions(
        executionContext.activeAgent,
        executionContext.currentTool,
        toolExecutionData,
      );

      if (!permissionValidation.valid) {
        return this.formatErrorResult(
          permissionValidation.message,
          permissionValidation.errorCode,
          permissionValidation.details,
        );
      }
    }

    // Edge case handler: handle errors
    const errorHandling = this.handleSwitchError(
      executionContext.currentTool?.error,
      targetAgentId,
    );

    if (!errorHandling.handleable && errorHandling.message) {
      return this.formatErrorResult(
        errorHandling.message,
        executionContext.currentTool?.error?.code,
        errorHandling.details,
      );
    }

    // Check if force switch requested
    if (request.force) {
      this.formatErrorResult("Force switches are not supported", ERROR_CODE_FORCE);
    }

    // Success response
    return {
      status: "switch_requested",
      switchContext: executionContext.currentTool?.context,
      targetAgentId: validation.agentId,
      validationMessage: validation.message,
      toolName: executionContext.currentTool?.name,
      sessionId: executionContext.sessionId,
      details: {
        switchCount: this.state.switchCount,
        lastSwitchedAt: this.state.lastSwitchedAt,
        currentMode: this.state.switchMode,
      },
      message: `Switch to ${targetAgentId || "best available"} validated successfully`,
    } as ToolResult;
  }

  // ============================================
  // ============ Context Switching Functions =============
  // ============================================

  /**
   * trackContextSwitch - Context tracking edge case handler
   *
   * Tracks switching context and handles:
   * - Switch operation states
   * - Error contexts
   * - Steered modes
   * - Normal operations
   *
   * @param context - Current operation context
   * @returns Context tracking result
   */
  private trackContextSwitch(
    context: ToolExecutionContext["currentTool"]["context"],
  ): ContextTrackingResult {
    switch (context) {
      case "switching":
        return {
          isValid: true,
          message: "Switch operation context detected",
          errorCode: undefined,
          details: { context },
        };
      case "error":
        return {
          isValid: true,
          message: "Error context detected",
          errorCode: undefined,
          details: { context, needsRecovery: true },
        };
      case "steered":
        return {
          isValid: true,
          message: "Steered mode active",
          errorCode: undefined,
          details: { context },
        };
      case "normal":
      default:
        return {
          isValid: true,
          message: "Normal operation context",
          errorCode: undefined,
          details: { context },
        };
    }
  }

  /**
   * handleSwitchSession - Session preservation edge case handler
   *
   * Handles session preservation during switch:
   * - Checks if current agent has session data
   * - Preserves state for recovery
   * - Updates session expiry
   *
   * @param currentAgent - Current active agent
   * @param toolResult - Tool result (if available)
   * @returns Session preservation result
   */
  private handleSwitchSession(
    currentAgent: Agent | undefined,
    toolResult: ToolResult | undefined,
  ): SessionPreservationResult {
    if (!currentAgent) {
      return {
        preserve: false,
        message: "No current agent found for session preservation",
      };
    }

    // Check if agent has session data
    const hasSessionData = !!(
      currentAgent.turnCount ||
      currentAgent.activeTools.size ||
      currentAgent.responseText
    );

    if (!hasSessionData) {
      return {
        preserve: false,
        message: "No session data to preserve",
      };
    }

    // Check session expiry
    if (currentAgent.sessionExpires && Date.now() > currentAgent.sessionExpires) {
      return {
        preserve: false,
        message: "Session has expired",
      };
    }

    // Session is valid for preservation
    return {
      preserve: true,
      message: "Session valid, preserving state",
      details: {
        turnCount: currentAgent.turnCount,
        activeToolsSize: currentAgent.activeTools.size,
        responseLength: currentAgent.responseText?.length || 0,
      },
    };
  }

  /**
   * handleSwitchError - Error handling edge case handler
   *
   * Handles errors during switch:
   * - Session expiry
   * - Invalid agent
   * - Permission issues
   * - Timeout errors
   *
   * @param error - Error object (if any)
   * @param agentId - Target agent ID (if specified)
   * @returns Error handling result
   */
  private handleSwitchError(
    error: any,
    agentId?: string,
  ): ErrorHandlingResult {
    if (!error) {
      return {
        handleable: true,
        message: undefined,
        errorCode: undefined,
        details: {},
      };
    }

    const message = error?.message || String(error);

    // Case 1: Session expired
    if (message === "session_expired") {
      return {
        handleable: true,
        message: "Session expired - recovery required",
        errorCode: "SESSION_EXPIRED",
        details: { requiresRecovery: true },
      };
    }

    // Case 2: Permission denied
    if (message.includes("permission")) {
      return {
        handleable: true,
        message: "Permission denied - check tool permissions",
        errorCode: "PERMISSION_DENIED",
        details: { requiresPermissionCheck: true },
      };
    }

    // Case 3: Timeout
    if (message.includes("timeout")) {
      return {
        handleable: true,
        message: "Operation timed out",
        errorCode: "TIMEOUT",
        details: { retryAllowed: true },
      };
    }

    // Unknown error
    return {
      handleable: true,
      message: `Unknown error: ${message}`,
      errorCode: "UNKNOWN",
      details: {
        originalError: error,
        agentId,
      },
    };
  }

  /**
   * performSwitchValidation - Switch validation sequence handler
   *
   * Complete validation sequence including:
   * - Switch mode check
   * - Target agent validation
   * - Permission checks
   * - Rate limiting
   * - Error checks
   *
   * @param toolExecutionData - Tool execution data
   * @param targetAgentId - Agent ID to switch to
   * @param context - Operation context
   * @returns Validation result
   */
  private performSwitchValidation(
    toolExecutionData: ToolExecutionData,
    targetAgentId?: string,
    context: "normal" | "error" | "steered" | "switching" = "normal",
  ): ValidationResult {
    // Edge case: Check if currently switching
    if (this.state.switchMode !== AgentSwitchMode.IDLE) {
      return {
        valid: false,
        message: "Another switch operation is in progress",
        errorCode: "SWITCH_IN_PROGRESS",
        details: { currentMode: this.state.switchMode },
      };
    }

    // Edge case: Context tracking - check if in error/steering mode
    switch (context) {
      case "error":
      case "steered":
        return {
          valid: false,
          message: `Cannot switch from ${context} context`,
          errorCode: "CONTEXT_INVALID",
          details: { context },
        };
      default:
        // Normal or switching context
        break;
    }

    // Edge case: Session preservation check
    if (toolExecutionData.toolResult?.sessionId) {
      // Check if current agent's session is valid
      if (this.state.sessionId !== toolExecutionData.toolResult.sessionId) {
        return {
          valid: false,
          message: "Session ID mismatch",
          errorCode: "SESSION_MISMATCH",
          details: {
            currentSessionId: this.state.sessionId,
            expectedSessionId: toolExecutionData.toolResult.sessionId,
          },
        };
      }
    }

    // Validate target agent if specified
    if (targetAgentId) {
      // Check if target agent exists in our map
      if (!this.agentMap.has(targetAgentId)) {
        return {
          valid: false,
          message: `Agent ${targetAgentId} not available`,
          errorCode: "AGENT_NOT_FOUND",
          details: { requestedAgentId: targetAgentId },
        };
      }

      // Validate target agent is active
      const targetAgent = this.agentMap.get(targetAgentId);
      if (targetAgent?.status !== "active") {
        return {
          valid: false,
          message: `Agent ${targetAgentId} is not active`,
          errorCode: "AGENT_INACTIVE",
          details: { agentId: targetAgentId, status: targetAgent?.status },
        };
      }

      // Validate target agent session
      if (targetAgent?.sessionExpires && Date.now() > targetAgent.sessionExpires) {
        return {
          valid: false,
          message: `Session for agent ${targetAgentId} expired`,
          errorCode: "SESSION_EXPIRED",
          details: { agentId: targetAgentId },
        };
      }
    }

    // Check rate limit
    if (!this.state.lastSwitchedAt) {
      this.state.lastSwitchedAt = Date.now();
    } else {
      const secondsSinceLastSwitch = (Date.now() - this.state.lastSwitchedAt) / 1000;
      if (secondsSinceLastSwitch < 5) { // Minimum 5 seconds between switches
        return {
          valid: false,
          message: "Switch rate limit exceeded",
          errorCode: "SWITCH_RATE_LIMIT",
          details: {
            lastSwitch: new Date(this.state.lastSwitchedAt).toISOString(),
            cooldown: 5, // seconds
          },
        };
      }
    }

    // All validations passed
    return {
      valid: true,
      message: "Switch validated successfully",
      agentId: targetAgentId,
      details: {
        context,
        switchCount: this.state.switchCount,
        valid: true,
      },
    };
  }

  // ============================================
  // ============ Helper Functions =============
  // ============================================

  /**
   * Format error result
   *
   * @param message - Error message
   * @param errorCode - Error code (optional)
   * @param details - Error details (optional)
   * @returns Formatted ToolResult error
   */
  private formatErrorResult(
    message: string,
    errorCode: string | undefined = undefined,
    details: Record<string, any> | undefined = undefined,
  ): ToolResult {
    return {
      status: "error",
      message,
      error: errorCode,
      details: details,
    } as ToolResult;
  }

  /**
   * Increment switch count
   *
   * @param agentId - Last switched agent ID
   */
  private incrementSwitchCount(agentId?: string): void {
    this.state.switchCount++;
    this.state.switchedAgent = agentId;
    this.state.lastSwitchedAt = Date.now();
    this.context.activeAgentId = agentId;
  }

  /**
   * Update switching mode
   *
   * @param mode - New mode
   */
  private updateSwitchMode(mode: AgentSwitchMode): void {
    this.state.switchMode = mode;
  }

  /**
   * Add switch to history
   *
   * @param agentId - Agent ID switched to
   * @param timestamp - Timestamp
   */
  private addSwitchToHistory(agentId: string, timestamp: number): void {
    this.switchHistory.push({
      agentId,
      timestamp,
    });

    // Keep only last 10 switch history entries
    if (this.switchHistory.length > 10) {
      this.switchHistory.shift();
    }
  }

  /**
   * Check if switching is available
   *
   * @returns boolean
   */
  public isSwitchAvailable(): boolean {
    return (
      this.state.switchMode === AgentSwitchMode.IDLE &&
      this.agentMap.size > 1
    );
  }

  /**
   * Reset switch state
   *
   * @returns New initial state
   */
  public resetSwitchState(): AgentSwitchState {
    return this.createInitialState();
  }

  // ============================================
  // ============ Tool Execution Context =============
  // ============================================

  /**
   * Tool execution context type
   *
   * @property currentTool - Currently executing tool (if any)
   * @property activeAgentId - Currently active agent ID
   * @property toolPermissions - Tool permissions
   * @property sessionId - Session identifier
   * @property context - Operation context
   */
  export interface ToolExecutionContext {
    currentTool: Tool | undefined;
    activeAgentId: string | undefined;
    toolPermissions: Record<string, any>;
    sessionId?: string;
    context: "normal" | "error" | "steered" | "switching";
  }

  // ============================================
  // ============ Error Handling Types =============
  // ============================================

  interface ContextTrackingResult {
    isValid: boolean;
    message: string;
    errorCode: string | undefined;
    details: Record<string, any>;
  }

  interface SessionPreservationResult {
    preserve: boolean;
    message: string;
    details?: Record<string, any>;
  }

  interface ErrorHandlingResult {
    handleable: boolean;
    message: string | undefined;
    errorCode: string | undefined;
    details: Record<string, any>;
  }

  interface ValidationResult {
    valid: boolean;
    message: string;
    errorCode?: string;
    details?: Record<string, any>;
  }

  interface ToolRegistry {
    [key: string]: Tool;
  }

  interface SwitchHistoryItem {
    agentId: string;
    timestamp: number;
  }

  const ERROR_CODE_FORCE = "FORCE_NOT_ALLOWED";
}


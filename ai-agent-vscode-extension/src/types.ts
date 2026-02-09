/**
 * Core types for AI Agent Developer Onboarding System
 */

/**
 * Setup request from developer
 */
export interface SetupRequest {
  id: string;
  description: string; // Natural language: "I need Node.js, Python, and Docker"
  projectPath?: string;
  timestamp: Date;
}

/**
 * Installation plan created by orchestrator
 */
export interface InstallationPlan {
  id: string;
  requestId: string;
  steps: InstallationStep[];
  estimatedTime: string;
  requiresAdmin: boolean;
  platform: Platform;
  createdAt: Date;
}

export interface InstallationStep {
  id: string;
  agent: AgentType;
  action: InstallAction;
  tool: string; // e.g., "Node.js 20.x", "Python 3.11", "Docker Desktop"
  version?: string;
  status: StepStatus;
  commands?: Command[];
  output?: string;
  error?: string;
}

export enum AgentType {
  ORCHESTRATOR = 'orchestrator',
  LANGUAGE = 'language',       // Handles programming languages
  PACKAGE_MANAGER = 'package_manager', // Handles package managers
  IDE_TOOL = 'ide_tool',        // Handles IDEs and dev tools
  PROJECT = 'project',          // Handles project setup
  VERIFICATION = 'verification' // Verifies installations
}

export enum InstallAction {
  DETECT = 'detect',           // Check if already installed
  DOWNLOAD = 'download',       // Download installer/binary
  INSTALL = 'install',         // Install software
  CONFIGURE = 'configure',     // Configure after installation
  VERIFY = 'verify'            // Verify installation worked
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  REQUIRES_APPROVAL = 'requires_approval'
}

export interface Command {
  command: string;
  requiresAdmin: boolean;
  platform?: Platform;
  description: string;
}

export enum Platform {
  MACOS = 'darwin',
  WINDOWS = 'win32',
  LINUX = 'linux'
}

/**
 * Tool detection results
 */
export interface ToolDetection {
  tool: string;
  installed: boolean;
  version?: string;
  path?: string;
  needsUpdate?: boolean;
}

/**
 * Agent context - information available to all agents
 */
export interface AgentContext {
  platform: Platform;
  architecture: string; // x64, arm64, etc.
  shell: string; // bash, zsh, powershell, cmd
  homeDir: string;
  projectPath?: string;
  existingTools: ToolDetection[];
  packageManagers: PackageManagerInfo[];
}

export interface PackageManagerInfo {
  name: 'homebrew' | 'chocolatey' | 'apt' | 'yum' | 'dnf' | 'winget';
  installed: boolean;
  version?: string;
}

/**
 * Natural language parsing result
 */
export interface ParsedRequest {
  intent: SetupIntent;
  tools: ToolRequest[];
  context?: {
    projectType?: string; // "node", "python", "java", etc.
    framework?: string;   // "express", "django", "spring", etc.
  };
}

export enum SetupIntent {
  FRESH_SETUP = 'fresh_setup',           // New machine setup
  PROJECT_SETUP = 'project_setup',       // Setup for specific project
  TOOL_INSTALL = 'tool_install',         // Install specific tools
  ENVIRONMENT_SETUP = 'environment_setup' // Setup dev environment
}

export interface ToolRequest {
  name: string;
  version?: string;
  priority: number; // 1 = must install first, 2 = can install after, etc.
}

/**
 * Agent interface - all agents implement this
 */
export interface Agent {
  type: AgentType;
  name: string;

  /**
   * Check if this agent can handle the given step
   */
  canHandle(step: InstallationStep): boolean;

  /**
   * Execute the installation step
   */
  execute(step: InstallationStep, context: AgentContext): Promise<StepResult>;

  /**
   * Generate commands for the installation
   */
  planCommands(step: InstallationStep, context: AgentContext): Command[];
}

export interface StepResult {
  success: boolean;
  output?: string;
  error?: string;
  nextSteps?: InstallationStep[];
}

/**
 * Claude API integration types
 */
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: any;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/**
 * Extension state
 */
export interface ExtensionState {
  activeRequests: Map<string, SetupRequest>;
  installationPlans: Map<string, InstallationPlan>;
  agentContext: AgentContext;
}

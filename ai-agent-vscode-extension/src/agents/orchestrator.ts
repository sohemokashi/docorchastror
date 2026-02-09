import * as vscode from 'vscode';
import {
  SetupRequest,
  InstallationPlan,
  InstallationStep,
  ExtensionState,
  AgentType,
  InstallAction,
  StepStatus,
  ParsedRequest
} from '../types';
import { ClaudeClient } from '../api/claudeClient';
import { LanguageAgent } from './languageAgent';
import { PackageManagerAgent } from './packageManagerAgent';
import { IDEToolAgent } from './ideToolAgent';
import { ProjectAgent } from './projectAgent';
import { VerificationAgent } from './verificationAgent';
import { ExecutionEngine } from '../execution/engine';

/**
 * Main orchestrator that coordinates all agents
 */
export class AgentOrchestrator {
  private claudeClient: ClaudeClient;
  private agents: Map<AgentType, any>;
  private executionEngine: ExecutionEngine;

  constructor(
    private state: ExtensionState,
    private outputChannel: vscode.OutputChannel
  ) {
    // Initialize Claude client
    const apiKey = vscode.workspace.getConfiguration('aiAgent').get<string>('apiKey');
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please set aiAgent.apiKey in settings.');
    }

    this.claudeClient = new ClaudeClient(apiKey);
    this.executionEngine = new ExecutionEngine(outputChannel);

    // Initialize specialized agents
    this.agents = new Map([
      [AgentType.LANGUAGE, new LanguageAgent()],
      [AgentType.PACKAGE_MANAGER, new PackageManagerAgent()],
      [AgentType.IDE_TOOL, new IDEToolAgent()],
      [AgentType.PROJECT, new ProjectAgent()],
      [AgentType.VERIFICATION, new VerificationAgent()]
    ]);
  }

  /**
   * Main entry point - handles setup request from user
   */
  async handleSetupRequest(request: SetupRequest): Promise<void> {
    this.outputChannel.appendLine(`\n🤖 Processing request: "${request.description}"`);

    // Step 1: Parse natural language using Claude
    const parsed = await this.parseRequest(request);
    this.outputChannel.appendLine(`📋 Parsed ${parsed.tools.length} tools to install`);

    // Step 2: Create installation plan
    const plan = await this.createInstallationPlan(request, parsed);
    this.state.installationPlans.set(plan.id, plan);

    this.outputChannel.appendLine(`\n📝 Installation Plan:`);
    this.outputChannel.appendLine(`   ${plan.steps.length} steps`);
    this.outputChannel.appendLine(`   Estimated time: ${plan.estimatedTime}`);
    this.outputChannel.appendLine(`   Requires admin: ${plan.requiresAdmin ? 'Yes' : 'No'}`);

    // Step 3: Show plan to user and get approval
    const approved = await this.requestApproval(plan);
    if (!approved) {
      this.outputChannel.appendLine('❌ Installation cancelled by user');
      return;
    }

    // Step 4: Execute plan
    await this.executePlan(plan);
  }

  /**
   * Parse natural language request using Claude
   */
  private async parseRequest(request: SetupRequest): Promise<ParsedRequest> {
    const systemPrompt = `You are an expert system administrator and developer environment specialist.
Your job is to parse natural language requests from developers about setting up their development environment.

Extract:
1. The intent (fresh setup, project setup, tool install, environment setup)
2. List of tools/software to install with versions if specified
3. Priority order (what needs to be installed first)
4. Any context about the project type or framework

Respond in JSON format.`;

    const userPrompt = `Parse this setup request: "${request.description}"

${request.projectPath ? `Project path: ${request.projectPath}` : ''}

Current system:
- Platform: ${this.state.agentContext.platform}
- Installed tools: ${this.state.agentContext.existingTools.filter(t => t.installed).map(t => t.tool).join(', ')}

Provide a JSON response with:
{
  "intent": "fresh_setup" | "project_setup" | "tool_install" | "environment_setup",
  "tools": [
    { "name": "tool name", "version": "optional version", "priority": 1 }
  ],
  "context": {
    "projectType": "optional",
    "framework": "optional"
  }
}`;

    const response = await this.claudeClient.sendMessage([
      { role: 'user', content: userPrompt }
    ], systemPrompt);

    // Parse JSON from Claude's response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse request - no JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Create detailed installation plan
   */
  private async createInstallationPlan(
    request: SetupRequest,
    parsed: ParsedRequest
  ): Promise<InstallationPlan> {
    const steps: InstallationStep[] = [];
    let stepCounter = 1;

    // Sort tools by priority
    const sortedTools = parsed.tools.sort((a, b) => a.priority - b.priority);

    for (const tool of sortedTools) {
      // Determine which agent should handle this tool
      const agentType = this.determineAgentType(tool.name);

      // Detection step
      steps.push({
        id: `step-${stepCounter++}`,
        agent: agentType,
        action: InstallAction.DETECT,
        tool: tool.name,
        version: tool.version,
        status: StepStatus.PENDING
      });

      // Installation step
      steps.push({
        id: `step-${stepCounter++}`,
        agent: agentType,
        action: InstallAction.INSTALL,
        tool: tool.name,
        version: tool.version,
        status: StepStatus.PENDING
      });

      // Verification step
      steps.push({
        id: `step-${stepCounter++}`,
        agent: AgentType.VERIFICATION,
        action: InstallAction.VERIFY,
        tool: tool.name,
        version: tool.version,
        status: StepStatus.PENDING
      });
    }

    const requiresAdmin = steps.some(step => {
      const agent = this.agents.get(step.agent);
      if (!agent) return false;
      const commands = agent.planCommands(step, this.state.agentContext);
      return commands.some((cmd: any) => cmd.requiresAdmin);
    });

    return {
      id: `plan-${Date.now()}`,
      requestId: request.id,
      steps,
      estimatedTime: this.estimateTime(steps.length),
      requiresAdmin,
      platform: this.state.agentContext.platform,
      createdAt: new Date()
    };
  }

  /**
   * Determine which agent type should handle a tool
   */
  private determineAgentType(toolName: string): AgentType {
    const lower = toolName.toLowerCase();

    // Programming languages
    if (lower.includes('node') || lower.includes('python') || lower.includes('java') ||
        lower.includes('ruby') || lower.includes('go') || lower.includes('rust')) {
      return AgentType.LANGUAGE;
    }

    // Package managers
    if (lower.includes('homebrew') || lower.includes('brew') || lower.includes('chocolatey') ||
        lower.includes('apt') || lower.includes('yum')) {
      return AgentType.PACKAGE_MANAGER;
    }

    // IDE and dev tools
    if (lower.includes('docker') || lower.includes('git') || lower.includes('vscode') ||
        lower.includes('kubectl') || lower.includes('terraform')) {
      return AgentType.IDE_TOOL;
    }

    // Default to IDE tool
    return AgentType.IDE_TOOL;
  }

  /**
   * Request user approval for installation plan
   */
  private async requestApproval(plan: InstallationPlan): Promise<boolean> {
    const autoExecute = vscode.workspace.getConfiguration('aiAgent').get<boolean>('autoExecute');
    if (autoExecute) {
      return true;
    }

    const message = `Ready to install ${plan.steps.filter(s => s.action === InstallAction.INSTALL).length} tools. ${
      plan.requiresAdmin ? 'Admin privileges may be required.' : ''
    } Continue?`;

    const result = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'Show Plan',
      'Execute',
      'Cancel'
    );

    if (result === 'Show Plan') {
      this.showPlanDetails(plan);
      return this.requestApproval(plan); // Ask again after showing plan
    }

    return result === 'Execute';
  }

  /**
   * Show detailed installation plan
   */
  private showPlanDetails(plan: InstallationPlan): void {
    const details = plan.steps
      .filter(s => s.action === InstallAction.INSTALL)
      .map((s, i) => `${i + 1}. Install ${s.tool}${s.version ? ` (${s.version})` : ''}`)
      .join('\n');

    this.outputChannel.appendLine('\n=== Installation Plan Details ===');
    this.outputChannel.appendLine(details);
    this.outputChannel.show();
  }

  /**
   * Execute the installation plan
   */
  private async executePlan(plan: InstallationPlan): Promise<void> {
    this.outputChannel.appendLine('\n🚀 Starting installation...\n');

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Setting up development environment',
        cancellable: false
      },
      async (progress) => {
        const totalSteps = plan.steps.length;

        for (let i = 0; i < totalSteps; i++) {
          const step = plan.steps[i];
          progress.report({
            message: `${step.action} ${step.tool}`,
            increment: (100 / totalSteps)
          });

          step.status = StepStatus.IN_PROGRESS;
          this.outputChannel.appendLine(`[${i + 1}/${totalSteps}] ${step.action.toUpperCase()} ${step.tool}`);

          try {
            await this.executeStep(step);
            step.status = StepStatus.COMPLETED;
            this.outputChannel.appendLine(`✓ Completed\n`);
          } catch (error) {
            step.status = StepStatus.FAILED;
            step.error = String(error);
            this.outputChannel.appendLine(`✗ Failed: ${error}\n`);

            // Ask user if they want to continue
            const continueExecution = await vscode.window.showErrorMessage(
              `Failed to ${step.action} ${step.tool}. Continue with remaining steps?`,
              'Continue',
              'Stop'
            );

            if (continueExecution !== 'Continue') {
              break;
            }
          }
        }

        const completed = plan.steps.filter(s => s.status === StepStatus.COMPLETED).length;
        const failed = plan.steps.filter(s => s.status === StepStatus.FAILED).length;

        this.outputChannel.appendLine(`\n=== Installation Summary ===`);
        this.outputChannel.appendLine(`✓ Completed: ${completed}`);
        this.outputChannel.appendLine(`✗ Failed: ${failed}`);

        if (failed === 0) {
          vscode.window.showInformationMessage('✓ Development environment setup complete!');
        } else {
          vscode.window.showWarningMessage(`Setup completed with ${failed} failures. Check output for details.`);
        }
      }
    );
  }

  /**
   * Execute a single installation step
   */
  private async executeStep(step: InstallationStep): Promise<void> {
    const agent = this.agents.get(step.agent);
    if (!agent) {
      throw new Error(`No agent found for type: ${step.agent}`);
    }

    // Generate commands
    const commands = agent.planCommands(step, this.state.agentContext);

    if (commands.length === 0) {
      // Agent says nothing to do (e.g., already installed)
      return;
    }

    // Execute commands
    for (const cmd of commands) {
      await this.executionEngine.executeCommand(cmd, this.state.agentContext);
    }

    // Execute agent logic
    const result = await agent.execute(step, this.state.agentContext);

    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    step.output = result.output;
  }

  /**
   * Estimate time for installation
   */
  private estimateTime(stepCount: number): string {
    const minutes = Math.ceil(stepCount * 2); // Rough estimate: 2 min per step
    if (minutes < 5) return '< 5 minutes';
    if (minutes < 15) return '5-15 minutes';
    if (minutes < 30) return '15-30 minutes';
    return '30+ minutes';
  }
}

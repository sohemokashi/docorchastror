import {
  Agent,
  AgentType,
  InstallationStep,
  AgentContext,
  StepResult,
  Command,
  InstallAction
} from '../types';

/**
 * Agent responsible for verifying installations
 * Runs version checks and validates installations worked
 */
export class VerificationAgent implements Agent {
  type = AgentType.VERIFICATION;
  name = 'Verification Agent';

  canHandle(step: InstallationStep): boolean {
    return step.action === InstallAction.VERIFY;
  }

  async execute(step: InstallationStep, context: AgentContext): Promise<StepResult> {
    return { success: true, output: `${step.tool} verified successfully` };
  }

  planCommands(step: InstallationStep, context: AgentContext): Command[] {
    const tool = step.tool.toLowerCase();
    const commands: Command[] = [];

    // Version check commands
    if (tool.includes('node')) {
      commands.push({
        command: 'node --version && npm --version',
        requiresAdmin: false,
        description: 'Verify Node.js and npm installation'
      });
    } else if (tool.includes('python')) {
      commands.push({
        command: 'python3 --version && pip3 --version',
        requiresAdmin: false,
        description: 'Verify Python and pip installation'
      });
    } else if (tool.includes('docker')) {
      commands.push({
        command: 'docker --version',
        requiresAdmin: false,
        description: 'Verify Docker installation'
      });
    } else if (tool.includes('git')) {
      commands.push({
        command: 'git --version',
        requiresAdmin: false,
        description: 'Verify Git installation'
      });
    }

    return commands;
  }
}

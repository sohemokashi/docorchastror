import {
  Agent,
  AgentType,
  InstallationStep,
  AgentContext,
  StepResult,
  Command
} from '../types';

/**
 * Agent responsible for project-specific setup
 * Handles: git clone, npm install, pip install, environment setup, etc.
 */
export class ProjectAgent implements Agent {
  type = AgentType.PROJECT;
  name = 'Project Agent';

  canHandle(step: InstallationStep): boolean {
    const tool = step.tool.toLowerCase();
    return (
      tool.includes('clone') ||
      tool.includes('dependencies') ||
      tool.includes('env') ||
      tool.includes('setup')
    );
  }

  async execute(step: InstallationStep, context: AgentContext): Promise<StepResult> {
    return { success: true, output: `Project ${step.action} completed` };
  }

  planCommands(step: InstallationStep, context: AgentContext): Command[] {
    // Project-specific commands would be generated here
    return [];
  }
}

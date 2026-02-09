import {
  Agent,
  AgentType,
  InstallationStep,
  AgentContext,
  StepResult,
  Command,
  InstallAction,
  Platform
} from '../types';

/**
 * Agent responsible for installing IDE tools and dev utilities
 * Handles: Docker, Git, kubectl, Terraform, etc.
 */
export class IDEToolAgent implements Agent {
  type = AgentType.IDE_TOOL;
  name = 'IDE Tool Agent';

  canHandle(step: InstallationStep): boolean {
    return true; // Default handler for any tool not handled by other agents
  }

  async execute(step: InstallationStep, context: AgentContext): Promise<StepResult> {
    return { success: true, output: `${step.tool} ${step.action} initiated` };
  }

  planCommands(step: InstallationStep, context: AgentContext): Command[] {
    if (step.action === InstallAction.DETECT) {
      return this.getDetectionCommands(step, context);
    } else if (step.action === InstallAction.INSTALL) {
      return this.getInstallCommands(step, context);
    }
    return [];
  }

  private getDetectionCommands(step: InstallationStep, context: AgentContext): Command[] {
    const tool = step.tool.toLowerCase();

    if (tool.includes('docker')) {
      return [{ command: 'docker --version', requiresAdmin: false, description: 'Check Docker' }];
    }
    if (tool.includes('git')) {
      return [{ command: 'git --version', requiresAdmin: false, description: 'Check Git' }];
    }
    if (tool.includes('kubectl')) {
      return [{ command: 'kubectl version --client', requiresAdmin: false, description: 'Check kubectl' }];
    }

    return [];
  }

  private getInstallCommands(step: InstallationStep, context: AgentContext): Command[] {
    const tool = step.tool.toLowerCase();
    const platform = context.platform;

    if (tool.includes('docker')) {
      return this.getDockerCommands(platform, context);
    }
    if (tool.includes('git')) {
      return this.getGitCommands(platform, context);
    }

    return [];
  }

  private getDockerCommands(platform: Platform, context: AgentContext): Command[] {
    switch (platform) {
      case Platform.MACOS:
        return [
          {
            command: 'brew install --cask docker',
            requiresAdmin: false,
            platform: Platform.MACOS,
            description: 'Install Docker Desktop via Homebrew'
          }
        ];

      case Platform.WINDOWS:
        return [
          {
            command: 'choco install docker-desktop -y',
            requiresAdmin: true,
            platform: Platform.WINDOWS,
            description: 'Install Docker Desktop via Chocolatey'
          }
        ];

      case Platform.LINUX:
        return [
          {
            command: 'curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh',
            requiresAdmin: true,
            platform: Platform.LINUX,
            description: 'Install Docker via official script'
          }
        ];
    }
  }

  private getGitCommands(platform: Platform, context: AgentContext): Command[] {
    switch (platform) {
      case Platform.MACOS:
        return [
          {
            command: 'brew install git',
            requiresAdmin: false,
            platform: Platform.MACOS,
            description: 'Install Git via Homebrew'
          }
        ];

      case Platform.WINDOWS:
        return [
          {
            command: 'choco install git -y',
            requiresAdmin: true,
            platform: Platform.WINDOWS,
            description: 'Install Git via Chocolatey'
          }
        ];

      case Platform.LINUX:
        return [
          {
            command: 'sudo apt-get install -y git',
            requiresAdmin: true,
            platform: Platform.LINUX,
            description: 'Install Git via apt'
          }
        ];
    }
  }
}

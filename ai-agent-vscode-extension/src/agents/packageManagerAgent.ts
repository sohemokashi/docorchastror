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
 * Agent responsible for installing package managers
 * Handles: Homebrew, Chocolatey, apt, yum, winget, etc.
 */
export class PackageManagerAgent implements Agent {
  type = AgentType.PACKAGE_MANAGER;
  name = 'Package Manager Agent';

  canHandle(step: InstallationStep): boolean {
    const tool = step.tool.toLowerCase();
    return (
      tool.includes('homebrew') ||
      tool.includes('brew') ||
      tool.includes('chocolatey') ||
      tool.includes('choco') ||
      tool.includes('apt') ||
      tool.includes('yum') ||
      tool.includes('winget')
    );
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

    if (tool.includes('homebrew') || tool.includes('brew')) {
      return [{ command: 'brew --version', requiresAdmin: false, description: 'Check Homebrew' }];
    }
    if (tool.includes('chocolatey') || tool.includes('choco')) {
      return [{ command: 'choco --version', requiresAdmin: false, description: 'Check Chocolatey' }];
    }
    if (tool.includes('winget')) {
      return [{ command: 'winget --version', requiresAdmin: false, description: 'Check winget' }];
    }

    return [];
  }

  private getInstallCommands(step: InstallationStep, context: AgentContext): Command[] {
    const tool = step.tool.toLowerCase();
    const platform = context.platform;

    if (tool.includes('homebrew') || tool.includes('brew')) {
      return [
        {
          command: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
          requiresAdmin: false,
          platform: Platform.MACOS,
          description: 'Install Homebrew'
        }
      ];
    }

    if (tool.includes('chocolatey') || tool.includes('choco')) {
      return [
        {
          command: 'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))',
          requiresAdmin: true,
          platform: Platform.WINDOWS,
          description: 'Install Chocolatey'
        }
      ];
    }

    return [];
  }
}

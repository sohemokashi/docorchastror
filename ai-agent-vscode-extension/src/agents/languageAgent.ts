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
 * Agent responsible for installing programming languages
 * Handles: Node.js, Python, Java, Ruby, Go, Rust, etc.
 */
export class LanguageAgent implements Agent {
  type = AgentType.LANGUAGE;
  name = 'Language Agent';

  canHandle(step: InstallationStep): boolean {
    const tool = step.tool.toLowerCase();
    return (
      tool.includes('node') ||
      tool.includes('python') ||
      tool.includes('java') ||
      tool.includes('ruby') ||
      tool.includes('go') ||
      tool.includes('rust') ||
      tool.includes('php')
    );
  }

  async execute(step: InstallationStep, context: AgentContext): Promise<StepResult> {
    if (step.action === InstallAction.DETECT) {
      return this.detectInstallation(step, context);
    } else if (step.action === InstallAction.INSTALL) {
      return this.install(step, context);
    }

    return { success: true };
  }

  planCommands(step: InstallationStep, context: AgentContext): Command[] {
    if (step.action === InstallAction.DETECT) {
      return this.getDetectionCommands(step, context);
    } else if (step.action === InstallAction.INSTALL) {
      return this.getInstallCommands(step, context);
    }
    return [];
  }

  private async detectInstallation(step: InstallationStep, context: AgentContext): Promise<StepResult> {
    const tool = this.normalizeToolName(step.tool);
    const detection = context.existingTools.find(t => t.tool === tool);

    if (detection?.installed) {
      return {
        success: true,
        output: `${tool} is already installed (${detection.version})`
      };
    }

    return {
      success: true,
      output: `${tool} is not installed`
    };
  }

  private async install(step: InstallationStep, context: AgentContext): Promise<StepResult> {
    // The actual installation is done via command execution
    // This method is called after commands are executed
    return {
      success: true,
      output: `${step.tool} installation initiated`
    };
  }

  private getDetectionCommands(step: InstallationStep, context: AgentContext): Command[] {
    const tool = step.tool.toLowerCase();

    if (tool.includes('node')) {
      return [
        {
          command: 'node --version',
          requiresAdmin: false,
          description: 'Check if Node.js is installed'
        }
      ];
    }

    if (tool.includes('python')) {
      const pythonCmd = context.platform === Platform.WINDOWS ? 'python' : 'python3';
      return [
        {
          command: `${pythonCmd} --version`,
          requiresAdmin: false,
          description: 'Check if Python is installed'
        }
      ];
    }

    if (tool.includes('java')) {
      return [
        {
          command: 'java --version',
          requiresAdmin: false,
          description: 'Check if Java is installed'
        }
      ];
    }

    return [];
  }

  private getInstallCommands(step: InstallationStep, context: AgentContext): Command[] {
    const tool = step.tool.toLowerCase();
    const platform = context.platform;

    // Node.js installation
    if (tool.includes('node')) {
      return this.getNodeInstallCommands(platform, step.version, context);
    }

    // Python installation
    if (tool.includes('python')) {
      return this.getPythonInstallCommands(platform, step.version, context);
    }

    // Java installation
    if (tool.includes('java')) {
      return this.getJavaInstallCommands(platform, step.version, context);
    }

    return [];
  }

  private getNodeInstallCommands(platform: Platform, version?: string, context?: AgentContext): Command[] {
    switch (platform) {
      case Platform.MACOS:
        if (this.hasHomebrew(context)) {
          return [
            {
              command: version ? `brew install node@${version}` : 'brew install node',
              requiresAdmin: false,
              platform: Platform.MACOS,
              description: 'Install Node.js via Homebrew'
            }
          ];
        } else {
          return [
            {
              command: 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash',
              requiresAdmin: false,
              platform: Platform.MACOS,
              description: 'Install NVM (Node Version Manager)'
            },
            {
              command: `source ~/.bashrc && nvm install ${version || 'node'}`,
              requiresAdmin: false,
              platform: Platform.MACOS,
              description: 'Install Node.js via NVM'
            }
          ];
        }

      case Platform.WINDOWS:
        if (this.hasChocolatey(context)) {
          return [
            {
              command: version ? `choco install nodejs --version=${version} -y` : 'choco install nodejs -y',
              requiresAdmin: true,
              platform: Platform.WINDOWS,
              description: 'Install Node.js via Chocolatey'
            }
          ];
        } else if (this.hasWinget(context)) {
          return [
            {
              command: 'winget install OpenJS.NodeJS',
              requiresAdmin: false,
              platform: Platform.WINDOWS,
              description: 'Install Node.js via winget'
            }
          ];
        } else {
          return [
            {
              command: 'echo "Please download Node.js from https://nodejs.org/" && start https://nodejs.org/en/download/',
              requiresAdmin: false,
              platform: Platform.WINDOWS,
              description: 'Open Node.js download page'
            }
          ];
        }

      case Platform.LINUX:
        if (this.hasApt(context)) {
          return [
            {
              command: 'curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -',
              requiresAdmin: true,
              platform: Platform.LINUX,
              description: 'Add NodeSource repository'
            },
            {
              command: 'sudo apt-get install -y nodejs',
              requiresAdmin: true,
              platform: Platform.LINUX,
              description: 'Install Node.js via apt'
            }
          ];
        } else if (this.hasYum(context)) {
          return [
            {
              command: 'curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -',
              requiresAdmin: true,
              platform: Platform.LINUX,
              description: 'Add NodeSource repository'
            },
            {
              command: 'sudo yum install -y nodejs',
              requiresAdmin: true,
              platform: Platform.LINUX,
              description: 'Install Node.js via yum'
            }
          ];
        }
    }

    return [];
  }

  private getPythonInstallCommands(platform: Platform, version?: string, context?: AgentContext): Command[] {
    const pythonVersion = version || '3.11';

    switch (platform) {
      case Platform.MACOS:
        if (this.hasHomebrew(context)) {
          return [
            {
              command: `brew install python@${pythonVersion}`,
              requiresAdmin: false,
              platform: Platform.MACOS,
              description: 'Install Python via Homebrew'
            }
          ];
        }
        return [
          {
            command: 'echo "Please download Python from https://www.python.org/" && open https://www.python.org/downloads/',
            requiresAdmin: false,
            platform: Platform.MACOS,
            description: 'Open Python download page'
          }
        ];

      case Platform.WINDOWS:
        if (this.hasChocolatey(context)) {
          return [
            {
              command: `choco install python --version=${pythonVersion} -y`,
              requiresAdmin: true,
              platform: Platform.WINDOWS,
              description: 'Install Python via Chocolatey'
            }
          ];
        } else if (this.hasWinget(context)) {
          return [
            {
              command: 'winget install Python.Python.3',
              requiresAdmin: false,
              platform: Platform.WINDOWS,
              description: 'Install Python via winget'
            }
          ];
        }
        return [
          {
            command: 'echo "Please download Python from https://www.python.org/" && start https://www.python.org/downloads/',
            requiresAdmin: false,
            platform: Platform.WINDOWS,
            description: 'Open Python download page'
          }
        ];

      case Platform.LINUX:
        if (this.hasApt(context)) {
          return [
            {
              command: `sudo apt-get update && sudo apt-get install -y python${pythonVersion} python3-pip`,
              requiresAdmin: true,
              platform: Platform.LINUX,
              description: 'Install Python via apt'
            }
          ];
        } else if (this.hasYum(context)) {
          return [
            {
              command: `sudo yum install -y python${pythonVersion} python3-pip`,
              requiresAdmin: true,
              platform: Platform.LINUX,
              description: 'Install Python via yum'
            }
          ];
        }
    }

    return [];
  }

  private getJavaInstallCommands(platform: Platform, version?: string, context?: AgentContext): Command[] {
    const javaVersion = version || '17';

    switch (platform) {
      case Platform.MACOS:
        if (this.hasHomebrew(context)) {
          return [
            {
              command: `brew install openjdk@${javaVersion}`,
              requiresAdmin: false,
              platform: Platform.MACOS,
              description: 'Install OpenJDK via Homebrew'
            }
          ];
        }
        break;

      case Platform.WINDOWS:
        if (this.hasChocolatey(context)) {
          return [
            {
              command: `choco install openjdk${javaVersion} -y`,
              requiresAdmin: true,
              platform: Platform.WINDOWS,
              description: 'Install OpenJDK via Chocolatey'
            }
          ];
        }
        break;

      case Platform.LINUX:
        if (this.hasApt(context)) {
          return [
            {
              command: `sudo apt-get update && sudo apt-get install -y openjdk-${javaVersion}-jdk`,
              requiresAdmin: true,
              platform: Platform.LINUX,
              description: 'Install OpenJDK via apt'
            }
          ];
        }
        break;
    }

    return [];
  }

  private normalizeToolName(tool: string): string {
    const lower = tool.toLowerCase();
    if (lower.includes('node')) return 'Node.js';
    if (lower.includes('python')) return 'Python';
    if (lower.includes('java')) return 'Java';
    if (lower.includes('ruby')) return 'Ruby';
    if (lower.includes('go')) return 'Go';
    return tool;
  }

  private hasHomebrew(context?: AgentContext): boolean {
    return context?.packageManagers.some(pm => pm.name === 'homebrew' && pm.installed) || false;
  }

  private hasChocolatey(context?: AgentContext): boolean {
    return context?.packageManagers.some(pm => pm.name === 'chocolatey' && pm.installed) || false;
  }

  private hasWinget(context?: AgentContext): boolean {
    return context?.packageManagers.some(pm => pm.name === 'winget' && pm.installed) || false;
  }

  private hasApt(context?: AgentContext): boolean {
    return context?.packageManagers.some(pm => pm.name === 'apt' && pm.installed) || false;
  }

  private hasYum(context?: AgentContext): boolean {
    return context?.packageManagers.some(pm => pm.name === 'yum' && pm.installed) || false;
  }
}

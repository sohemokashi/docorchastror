import * as os from 'os';
import * as cp from 'child_process';
import { AgentContext, Platform, ToolDetection, PackageManagerInfo } from '../types';

/**
 * Builds the agent context by detecting system information
 */
export class AgentContextBuilder {
  async build(): Promise<AgentContext> {
    const platform = this.detectPlatform();
    const architecture = os.arch();
    const shell = this.detectShell();
    const homeDir = os.homedir();

    const packageManagers = await this.detectPackageManagers(platform);
    const existingTools = await this.detectExistingTools();

    return {
      platform,
      architecture,
      shell,
      homeDir,
      existingTools,
      packageManagers
    };
  }

  private detectPlatform(): Platform {
    const platform = os.platform();
    if (platform === 'darwin') return Platform.MACOS;
    if (platform === 'win32') return Platform.WINDOWS;
    return Platform.LINUX;
  }

  private detectShell(): string {
    if (process.env.SHELL) {
      return process.env.SHELL.split('/').pop() || 'bash';
    }
    if (os.platform() === 'win32') {
      return 'powershell';
    }
    return 'bash';
  }

  private async detectPackageManagers(platform: Platform): Promise<PackageManagerInfo[]> {
    const managers: PackageManagerInfo[] = [];

    // Homebrew (macOS/Linux)
    if (platform === Platform.MACOS || platform === Platform.LINUX) {
      const brew = await this.checkCommand('brew --version');
      managers.push({
        name: 'homebrew',
        installed: brew.installed,
        version: brew.version
      });
    }

    // Chocolatey (Windows)
    if (platform === Platform.WINDOWS) {
      const choco = await this.checkCommand('choco --version');
      managers.push({
        name: 'chocolatey',
        installed: choco.installed,
        version: choco.version
      });

      const winget = await this.checkCommand('winget --version');
      managers.push({
        name: 'winget',
        installed: winget.installed,
        version: winget.version
      });
    }

    // apt (Linux)
    if (platform === Platform.LINUX) {
      const apt = await this.checkCommand('apt --version');
      managers.push({
        name: 'apt',
        installed: apt.installed,
        version: apt.version
      });

      const yum = await this.checkCommand('yum --version');
      managers.push({
        name: 'yum',
        installed: yum.installed,
        version: yum.version
      });
    }

    return managers;
  }

  private async detectExistingTools(): Promise<ToolDetection[]> {
    const tools = [
      { name: 'Node.js', command: 'node --version' },
      { name: 'npm', command: 'npm --version' },
      { name: 'Python', command: 'python3 --version' },
      { name: 'pip', command: 'pip3 --version' },
      { name: 'Java', command: 'java --version' },
      { name: 'Git', command: 'git --version' },
      { name: 'Docker', command: 'docker --version' },
      { name: 'kubectl', command: 'kubectl version --client' }
    ];

    const detections: ToolDetection[] = [];

    for (const tool of tools) {
      const result = await this.checkCommand(tool.command);
      detections.push({
        tool: tool.name,
        installed: result.installed,
        version: result.version
      });
    }

    return detections;
  }

  private async checkCommand(command: string): Promise<{ installed: boolean; version?: string }> {
    return new Promise((resolve) => {
      cp.exec(command, (error, stdout, stderr) => {
        if (error) {
          resolve({ installed: false });
          return;
        }

        const output = (stdout || stderr).trim();
        const versionMatch = output.match(/v?(\d+\.\d+(?:\.\d+)?)/);
        const version = versionMatch ? versionMatch[1] : output.split('\n')[0];

        resolve({
          installed: true,
          version
        });
      });
    });
  }
}

import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Command, AgentContext, Platform } from '../types';

/**
 * Execution engine that runs commands in the terminal
 */
export class ExecutionEngine {
  constructor(private outputChannel: vscode.OutputChannel) {}

  /**
   * Execute a command
   */
  async executeCommand(command: Command, context: AgentContext): Promise<string> {
    this.outputChannel.appendLine(`  $ ${command.command}`);

    // Check if command requires admin
    if (command.requiresAdmin) {
      return this.executeWithElevation(command, context);
    }

    return this.executeSimple(command.command);
  }

  /**
   * Execute command with elevated privileges
   */
  private async executeWithElevation(command: Command, context: AgentContext): Promise<string> {
    const platform = context.platform;
    let elevatedCommand: string;

    if (platform === Platform.WINDOWS) {
      // Windows - request admin via PowerShell
      const proceed = await vscode.window.showWarningMessage(
        `This command requires administrator privileges:\n${command.command}`,
        { modal: true },
        'Execute'
      );

      if (proceed !== 'Execute') {
        throw new Error('User cancelled elevated command');
      }

      elevatedCommand = `Start-Process powershell -Verb RunAs -ArgumentList '-Command', '${command.command.replace(/'/g, "''")}'`;
      return this.executeSimple(elevatedCommand);
    } else {
      // Mac/Linux - use sudo
      const proceed = await vscode.window.showWarningMessage(
        `This command requires sudo privileges:\n${command.command}`,
        { modal: true },
        'Execute'
      );

      if (proceed !== 'Execute') {
        throw new Error('User cancelled elevated command');
      }

      // For sudo commands, we need to run them in the integrated terminal
      // so the user can enter their password
      return this.executeInTerminal(command.command);
    }
  }

  /**
   * Execute simple command without elevation
   */
  private async executeSimple(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cp.exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          const errorMsg = stderr || stdout || error.message;
          this.outputChannel.appendLine(`    Error: ${errorMsg}`);

          // Some commands return non-zero but are not actually errors
          // For example, version checks that don't find the tool
          if (command.includes('--version') || command.includes('version')) {
            resolve(errorMsg);
          } else {
            reject(new Error(errorMsg));
          }
          return;
        }

        const output = stdout.trim();
        if (output) {
          this.outputChannel.appendLine(`    ${output}`);
        }
        resolve(output);
      });
    });
  }

  /**
   * Execute command in VS Code's integrated terminal
   * Used for commands that need user interaction (e.g., password prompts)
   */
  private async executeInTerminal(command: string): Promise<string> {
    const terminal = vscode.window.createTerminal('AI Agent Setup');
    terminal.show();
    terminal.sendText(command);

    // Wait for user to press enter in the output channel
    await vscode.window.showInformationMessage(
      'Command sent to terminal. Click OK when the command completes.',
      { modal: true },
      'OK'
    );

    return 'Command executed in terminal';
  }

  /**
   * Check if a command exists
   */
  async commandExists(command: string): Promise<boolean> {
    try {
      await this.executeSimple(`which ${command}`);
      return true;
    } catch {
      return false;
    }
  }
}

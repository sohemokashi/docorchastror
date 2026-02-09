import * as vscode from 'vscode';
import { AgentOrchestrator } from './agents/orchestrator';
import { ExtensionState, SetupRequest, Platform } from './types';
import { AgentContextBuilder } from './context/contextBuilder';
import { ChatViewProvider } from './ui/chatView';
import { TaskViewProvider } from './ui/taskView';

let extensionState: ExtensionState;
let orchestrator: AgentOrchestrator;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext) {
  console.log('AI Agent Developer extension is now active');

  // Create output channel for logging
  outputChannel = vscode.window.createOutputChannel('AI Agent Developer');
  outputChannel.appendLine('Extension activated');

  // Build agent context (detect OS, tools, etc.)
  const contextBuilder = new AgentContextBuilder();
  const agentContext = await contextBuilder.build();

  // Initialize extension state
  extensionState = {
    activeRequests: new Map(),
    installationPlans: new Map(),
    agentContext
  };

  // Initialize orchestrator
  orchestrator = new AgentOrchestrator(extensionState, outputChannel);

  // Register chat view
  const chatViewProvider = new ChatViewProvider(context.extensionUri, orchestrator);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aiAgent.chatView', chatViewProvider)
  );

  // Register task view
  const taskViewProvider = new TaskViewProvider(extensionState);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('aiAgent.taskView', taskViewProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('aiAgent.setupEnvironment', async () => {
      await handleSetupEnvironment();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiAgent.installTool', async () => {
      await handleInstallTool();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiAgent.openChat', () => {
      vscode.commands.executeCommand('aiAgent.chatView.focus');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiAgent.checkSystem', async () => {
      await handleCheckSystem();
    })
  );

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get<boolean>('hasShownWelcome');
  if (!hasShownWelcome) {
    showWelcomeMessage();
    context.globalState.update('hasShownWelcome', true);
  }

  outputChannel.appendLine(`Platform detected: ${agentContext.platform}`);
  outputChannel.appendLine(`Architecture: ${agentContext.architecture}`);
}

async function handleSetupEnvironment() {
  const input = await vscode.window.showInputBox({
    prompt: 'What do you need to set up?',
    placeHolder: 'e.g., "I need Node.js, Python 3.11, and Docker for this project"',
    ignoreFocusOut: true
  });

  if (!input) {
    return;
  }

  const request: SetupRequest = {
    id: generateId(),
    description: input,
    projectPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
    timestamp: new Date()
  };

  extensionState.activeRequests.set(request.id, request);

  outputChannel.appendLine(`\n=== New Setup Request ===`);
  outputChannel.appendLine(`Description: ${request.description}`);
  outputChannel.show();

  try {
    await orchestrator.handleSetupRequest(request);
  } catch (error) {
    vscode.window.showErrorMessage(`Setup failed: ${error}`);
    outputChannel.appendLine(`Error: ${error}`);
  }
}

async function handleInstallTool() {
  const tool = await vscode.window.showQuickPick(
    [
      { label: 'Node.js', description: 'JavaScript runtime' },
      { label: 'Python', description: 'Python programming language' },
      { label: 'Java', description: 'Java Development Kit' },
      { label: 'Docker', description: 'Container platform' },
      { label: 'Git', description: 'Version control' },
      { label: 'Custom', description: 'Specify a custom tool' }
    ],
    { placeHolder: 'Select a tool to install' }
  );

  if (!tool) {
    return;
  }

  let description: string;
  if (tool.label === 'Custom') {
    const customInput = await vscode.window.showInputBox({
      prompt: 'What do you want to install?',
      placeHolder: 'e.g., "PostgreSQL 15"'
    });
    if (!customInput) {
      return;
    }
    description = `Install ${customInput}`;
  } else {
    description = `Install ${tool.label}`;
  }

  const request: SetupRequest = {
    id: generateId(),
    description,
    timestamp: new Date()
  };

  extensionState.activeRequests.set(request.id, request);

  try {
    await orchestrator.handleSetupRequest(request);
  } catch (error) {
    vscode.window.showErrorMessage(`Installation failed: ${error}`);
    outputChannel.appendLine(`Error: ${error}`);
  }
}

async function handleCheckSystem() {
  const { agentContext } = extensionState;

  const info = [
    `Platform: ${agentContext.platform}`,
    `Architecture: ${agentContext.architecture}`,
    `Shell: ${agentContext.shell}`,
    `Home Directory: ${agentContext.homeDir}`,
    '',
    'Installed Tools:',
    ...agentContext.existingTools
      .filter(t => t.installed)
      .map(t => `  ✓ ${t.tool} ${t.version || ''}`),
    '',
    'Package Managers:',
    ...agentContext.packageManagers
      .filter(pm => pm.installed)
      .map(pm => `  ✓ ${pm.name} ${pm.version || ''}`)
  ].join('\n');

  vscode.window.showInformationMessage('System info written to output', 'Show Output')
    .then(selection => {
      if (selection === 'Show Output') {
        outputChannel.show();
      }
    });

  outputChannel.appendLine('\n=== System Information ===');
  outputChannel.appendLine(info);
}

function showWelcomeMessage() {
  vscode.window.showInformationMessage(
    'Welcome to AI Agent Developer! I can help you set up your development environment.',
    'Setup Environment',
    'Learn More'
  ).then(selection => {
    if (selection === 'Setup Environment') {
      vscode.commands.executeCommand('aiAgent.setupEnvironment');
    } else if (selection === 'Learn More') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-repo'));
    }
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function deactivate() {
  outputChannel.dispose();
}

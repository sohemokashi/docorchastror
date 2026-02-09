import * as vscode from 'vscode';
import { AgentOrchestrator } from '../agents/orchestrator';
import { SetupRequest } from '../types';

/**
 * Webview provider for the chat interface
 */
export class ChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly orchestrator: AgentOrchestrator
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'setupRequest':
          await this.handleSetupRequest(data.message);
          break;
      }
    });
  }

  private async handleSetupRequest(message: string) {
    const request: SetupRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: message,
      projectPath: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      timestamp: new Date()
    };

    try {
      await this.orchestrator.handleSetupRequest(request);
    } catch (error) {
      vscode.window.showErrorMessage(`Setup failed: ${error}`);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AI Agent Chat</title>
      <style>
        body {
          padding: 10px;
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
        }
        #chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        #messages {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 10px;
        }
        .message {
          margin-bottom: 10px;
          padding: 8px;
          border-radius: 4px;
        }
        .user {
          background-color: var(--vscode-input-background);
        }
        .assistant {
          background-color: var(--vscode-editor-background);
        }
        #input-container {
          display: flex;
          gap: 8px;
        }
        #messageInput {
          flex: 1;
          padding: 8px;
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
        }
        button {
          padding: 8px 16px;
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: var(--vscode-button-hoverBackground);
        }
        .examples {
          margin-top: 20px;
          padding: 10px;
          background-color: var(--vscode-editor-background);
          border-radius: 4px;
        }
        .examples h3 {
          margin-top: 0;
          font-size: 14px;
        }
        .example-button {
          display: block;
          width: 100%;
          text-align: left;
          margin-bottom: 5px;
          padding: 8px;
          background-color: var(--vscode-input-background);
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .example-button:hover {
          background-color: var(--vscode-list-hoverBackground);
        }
      </style>
    </head>
    <body>
      <div id="chat-container">
        <div id="messages"></div>
        <div id="input-container">
          <input type="text" id="messageInput" placeholder="e.g., I need Node.js and Python for this project" />
          <button id="sendButton">Setup</button>
        </div>

        <div class="examples">
          <h3>Quick Examples:</h3>
          <button class="example-button" data-message="I need Node.js, Python 3.11, and Docker">
            Node.js, Python, and Docker
          </button>
          <button class="example-button" data-message="Install Java 17 and Maven">
            Java 17 and Maven
          </button>
          <button class="example-button" data-message="Setup environment for a React Native project">
            React Native project setup
          </button>
          <button class="example-button" data-message="I need Git, VS Code, and PostgreSQL">
            Git, VS Code, and PostgreSQL
          </button>
        </div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const messagesDiv = document.getElementById('messages');

        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') sendMessage();
        });

        // Example buttons
        document.querySelectorAll('.example-button').forEach(button => {
          button.addEventListener('click', () => {
            messageInput.value = button.getAttribute('data-message');
            messageInput.focus();
          });
        });

        function sendMessage() {
          const message = messageInput.value.trim();
          if (!message) return;

          addMessage('user', message);
          vscode.postMessage({ type: 'setupRequest', message });
          messageInput.value = '';

          addMessage('assistant', 'Processing your request...');
        }

        function addMessage(type, text) {
          const messageDiv = document.createElement('div');
          messageDiv.className = 'message ' + type;
          messageDiv.textContent = text;
          messagesDiv.appendChild(messageDiv);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
      </script>
    </body>
    </html>`;
  }
}

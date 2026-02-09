# Setup and Development Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

Get your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)

### 3. Build the Extension

```bash
npm run compile
```

### 4. Run in Development

1. Open this folder in VS Code
2. Press `F5` to launch Extension Development Host
3. In the new window, open Command Palette (Cmd+Shift+P)
4. Type "AI Agent" to see available commands

## Development Workflow

### Compile TypeScript

```bash
# One-time compile
npm run compile

# Watch mode (auto-recompile on changes)
npm run watch
```

### Run Extension

1. Press `F5` in VS Code
2. A new VS Code window opens (Extension Development Host)
3. Test your extension there

### Debug

- Set breakpoints in TypeScript files
- Press `F5` to start debugging
- Extension Development Host will pause at breakpoints

### View Logs

- In Extension Development Host, open Output panel (Cmd+Shift+U)
- Select "AI Agent Developer" from dropdown
- All agent activity is logged there

## Project Structure

```
ai-agent-vscode-extension/
├── src/
│   ├── agents/              # Specialized agents
│   │   ├── orchestrator.ts  # Main coordinator
│   │   ├── languageAgent.ts # Node.js, Python, etc.
│   │   ├── packageManagerAgent.ts
│   │   ├── ideToolAgent.ts
│   │   ├── projectAgent.ts
│   │   └── verificationAgent.ts
│   ├── api/
│   │   └── claudeClient.ts  # Claude API integration
│   ├── context/
│   │   └── contextBuilder.ts # System detection
│   ├── execution/
│   │   └── engine.ts         # Command execution
│   ├── ui/
│   │   ├── chatView.ts       # Chat webview
│   │   └── taskView.ts       # Task tree view
│   ├── extension.ts          # Entry point
│   └── types.ts              # TypeScript definitions
├── resources/
│   └── icon.svg             # Extension icon
├── .vscode/
│   ├── launch.json          # Debug configuration
│   └── tasks.json           # Build tasks
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript config
└── README.md
```

## Testing the Extension

### Test Commands

1. **Setup Environment**
   ```
   Cmd+Shift+P → AI Agent: Setup Environment
   Enter: "I need Node.js and Python"
   ```

2. **Install Specific Tool**
   ```
   Cmd+Shift+P → AI Agent: Install Tool
   Select: Node.js
   ```

3. **Check System**
   ```
   Cmd+Shift+P → AI Agent: Check System
   ```

### Test Chat Interface

1. Click AI Agent icon in Activity Bar (left sidebar)
2. Type a request in the chat input
3. Click "Setup" button
4. Watch progress in Output panel

### Test Different Scenarios

1. **Fresh Machine** (no tools installed)
   - Request: "I need Node.js, Python, and Docker"
   - Should detect missing tools and install them

2. **Partial Setup** (some tools installed)
   - Request: "Setup React development environment"
   - Should detect Node.js if installed, skip it

3. **Specific Versions**
   - Request: "Install Python 3.11"
   - Should install specific version

4. **Cross-Platform Testing**
   - Test on macOS, Windows, and Linux
   - Verify correct package managers are used

## Adding New Agents

### 1. Create Agent File

Create `src/agents/myAgent.ts`:

```typescript
import {
  Agent,
  AgentType,
  InstallationStep,
  AgentContext,
  StepResult,
  Command
} from '../types';

export class MyAgent implements Agent {
  type = AgentType.MY_TYPE; // Add to AgentType enum first
  name = 'My Agent';

  canHandle(step: InstallationStep): boolean {
    // Return true if this agent can handle the step
    return step.tool.toLowerCase().includes('mytool');
  }

  async execute(step: InstallationStep, context: AgentContext): Promise<StepResult> {
    // Agent logic here
    return { success: true };
  }

  planCommands(step: InstallationStep, context: AgentContext): Command[] {
    // Return array of commands to execute
    return [];
  }
}
```

### 2. Register Agent

In `src/agents/orchestrator.ts`:

```typescript
import { MyAgent } from './myAgent';

// In constructor:
this.agents = new Map([
  // ... existing agents
  [AgentType.MY_TYPE, new MyAgent()]
]);
```

### 3. Update Types

In `src/types.ts`:

```typescript
export enum AgentType {
  // ... existing types
  MY_TYPE = 'my_type'
}
```

## Adding New Tools Support

### Language (e.g., Ruby)

1. Update `languageAgent.ts`:
   - Add detection logic in `canHandle()`
   - Add install commands in `getInstallCommands()`
   - Add platform-specific logic

2. Test on all platforms

### IDE Tool (e.g., Kubernetes)

1. Update `ideToolAgent.ts`:
   - Add detection command
   - Add installation for each platform
   - Add verification logic

## Common Issues

### TypeScript Errors

```bash
# Clean and rebuild
rm -rf dist
npm run compile
```

### Extension Not Loading

1. Check console for errors (Help → Toggle Developer Tools)
2. Verify `package.json` activation events
3. Check extension host logs

### API Key Issues

1. Verify key in settings: Cmd+, → search "AI Agent"
2. Check API key at console.anthropic.com
3. Ensure API credits available

### Command Execution Fails

1. Check Output panel for error details
2. Test command manually in terminal
3. Verify permissions (sudo/admin)

## Building for Distribution

### Package Extension

```bash
# Install vsce if not already installed
npm install -g @vscode/vsce

# Package extension
npm run package

# Output: ai-agent-developer-0.1.0.vsix
```

### Publish to Marketplace

1. Create publisher account at https://marketplace.visualstudio.com/
2. Get Personal Access Token
3. Publish:

```bash
vsce publish
```

## Architecture Decisions

### Why Multi-Agent System?

- **Separation of Concerns**: Each agent handles specific type of installation
- **Extensibility**: Easy to add new agents without modifying existing code
- **Testability**: Agents can be tested independently
- **Maintainability**: Clear responsibilities

### Why Claude API?

- **Natural Language Understanding**: Parses user requests accurately
- **Context Awareness**: Understands developer intent
- **Flexibility**: Can handle variations in requests
- **Intelligence**: Makes smart decisions about installation order

### Why VS Code Extension?

- **Familiar Environment**: Developers already use VS Code
- **Terminal Access**: Can execute system commands
- **UI Components**: Built-in webview, tree view, output channel
- **Cross-Platform**: Works on macOS, Windows, Linux

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

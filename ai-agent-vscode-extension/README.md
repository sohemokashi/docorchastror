# AI Agent Developer - VS Code Extension

Autonomous AI agents that help developers set up their local development environment.

## Features

- **Natural Language Setup**: Just tell the AI what you need
  - "I need Node.js, Python, and Docker"
  - "Setup environment for a React project"
  - "Install Java 17 and Maven"

- **Multi-Agent System**: Specialized agents handle different installation types
  - Language Agent: Node.js, Python, Java, Ruby, Go, etc.
  - Package Manager Agent: Homebrew, Chocolatey, apt, yum, etc.
  - IDE Tool Agent: Docker, Git, kubectl, Terraform, etc.
  - Verification Agent: Validates installations

- **Cross-Platform Support**: Works on macOS, Windows, and Linux

- **Smart Detection**: Checks what's already installed before proceeding

- **Progress Tracking**: Visual progress indicators for installations

## Requirements

- VS Code 1.85.0 or higher
- Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com/))

## Installation

1. Install the extension from VS Code Marketplace
2. Open VS Code Settings (Cmd/Ctrl + ,)
3. Search for "AI Agent Developer"
4. Enter your Anthropic API key

## Usage

### Quick Start

1. Open Command Palette (Cmd/Ctrl + Shift + P)
2. Type "AI Agent: Setup Environment"
3. Enter what you need in natural language
4. Approve the installation plan
5. Let the agents do the work!

### Commands

- `AI Agent: Setup Environment` - Start a new environment setup
- `AI Agent: Install Tool` - Install a specific tool
- `AI Agent: Open Chat` - Open the chat interface
- `AI Agent: Check System` - View installed tools and system info

### Examples

**Example 1: Fresh Machine Setup**
```
I need Node.js, Python 3.11, Docker, and Git for web development
```

**Example 2: Project-Specific Setup**
```
Setup environment for a Django project with PostgreSQL
```

**Example 3: Specific Versions**
```
Install Java 17, Maven 3.8, and Spring Boot CLI
```

## How It Works

1. **Parse Request**: Claude AI parses your natural language request
2. **Create Plan**: The orchestrator creates a detailed installation plan
3. **User Approval**: You review and approve the plan
4. **Execute**: Specialized agents execute the installation steps
5. **Verify**: Verification agent confirms everything works

## Architecture

```
User Input → Orchestrator → Specialized Agents → Execution Engine
                                                       ↓
                                               System Commands
```

### Agents

- **Orchestrator**: Coordinates all agents and creates execution plans
- **Language Agent**: Installs programming languages
- **Package Manager Agent**: Installs package managers
- **IDE Tool Agent**: Installs development tools
- **Project Agent**: Handles project-specific setup
- **Verification Agent**: Verifies installations

## Configuration

### Settings

- `aiAgent.apiKey`: Your Anthropic API key (required)
- `aiAgent.model`: Claude model to use (default: claude-3-5-sonnet-20241022)
- `aiAgent.autoExecute`: Auto-execute plans without confirmation (default: false)
- `aiAgent.maxTokens`: Maximum tokens per API request (default: 4096)

### Package Managers

The extension automatically detects and uses available package managers:

- **macOS**: Homebrew (installs if not present)
- **Windows**: Chocolatey, winget
- **Linux**: apt, yum, dnf

## Platform Support

### macOS
- ✓ Homebrew
- ✓ Direct downloads
- ✓ NVM for Node.js

### Windows
- ✓ Chocolatey
- ✓ winget
- ✓ Direct installers

### Linux
- ✓ apt (Debian/Ubuntu)
- ✓ yum (RHEL/CentOS)
- ✓ dnf (Fedora)

## Supported Tools

### Languages
- Node.js (with npm)
- Python (with pip)
- Java (OpenJDK)
- Ruby
- Go
- Rust
- PHP

### Development Tools
- Docker
- Git
- kubectl
- Terraform
- Maven
- Gradle

### Package Managers
- Homebrew (macOS/Linux)
- Chocolatey (Windows)
- winget (Windows)

## Security

- All installations require user approval
- Sudo/admin commands show clear warnings
- Commands are logged in the output channel
- No automatic execution of privileged commands

## Troubleshooting

### API Key Issues
1. Make sure your API key is correctly set in settings
2. Check console.anthropic.com for key validity
3. Ensure you have API credits available

### Installation Failures
1. Check the Output channel (View → Output → AI Agent Developer)
2. Verify you have necessary permissions
3. Try running the failed command manually
4. Check if package manager is installed

### Permission Issues
- macOS/Linux: You'll be prompted for sudo password
- Windows: Run VS Code as Administrator for some installations

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/your-repo/ai-agent-developer

# Install dependencies
cd ai-agent-developer
npm install

# Compile TypeScript
npm run compile

# Run in development
# Press F5 in VS Code to open Extension Development Host
```

### Project Structure

```
ai-agent-vscode-extension/
├── src/
│   ├── agents/           # Specialized agents
│   ├── api/              # Claude API client
│   ├── context/          # System detection
│   ├── execution/        # Command execution
│   ├── ui/               # UI components
│   ├── extension.ts      # Entry point
│   └── types.ts          # TypeScript types
├── package.json          # Extension manifest
└── README.md
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

## Support

- GitHub Issues: [github.com/your-repo/issues](https://github.com/your-repo/issues)
- Documentation: [github.com/your-repo/wiki](https://github.com/your-repo/wiki)

## Roadmap

- [ ] Support for more programming languages
- [ ] Database installations (PostgreSQL, MongoDB, Redis)
- [ ] IDE configurations (VS Code extensions, settings)
- [ ] Project templates and scaffolding
- [ ] Team onboarding profiles
- [ ] Custom agent creation

## Acknowledgments

Built with:
- [Anthropic Claude API](https://anthropic.com/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript](https://www.typescriptlang.org/)

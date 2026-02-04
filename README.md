# Task Generator

A simple web application that converts plain text into structured task JSON using AWS Bedrock.

## Features

- Simple React UI for text input
- AWS Lambda backend for processing
- AWS Bedrock integration for AI-powered task generation
- Terraform deployment configuration

## Architecture

```
User Input (UI) → Lambda Function → AWS Bedrock → Task JSON Output
```

## Project Structure

```
task-generator/
├── frontend/           # React application
├── lambda/            # Lambda function code
├── terraform/         # Infrastructure as Code
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- AWS Account
- Terraform installed
- AWS CLI configured

### Local Development

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Lambda (local testing)
```bash
cd lambda
npm install
npm test
```

### Deployment

See [terraform/README.md](terraform/README.md) for deployment instructions.

## Example Usage

**Input:**
```
I want to install python
```

**Output:**
```json
{
  "task": "Install Python",
  "steps": [
    "Download Python installer from python.org",
    "Run the installer",
    "Add Python to PATH",
    "Verify installation with python --version"
  ],
  "priority": "medium",
  "estimatedTime": "15 minutes"
}
```

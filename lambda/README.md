# Task Generator Lambda

AWS Lambda function that uses AWS Bedrock to convert plain text into structured task JSON.

## Features

- Express.js server wrapped with serverless-http
- AWS Bedrock integration (Claude 3 Sonnet)
- Structured task generation
- CORS enabled for frontend integration

## API Endpoints

### POST /api/generate-task

Generate a structured task from plain text.

**Request:**
```json
{
  "prompt": "I want to install python"
}
```

**Response:**
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
  "estimatedTime": "15 minutes",
  "category": "development",
  "timestamp": "2026-02-03T12:00:00.000Z",
  "originalPrompt": "I want to install python"
}
```

### GET /api/health

Health check endpoint.

## Environment Variables

- `AWS_REGION` - AWS region for Bedrock (default: us-east-1)
- `BEDROCK_MODEL_ID` - Bedrock model ID (default: anthropic.claude-3-sonnet-20240229-v1:0)

## Local Development

```bash
npm install
node index.js
```

The server will start on `http://localhost:3001`.

Test with curl:
```bash
curl -X POST http://localhost:3001/api/generate-task \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I want to install python"}'
```

## Deployment

This function is deployed via Terraform. See the terraform/ directory for deployment configuration.

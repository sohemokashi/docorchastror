# Local Development Guide

## Running Locally (Without AWS)

You can develop and test the application locally before deploying to AWS.

### Backend (Lambda) - Local Development

1. **Install dependencies:**
```bash
cd lambda
npm install
```

2. **Set environment variables:**
Create `lambda/.env`:
```bash
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

3. **Run locally:**
```bash
node index.js
```

The server will start at `http://localhost:3001`

4. **Test with curl:**
```bash
curl -X POST http://localhost:3001/api/generate-task \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I want to install python"}'
```

**Note:** Local testing requires AWS credentials configured (`aws configure`) and Bedrock model access.

### Frontend - Local Development

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure API endpoint:**
Create `frontend/.env`:
```bash
VITE_API_ENDPOINT=http://localhost:3001/api
```

3. **Run development server:**
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Full Stack Local Development

Run both backend and frontend simultaneously:

**Terminal 1 (Backend):**
```bash
cd lambda
npm install
node index.js
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` and start developing!

## Project Structure

```
task-generator/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── App.tsx       # Main React component
│   │   ├── App.css       # Styles
│   │   ├── main.tsx      # Entry point
│   │   └── index.css     # Global styles
│   ├── index.html        # HTML template
│   ├── package.json      # Frontend dependencies
│   └── vite.config.ts    # Vite configuration
│
├── lambda/               # Lambda function (Express.js)
│   ├── index.js         # Main Lambda handler
│   ├── package.json     # Lambda dependencies
│   └── README.md        # Lambda documentation
│
├── terraform/           # Infrastructure as Code
│   ├── main.tf         # Provider configuration
│   ├── variables.tf    # Input variables
│   ├── lambda.tf       # Lambda resources
│   ├── api-gateway.tf  # API Gateway resources
│   ├── s3.tf          # S3 bucket for frontend
│   ├── outputs.tf     # Output values
│   └── README.md      # Deployment guide
│
├── deploy.sh          # Automated deployment (Linux/Mac)
├── deploy.bat         # Automated deployment (Windows)
├── QUICKSTART.md      # Quick start guide
├── README.md          # Main documentation
└── .gitignore         # Git ignore file
```

## Development Workflow

### 1. Make Changes

Edit files in `frontend/src/` or `lambda/` directories.

### 2. Test Locally

Test your changes using the local development setup above.

### 3. Deploy to AWS

```bash
# Automated
./deploy.sh  # or deploy.bat on Windows

# Manual
cd terraform
terraform apply
cd ../frontend
npm run build
aws s3 sync dist/ s3://<bucket-name>/
```

## Common Development Tasks

### Update Frontend UI

Edit [frontend/src/App.tsx](frontend/src/App.tsx) and [frontend/src/App.css](frontend/src/App.css).

Changes will hot-reload if using `npm run dev`.

### Modify Task Generation Logic

Edit [lambda/index.js](lambda/index.js) in the `generateTaskWithBedrock` function.

### Change Bedrock Model

Update the model ID in:
- Local: `lambda/.env`
- Production: `terraform/terraform.tfvars`

Available models:
- `anthropic.claude-3-haiku-20240307-v1:0` (fastest, cheapest)
- `anthropic.claude-3-sonnet-20240229-v1:0` (balanced)
- `anthropic.claude-3-opus-20240229-v1:0` (most capable, expensive)

### Add New API Endpoints

1. Add route in `lambda/index.js`:
```javascript
app.post("/api/my-endpoint", async (req, res) => {
  // Your logic here
  res.json({ result: "success" });
});
```

2. Call from frontend:
```typescript
const response = await fetch(`${API_ENDPOINT}/my-endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'value' })
});
```

### Debug Lambda Issues

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/task-generator-dev-api --follow
```

Or use AWS Console: CloudWatch → Log groups → `/aws/lambda/task-generator-dev-api`

### View API Gateway Logs

```bash
aws logs tail /aws/apigateway/task-generator-dev --follow
```

## Environment Variables

### Frontend (.env)
```bash
VITE_API_ENDPOINT=<api-gateway-url>
```

### Lambda (set in Terraform)
```bash
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
ENVIRONMENT=dev
PROJECT=task-generator
```

## Testing

### Manual Testing

Use the example prompts in the UI or test via curl:

```bash
# Test API directly
curl -X POST https://<api-endpoint>/v1/api/generate-task \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a Docker container"}'

# Test health endpoint
curl https://<api-endpoint>/v1/api/health
```

### Test Different Prompts

Try various task types:
- "Install Python on Windows"
- "Set up a React project with TypeScript"
- "Deploy a Node.js app to AWS"
- "Configure PostgreSQL database"
- "Create a REST API with authentication"

## Performance Optimization

### Lambda Cold Start

First request may be slow (2-5 seconds) due to cold start. Subsequent requests are faster (<1 second).

To reduce cold starts:
- Increase Lambda memory (more CPU)
- Use provisioned concurrency (costs more)
- Keep Lambda warm with scheduled pings

### Frontend Build Size

Optimize build:
```bash
cd frontend
npm run build
# Check size: du -sh dist/
```

Keep bundle size < 500KB for fast loading.

## Troubleshooting

### Local Lambda Won't Start
- Check AWS credentials: `aws sts get-caller-identity`
- Verify Bedrock access in your region
- Check Node.js version: `node --version` (should be 18+)

### Frontend Build Fails
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

### Terraform Apply Fails
- Check AWS credentials and permissions
- Verify region has Bedrock available
- Look for resource naming conflicts

## Best Practices

1. **Always test locally** before deploying
2. **Use environment variables** for configuration
3. **Check CloudWatch logs** for errors
4. **Monitor costs** in AWS Cost Explorer
5. **Version control** your changes
6. **Document** custom modifications

## Hot Reload Development

For the best development experience:

1. Start backend with nodemon (auto-restart):
```bash
cd lambda
npm install -g nodemon
nodemon index.js
```

2. Start frontend (auto-reload):
```bash
cd frontend
npm run dev
```

Both will automatically reload on file changes!

# GitHub Actions CI/CD

This directory contains GitHub Actions workflows for automated deployment.

## Workflows

### 1. Deploy (`deploy.yaml`)

Deploys the Task Generator application to AWS.

**Trigger**: Manual workflow dispatch

**Inputs**:
- `tf_apply`: Whether to apply Terraform changes (default: true)
- `environment`: Target environment (dev/staging/prod)

**Steps**:
1. Checkout code
2. Setup Terraform and Node.js
3. Install Lambda dependencies
4. Run Terraform (init, validate, plan, apply)
5. Build frontend with API endpoint
6. Deploy frontend to S3
7. Test API health
8. Display deployment summary

**Usage**:
1. Go to Actions tab in GitHub
2. Select "Deploy Task Generator"
3. Click "Run workflow"
4. Choose environment and options
5. Click "Run workflow"

### 2. Destroy (`destroy.yaml`)

Destroys all AWS infrastructure.

**Trigger**: Manual workflow dispatch

**Inputs**:
- `environment`: Target environment to destroy
- `confirm`: Must type "destroy" to confirm

**Steps**:
1. Verify confirmation
2. Empty S3 bucket
3. Run Terraform destroy
4. Display summary

**Usage**:
1. Go to Actions tab in GitHub
2. Select "Destroy Infrastructure"
3. Click "Run workflow"
4. Choose environment
5. Type "destroy" in confirmation
6. Click "Run workflow"

## Required Secrets

Configure these secrets in GitHub repository settings:

### Repository Secrets

- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region (optional, defaults to us-east-1)

### Setting up Secrets

1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value

### AWS IAM User Permissions

The AWS user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "s3:*",
        "iam:*",
        "logs:*",
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "*"
    }
  ]
}
```

## Environment Configuration

You can set up multiple environments (dev, staging, prod) using GitHub Environments:

1. Go to Settings → Environments
2. Create environment (e.g., "dev", "prod")
3. Add environment-specific secrets if needed
4. Configure protection rules (e.g., require approval for prod)

## Terraform State Backend

For team collaboration, configure a remote backend in `terraform/main.tf`:

```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "task-generator/terraform.tfstate"
  region         = "us-east-1"
  dynamodb_table = "terraform-locks"
  encrypt        = true
}
```

Create the S3 bucket and DynamoDB table first:

```bash
# Create state bucket
aws s3 mb s3://your-terraform-state-bucket

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-terraform-state-bucket \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## Workflow Security

### Best Practices

1. **Use Environment Protection**: Require manual approval for production deployments
2. **Limit Permissions**: Create IAM user with minimum required permissions
3. **Rotate Credentials**: Regularly rotate AWS access keys
4. **Use Environments**: Separate dev/staging/prod with different AWS accounts if possible
5. **Review Plans**: Always review Terraform plan before applying

### Production Deployment Checklist

Before deploying to production:

- [ ] Review Terraform plan output
- [ ] Verify environment is correct
- [ ] Check API endpoint configuration
- [ ] Test in staging environment first
- [ ] Notify team members
- [ ] Have rollback plan ready

## Monitoring Deployments

### View Workflow Runs

1. Go to Actions tab
2. Click on workflow run
3. View logs for each step

### Check AWS Resources

After deployment:

```bash
# Check Lambda function
aws lambda get-function --function-name task-generator-dev-api

# Check API Gateway
aws apigatewayv2 get-apis

# Check S3 bucket
aws s3 ls task-generator-dev-frontend-*

# View Lambda logs
aws logs tail /aws/lambda/task-generator-dev-api --follow
```

## Troubleshooting

### Deployment Fails at Terraform Apply

- Check AWS credentials are valid
- Verify IAM permissions
- Review Terraform error message in logs
- Check for resource naming conflicts

### Frontend Build Fails

- Ensure Node.js version is correct (20+)
- Check package.json dependencies
- Review build logs for errors

### S3 Deployment Fails

- Verify S3 bucket exists
- Check S3 bucket permissions
- Ensure AWS credentials have S3 write access

### API Health Check Fails

- Lambda may still be initializing (wait a few seconds)
- Check CloudWatch logs for Lambda errors
- Verify API Gateway is deployed correctly

## Manual Deployment

If you prefer manual deployment without GitHub Actions:

```bash
# 1. Install dependencies
cd lambda && npm install && cd ..

# 2. Deploy infrastructure
cd terraform
terraform init
terraform apply

# 3. Build and deploy frontend
cd ../frontend
export VITE_API_ENDPOINT=$(cd ../terraform && terraform output -raw api_endpoint)
npm install
npm run build
aws s3 sync dist/ s3://$(cd ../terraform && terraform output -raw s3_bucket_name)/
```

## Continuous Integration

You can extend these workflows with:

- **Automated Testing**: Run tests before deployment
- **Linting**: Check code quality
- **Security Scanning**: Scan for vulnerabilities
- **Notifications**: Send deployment notifications to Slack/Email
- **Rollback**: Automatic rollback on failure

Example test step:
```yaml
- name: Run tests
  working-directory: lambda
  run: npm test
```

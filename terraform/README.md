# Terraform Deployment

Infrastructure as Code for the Task Generator application using AWS services.

## Architecture

- **Frontend**: React app hosted on S3 (static website)
- **API**: AWS API Gateway (HTTP API)
- **Compute**: AWS Lambda (Node.js)
- **AI**: AWS Bedrock (Claude 3 Sonnet)

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured (`aws configure`)
3. Terraform installed (>= 1.0)
4. Required IAM permissions:
   - Lambda
   - API Gateway
   - S3
   - Bedrock (model invocation)
   - IAM role creation
   - CloudWatch Logs

## Bedrock Model Access

Before deploying, ensure you have access to AWS Bedrock models:

1. Go to AWS Console → Bedrock → Model access
2. Request access to: `Anthropic Claude 3 Sonnet`
3. Wait for approval (usually instant)

## Deployment Steps

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Review Configuration

Edit `terraform.tfvars` if needed:

```hcl
aws_region   = "us-east-1"
project_name = "task-generator"
environment  = "dev"
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

Review the changes and type `yes` to confirm.

### 5. Note the Outputs

After deployment, Terraform will output:
- API endpoint URL
- S3 bucket name
- Frontend URL
- Deployment instructions

### 6. Deploy Frontend

```bash
# Create environment file
cd ../frontend
echo "VITE_API_ENDPOINT=<your-api-endpoint-from-terraform-output>" > .env

# Build and deploy
npm install
npm run build
aws s3 sync dist/ s3://<bucket-name-from-terraform-output>/
```

## Testing

### Test the API

```bash
curl -X POST https://<api-endpoint>/v1/api/generate-task \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I want to install python"}'
```

### Test the Frontend

Open the S3 website URL in your browser (from Terraform outputs).

## Cost Estimation

- **Lambda**: ~$0.20 per 1M requests + compute time
- **API Gateway**: ~$1.00 per 1M requests
- **S3**: ~$0.023 per GB storage + data transfer
- **Bedrock**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **CloudWatch Logs**: ~$0.50 per GB ingested

Estimated monthly cost for moderate use (<10K requests): **$2-5/month**

## Terraform State

This configuration uses local state by default. For production:

1. Create S3 bucket for state:
```bash
aws s3 mb s3://your-terraform-state-bucket
```

2. Uncomment and configure backend in `main.tf`:
```hcl
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "task-generator/terraform.tfstate"
  region = "us-east-1"
}
```

3. Reinitialize:
```bash
terraform init -migrate-state
```

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `project_name` | Project name | `task-generator` |
| `environment` | Environment | `dev` |
| `lambda_runtime` | Lambda runtime | `nodejs20.x` |
| `lambda_timeout` | Lambda timeout (seconds) | `30` |
| `lambda_memory_size` | Lambda memory (MB) | `512` |
| `bedrock_model_id` | Bedrock model ID | Claude 3 Sonnet |
| `cors_allowed_origins` | CORS origins | `["*"]` |

## Outputs

| Output | Description |
|--------|-------------|
| `api_endpoint` | Full API endpoint URL |
| `lambda_function_name` | Lambda function name |
| `s3_bucket_name` | Frontend S3 bucket |
| `s3_website_url` | Frontend URL |

## Cleanup

To destroy all resources:

```bash
# Empty S3 bucket first
aws s3 rm s3://<bucket-name> --recursive

# Destroy infrastructure
terraform destroy
```

## Troubleshooting

### Bedrock Access Denied

Error: `AccessDeniedException: You don't have access to the model`

**Solution**: Request model access in AWS Console → Bedrock → Model access

### Lambda Timeout

Error: `Task timed out after 30.00 seconds`

**Solution**: Increase `lambda_timeout` variable in terraform.tfvars

### CORS Issues

Error: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**: Update `cors_allowed_origins` variable or check API Gateway CORS configuration

### S3 Website Not Accessible

**Solution**: 
1. Verify bucket policy allows public read
2. Check S3 bucket public access settings
3. Wait a few minutes for DNS propagation

## Security Considerations

### Production Recommendations:

1. **CORS**: Restrict to specific domains
   ```hcl
   cors_allowed_origins = ["https://yourdomain.com"]
   ```

2. **API Authentication**: Add API key or Cognito auth
3. **Rate Limiting**: Configure API Gateway throttling
4. **CloudFront**: Add CloudFront CDN for frontend
5. **WAF**: Add AWS WAF for protection
6. **Secrets**: Use AWS Secrets Manager for sensitive config
7. **VPC**: Deploy Lambda in VPC if needed

## Monitoring

- **Lambda Logs**: CloudWatch Logs → `/aws/lambda/task-generator-*`
- **API Gateway Logs**: CloudWatch Logs → `/aws/apigateway/task-generator-*`
- **Lambda Metrics**: CloudWatch → Lambda → Metrics
- **API Metrics**: CloudWatch → API Gateway → Metrics

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review Terraform outputs
3. Verify Bedrock model access
4. Test API with curl

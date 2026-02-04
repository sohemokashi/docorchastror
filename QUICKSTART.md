# Quick Start Guide

Get your Task Generator up and running in minutes!

## Prerequisites

- AWS Account ([Create one here](https://aws.amazon.com/))
- AWS CLI installed and configured (`aws configure`)
- Terraform installed ([Download](https://www.terraform.io/downloads))
- Node.js 18+ ([Download](https://nodejs.org/))

## Step 1: Enable Bedrock Model Access

1. Open AWS Console
2. Navigate to **Amazon Bedrock** → **Model access**
3. Click **Request model access**
4. Select **Anthropic Claude 3 Sonnet**
5. Submit request (usually approved instantly)

## Step 2: Deploy (Automated)

### Windows:
```powershell
.\deploy.bat
```

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. ✅ Check prerequisites
2. ✅ Install dependencies
3. ✅ Deploy infrastructure (Lambda, API Gateway, S3)
4. ✅ Build and deploy frontend
5. ✅ Display access URLs

## Step 3: Access Your Application

After deployment completes, you'll see:
- **Frontend URL**: `http://task-generator-dev-frontend-xxx.s3-website-us-east-1.amazonaws.com`
- **API Endpoint**: `https://xxx.execute-api.us-east-1.amazonaws.com/v1/api`

## Step 4: Test It Out

1. Open the Frontend URL in your browser
2. Type: "I want to install python"
3. Click "Generate Task"
4. See the structured task JSON! 🎉

## Manual Deployment (Alternative)

### 1. Install Lambda Dependencies
```bash
cd lambda
npm install
cd ..
```

### 2. Deploy Infrastructure
```bash
cd terraform
terraform init
terraform apply
```

Note the `api_endpoint` and `s3_bucket_name` outputs.

### 3. Build Frontend
```bash
cd frontend
echo "VITE_API_ENDPOINT=<your-api-endpoint>" > .env
npm install
npm run build
```

### 4. Deploy Frontend to S3
```bash
aws s3 sync dist/ s3://<your-s3-bucket>/
```

## Troubleshooting

### "AccessDeniedException" when calling Bedrock
→ You haven't enabled model access. Go to Step 1.

### "Terraform apply" fails
→ Run `aws configure` and ensure your AWS credentials are set.

### Frontend shows CORS error
→ Check that `.env` has the correct API endpoint.

### Can't access S3 website
→ Wait 1-2 minutes for S3 to propagate changes.

## Cost

Expected cost for moderate usage (<10K requests/month): **$2-5/month**

## Next Steps

- Customize the UI in `frontend/src/App.tsx`
- Modify task generation logic in `lambda/index.js`
- Add authentication (Cognito)
- Set up custom domain (Route53 + CloudFront)

## Clean Up

To delete all resources and avoid charges:

```bash
# Empty S3 bucket
aws s3 rm s3://<bucket-name> --recursive

# Destroy infrastructure
cd terraform
terraform destroy
```

## Need Help?

- Check [README.md](README.md) for detailed documentation
- Review [terraform/README.md](terraform/README.md) for infrastructure details
- Check AWS CloudWatch Logs for errors

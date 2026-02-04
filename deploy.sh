#!/bin/bash
set -e

echo "🚀 Deploying Task Generator Application"
echo "========================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found. Please install Terraform."
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js."
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Install Lambda dependencies
echo -e "\n${YELLOW}Installing Lambda dependencies...${NC}"
cd lambda
npm install --production
cd ..

echo -e "${GREEN}✓ Lambda dependencies installed${NC}"

# Deploy with Terraform
echo -e "\n${YELLOW}Deploying infrastructure with Terraform...${NC}"
cd terraform

# Initialize if needed
if [ ! -d ".terraform" ]; then
    terraform init
fi

# Apply
terraform apply -auto-approve

# Get outputs
API_ENDPOINT=$(terraform output -raw api_endpoint)
S3_BUCKET=$(terraform output -raw s3_bucket_name)

cd ..

echo -e "${GREEN}✓ Infrastructure deployed${NC}"

# Build and deploy frontend
echo -e "\n${YELLOW}Building and deploying frontend...${NC}"
cd frontend

# Create .env file
echo "VITE_API_ENDPOINT=$API_ENDPOINT" > .env

# Install dependencies and build
npm install
npm run build

# Deploy to S3
aws s3 sync dist/ "s3://$S3_BUCKET/" --delete

cd ..

echo -e "${GREEN}✓ Frontend deployed${NC}"

# Display success message
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
cd terraform
terraform output deployment_instructions
cd ..

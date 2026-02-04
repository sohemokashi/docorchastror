@echo off
setlocal enabledelayedexpansion

echo ================================
echo Task Generator Deployment Script
echo ================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where terraform >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Terraform not found. Please install Terraform.
    exit /b 1
)

where aws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] AWS CLI not found. Please install AWS CLI.
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js.
    exit /b 1
)

echo [OK] All prerequisites met
echo.

REM Install Lambda dependencies
echo Installing Lambda dependencies...
cd lambda
call npm install --production
cd ..
echo [OK] Lambda dependencies installed
echo.

REM Deploy with Terraform
echo Deploying infrastructure with Terraform...
cd terraform

if not exist ".terraform" (
    terraform init
)

terraform apply -auto-approve

REM Get outputs
for /f "delims=" %%i in ('terraform output -raw api_endpoint') do set API_ENDPOINT=%%i
for /f "delims=" %%i in ('terraform output -raw s3_bucket_name') do set S3_BUCKET=%%i

cd ..
echo [OK] Infrastructure deployed
echo.

REM Build and deploy frontend
echo Building and deploying frontend...
cd frontend

REM Create .env file
echo VITE_API_ENDPOINT=%API_ENDPOINT%> .env

REM Install dependencies and build
call npm install
call npm run build

REM Deploy to S3
aws s3 sync dist/ s3://%S3_BUCKET%/ --delete

cd ..
echo [OK] Frontend deployed
echo.

echo ================================
echo Deployment Complete!
echo ================================
echo.

cd terraform
terraform output deployment_instructions
cd ..

endlocal

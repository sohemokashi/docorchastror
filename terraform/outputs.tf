output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "api_endpoint" {
  description = "API Gateway endpoint URL (via CloudFront)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}/api"
}

output "api_gateway_url" {
  description = "Direct API Gateway URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.task_generator.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.task_generator.arn
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "deployment_instructions" {
  description = "Next steps for deployment"
  value = <<-EOT
  
  Deployment Complete! 🎉
  
  Frontend URL: https://${aws_cloudfront_distribution.frontend.domain_name}
  API Endpoint: https://${aws_cloudfront_distribution.frontend.domain_name}/api
  
  Note: CloudFront distribution may take 5-10 minutes to fully deploy.
  
  Test the API:
  curl -X POST https://${aws_cloudfront_distribution.frontend.domain_name}/api/generate-task \
    -H "Content-Type: application/json" \
    -d '{"prompt": "I want to install python"}'
  
  EOT
}

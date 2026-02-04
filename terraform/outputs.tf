output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/${var.api_gateway_stage_name}/api"
}

output "api_gateway_url" {
  description = "Full API Gateway URL"
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

output "s3_website_endpoint" {
  description = "S3 website endpoint"
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "s3_website_url" {
  description = "S3 website URL"
  value       = "http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}"
}

output "deployment_instructions" {
  description = "Next steps for deployment"
  value = <<-EOT
  
  Deployment Complete! 🎉
  
  Next Steps:
  
  1. Update frontend environment:
     Create frontend/.env with:
     VITE_API_ENDPOINT=${aws_apigatewayv2_api.main.api_endpoint}/${var.api_gateway_stage_name}/api
  
  2. Build and deploy frontend:
     cd ../frontend
     npm install
     npm run build
     aws s3 sync dist/ s3://${aws_s3_bucket.frontend.id}/
  
  3. Access your application:
     Frontend: http://${aws_s3_bucket_website_configuration.frontend.website_endpoint}
     API: ${aws_apigatewayv2_api.main.api_endpoint}/${var.api_gateway_stage_name}/api
  
  4. Test the API:
     curl -X POST ${aws_apigatewayv2_api.main.api_endpoint}/${var.api_gateway_stage_name}/api/generate-task \
       -H "Content-Type: application/json" \
       -d '{"prompt": "I want to install python"}'
  
  EOT
}

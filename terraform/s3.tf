########################################
# S3 Bucket for Frontend Hosting
########################################

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-${var.environment}-frontend-${data.aws_caller_identity.current.account_id}"
}

# Note: S3 bucket is private by default
# Access will be through signed URLs or you can configure CloudFront

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "frontend" {
  depends_on = [
    aws_s3_bucket_ownership_controls.frontend,
    aws_s3_bucket_public_access_block.frontend
  ]

  bucket = aws_s3_bucket.frontend.id
  acl    = "public-read"
}

# Bucket policy removed - keeping bucket private
# For public access, you would need to:
# 1. Disable Block Public Access at the account level, OR
# 2. Use CloudFront with OAI, OR
# 3. Use signed URLs

########################################
# Data Source for Account ID
########################################

data "aws_caller_identity" "current" {}

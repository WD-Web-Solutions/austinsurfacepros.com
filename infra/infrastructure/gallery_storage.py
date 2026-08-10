from dataclasses import dataclass

import pulumi
import pulumi_aws as aws


@dataclass(frozen=True)
class GalleryStorageOutputs:
    bucket_name: pulumi.Output[str]
    bucket_arn: pulumi.Output[str]
    bucket_regional_domain_name: pulumi.Output[str]


def create_gallery_storage(
    name_prefix: str,
    bucket_name: str,
    site_origin: str,
    protect_resources: bool,
    tags: dict[str, str],
    provider: aws.Provider,
) -> GalleryStorageOutputs:
    options = pulumi.ResourceOptions(provider=provider, protect=protect_resources)
    bucket = aws.s3.Bucket(
        f"{name_prefix}-gallery-media",
        bucket=bucket_name,
        force_destroy=not protect_resources,
        tags=tags,
        opts=options,
    )
    aws.s3.BucketPublicAccessBlock(
        f"{name_prefix}-gallery-media-public-access",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.s3.BucketServerSideEncryptionConfiguration(
        f"{name_prefix}-gallery-media-encryption",
        bucket=bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            )
        ],
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.s3.BucketCorsConfigurationV2(
        f"{name_prefix}-gallery-media-cors",
        bucket=bucket.id,
        cors_rules=[
            aws.s3.BucketCorsConfigurationV2CorsRuleArgs(
                allowed_headers=["content-type", "x-amz-server-side-encryption"],
                allowed_methods=["PUT"],
                allowed_origins=[site_origin, "http://localhost:4200"],
                expose_headers=["ETag"],
                max_age_seconds=300,
            )
        ],
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.s3.BucketLifecycleConfigurationV2(
        f"{name_prefix}-gallery-media-lifecycle",
        bucket=bucket.id,
        rules=[
            aws.s3.BucketLifecycleConfigurationV2RuleArgs(
                id="expire-abandoned-gallery-staging-uploads",
                status="Enabled",
                filter=aws.s3.BucketLifecycleConfigurationV2RuleFilterArgs(
                    prefix="gallery-media/staging/"
                ),
                expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(days=1),
                abort_incomplete_multipart_upload=(
                    aws.s3.BucketLifecycleConfigurationV2RuleAbortIncompleteMultipartUploadArgs(
                        days_after_initiation=1
                    )
                ),
            )
        ],
        opts=pulumi.ResourceOptions(provider=provider),
    )
    return GalleryStorageOutputs(
        bucket_name=bucket.bucket,
        bucket_arn=bucket.arn,
        bucket_regional_domain_name=bucket.bucket_regional_domain_name,
    )


def allow_cloudfront_gallery_reads(
    name_prefix: str,
    storage: GalleryStorageOutputs,
    distribution_arn: pulumi.Input[str],
    provider: aws.Provider,
) -> None:
    policy = aws.iam.get_policy_document_output(
        statements=[
            aws.iam.GetPolicyDocumentStatementArgs(
                sid="CloudFrontReadProcessedGalleryMedia",
                actions=["s3:GetObject"],
                effect="Allow",
                resources=[
                    storage.bucket_arn.apply(lambda arn: f"{arn}/gallery-media/processed/*")
                ],
                principals=[
                    aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                        type="Service",
                        identifiers=["cloudfront.amazonaws.com"],
                    )
                ],
                conditions=[
                    aws.iam.GetPolicyDocumentStatementConditionArgs(
                        test="StringEquals",
                        variable="AWS:SourceArn",
                        values=[distribution_arn],
                    )
                ],
            )
        ],
        opts=pulumi.InvokeOptions(provider=provider),
    )
    aws.s3.BucketPolicy(
        f"{name_prefix}-gallery-media-policy",
        bucket=storage.bucket_name,
        policy=policy.json,
        opts=pulumi.ResourceOptions(provider=provider),
    )

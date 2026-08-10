from dataclasses import dataclass

import pulumi
import pulumi_aws as aws

from infrastructure.api import ApiOutputs


@dataclass(frozen=True)
class FrontendOutputs:
    bucket_name: pulumi.Output[str]
    bucket_arn: pulumi.Output[str]
    distribution_id: pulumi.Output[str]
    distribution_arn: pulumi.Output[str]
    distribution_domain_name: pulumi.Output[str]


def create_frontend(
    name_prefix: str,
    bucket_name: str,
    api: ApiOutputs,
    gallery_bucket_domain_name: pulumi.Input[str] | None,
    domain_name: str | None,
    hosted_zone_id: str | None,
    certificate_arn: str | None,
    protect_resources: bool,
    tags: dict[str, str],
    provider: aws.Provider,
) -> FrontendOutputs:
    protected_options = pulumi.ResourceOptions(
        provider=provider,
        protect=protect_resources,
    )
    bucket = aws.s3.Bucket(
        f"{name_prefix}-frontend",
        bucket=bucket_name,
        force_destroy=not protect_resources,
        tags=tags,
        opts=protected_options,
    )
    aws.s3.BucketPublicAccessBlock(
        f"{name_prefix}-frontend-public-access",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.s3.BucketServerSideEncryptionConfiguration(
        f"{name_prefix}-frontend-encryption",
        bucket=bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )
        ],
        opts=pulumi.ResourceOptions(provider=provider),
    )

    origin_access_control = aws.cloudfront.OriginAccessControl(
        f"{name_prefix}-frontend-oac",
        name=f"{name_prefix}-frontend-oac",
        description="CloudFront access to the private Angular bucket",
        origin_access_control_origin_type="s3",
        signing_behavior="always",
        signing_protocol="sigv4",
        opts=pulumi.ResourceOptions(provider=provider),
    )
    spa_rewrite = aws.cloudfront.Function(
        f"{name_prefix}-spa-rewrite",
        name=f"{name_prefix}-spa-rewrite",
        runtime="cloudfront-js-2.0",
        publish=True,
        tags=tags,
        code="""function handler(event) {
  var request = event.request;
  var lastSegment = request.uri.split('/').pop();
  if (!lastSegment.includes('.')) {
    request.uri = '/index.html';
  }
  return request;
}
""",
        opts=pulumi.ResourceOptions(provider=provider),
    )

    invoke_options = pulumi.InvokeOptions(provider=provider)
    caching_optimized = aws.cloudfront.get_cache_policy(
        name="Managed-CachingOptimized", opts=invoke_options
    )
    caching_disabled = aws.cloudfront.get_cache_policy(
        name="Managed-CachingDisabled", opts=invoke_options
    )
    all_viewer_except_host = aws.cloudfront.get_origin_request_policy(
        name="Managed-AllViewerExceptHostHeader", opts=invoke_options
    )

    aliases = [domain_name] if domain_name is not None else []
    if certificate_arn is None:
        viewer_certificate = aws.cloudfront.DistributionViewerCertificateArgs(
            cloudfront_default_certificate=True,
        )
    else:
        viewer_certificate = aws.cloudfront.DistributionViewerCertificateArgs(
            acm_certificate_arn=certificate_arn,
            minimum_protocol_version="TLSv1.2_2021",
            ssl_support_method="sni-only",
        )

    origins = [
        aws.cloudfront.DistributionOriginArgs(
            domain_name=api.origin_domain_name,
            origin_id="backend-api",
            connection_attempts=3,
            connection_timeout=10,
            custom_headers=[],
            origin_path="",
            response_completion_timeout=0,
            custom_origin_config=aws.cloudfront.DistributionOriginCustomOriginConfigArgs(
                http_port=80,
                https_port=443,
                origin_keepalive_timeout=5,
                origin_protocol_policy="https-only",
                origin_read_timeout=30,
                origin_ssl_protocols=["TLSv1.2"],
            ),
        ),
        aws.cloudfront.DistributionOriginArgs(
            domain_name=bucket.bucket_regional_domain_name,
            origin_id="frontend-s3",
            connection_attempts=3,
            connection_timeout=10,
            custom_headers=[],
            origin_access_control_id=origin_access_control.id,
            origin_path="",
            response_completion_timeout=0,
            s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                origin_access_identity=""
            ),
        ),
    ]
    ordered_cache_behaviors = [
        aws.cloudfront.DistributionOrderedCacheBehaviorArgs(
            path_pattern="/api/*",
            target_origin_id="backend-api",
            viewer_protocol_policy="https-only",
            allowed_methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
            cached_methods=["GET", "HEAD"],
            compress=True,
            cache_policy_id=caching_disabled.id,
            origin_request_policy_id=all_viewer_except_host.id,
        )
    ]
    if gallery_bucket_domain_name is not None:
        origins.append(
            aws.cloudfront.DistributionOriginArgs(
                domain_name=gallery_bucket_domain_name,
                origin_id="gallery-media-s3",
                connection_attempts=3,
                connection_timeout=10,
                custom_headers=[],
                origin_access_control_id=origin_access_control.id,
                origin_path="",
                response_completion_timeout=0,
                s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                    origin_access_identity=""
                ),
            )
        )
        ordered_cache_behaviors.insert(
            0,
            aws.cloudfront.DistributionOrderedCacheBehaviorArgs(
                path_pattern="/gallery-media/processed/*",
                target_origin_id="gallery-media-s3",
                viewer_protocol_policy="https-only",
                allowed_methods=["GET", "HEAD", "OPTIONS"],
                cached_methods=["GET", "HEAD"],
                compress=True,
                cache_policy_id=caching_optimized.id,
            ),
        )

    distribution = aws.cloudfront.Distribution(
        f"{name_prefix}-distribution",
        enabled=True,
        aliases=aliases,
        default_root_object="index.html",
        price_class="PriceClass_100",
        origins=origins,
        default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
            target_origin_id="frontend-s3",
            viewer_protocol_policy="redirect-to-https",
            allowed_methods=["GET", "HEAD", "OPTIONS"],
            cached_methods=["GET", "HEAD"],
            compress=True,
            cache_policy_id=caching_optimized.id,
            function_associations=[
                aws.cloudfront.DistributionDefaultCacheBehaviorFunctionAssociationArgs(
                    event_type="viewer-request",
                    function_arn=spa_rewrite.arn,
                )
            ],
        ),
        ordered_cache_behaviors=ordered_cache_behaviors,
        restrictions=aws.cloudfront.DistributionRestrictionsArgs(
            geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                restriction_type="none"
            )
        ),
        viewer_certificate=viewer_certificate,
        tags=tags,
        opts=protected_options,
    )

    bucket_policy = aws.iam.get_policy_document_output(
        statements=[
            aws.iam.GetPolicyDocumentStatementArgs(
                actions=["s3:GetObject"],
                effect="Allow",
                resources=[bucket.arn.apply(lambda arn: f"{arn}/*")],
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
                        values=[distribution.arn],
                    )
                ],
            )
        ],
        opts=pulumi.InvokeOptions(provider=provider),
    )
    aws.s3.BucketPolicy(
        f"{name_prefix}-frontend-policy",
        bucket=bucket.id,
        policy=bucket_policy.json,
        opts=pulumi.ResourceOptions(provider=provider),
    )

    if domain_name is not None and hosted_zone_id is not None:
        alias = aws.route53.RecordAliasArgs(
            name=distribution.domain_name,
            zone_id=distribution.hosted_zone_id,
            evaluate_target_health=False,
        )
        aws.route53.Record(
            f"{name_prefix}-frontend-a",
            zone_id=hosted_zone_id,
            name=domain_name,
            type="A",
            aliases=[alias],
            opts=pulumi.ResourceOptions(provider=provider),
        )
        aws.route53.Record(
            f"{name_prefix}-frontend-aaaa",
            zone_id=hosted_zone_id,
            name=domain_name,
            type="AAAA",
            aliases=[alias],
            opts=pulumi.ResourceOptions(provider=provider),
        )

    return FrontendOutputs(
        bucket_name=bucket.bucket,
        bucket_arn=bucket.arn,
        distribution_id=distribution.id,
        distribution_arn=distribution.arn,
        distribution_domain_name=distribution.domain_name,
    )

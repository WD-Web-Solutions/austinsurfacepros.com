from pathlib import Path

import pulumi
import pulumi_aws as aws

from infrastructure.account_guard import (
    assert_aws_account,
    validate_certificate_coverage,
    validate_hosted_zone,
)
from infrastructure.api import create_api
from infrastructure.budget import create_monthly_demo_budget
from infrastructure.config import InfrastructureConfig
from infrastructure.deployment import (
    create_github_deployment_identity,
    immutable_github_environment_subject,
)
from infrastructure.dns_guard import reject_hosted_zone_resources
from infrastructure.email import create_ses_domain_identity
from infrastructure.frontend import create_frontend
from infrastructure.gallery_storage import (
    allow_cloudfront_gallery_reads,
    create_gallery_storage,
)

pulumi.runtime.register_stack_transformation(reject_hosted_zone_resources)

config = InfrastructureConfig.load()
project_config = pulumi.Config()

provider = aws.Provider(
    f"{config.name_prefix}-aws-provider",
    region=config.aws_region,
    profile=config.aws_profile,
    default_tags=aws.ProviderDefaultTagsArgs(tags=config.tags),
)
assert_aws_account(config.expected_account_id, provider)

invoke_options = pulumi.InvokeOptions(provider=provider)
hosted_zone = aws.route53.get_zone(
    name=config.root_domain,
    private_zone=False,
    opts=invoke_options,
)
try:
    validate_hosted_zone(config.domain_name, hosted_zone.name)
except ValueError as error:
    raise pulumi.RunError(str(error)) from error

certificate_lookup = aws.acm.get_certificate(
    domain=config.certificate_domain,
    statuses=["ISSUED"],
    most_recent=True,
    opts=invoke_options,
)
if ":us-east-1:" not in certificate_lookup.arn:
    raise pulumi.RunError("CloudFront certificate must be in us-east-1")
certificate = aws.acm.Certificate.get(
    f"{config.name_prefix}-existing-certificate",
    certificate_lookup.arn,
    opts=pulumi.ResourceOptions(provider=provider),
)


def validate_certificate_and_return_arn(values: list[object]) -> str:
    arn, domain_name, subject_alternative_names = values
    try:
        validate_certificate_coverage(
            config.domain_name,
            str(domain_name),
            [str(name) for name in subject_alternative_names],  # type: ignore[union-attr]
        )
    except ValueError as error:
        raise pulumi.RunError(str(error)) from error
    return str(arn)


validated_certificate_arn = pulumi.Output.all(
    certificate.arn,
    certificate.domain_name,
    certificate.subject_alternative_names,
).apply(validate_certificate_and_return_arn)

if not config.lambda_archive_path.is_file():
    raise pulumi.RunError(
        f"Lambda archive not found at {config.lambda_archive_path}. "
        "Run the backend packaging script before previewing."
    )

database_url = project_config.require_secret("databaseUrl") if config.enable_database else None
gallery_storage = (
    create_gallery_storage(
        name_prefix=config.name_prefix,
        bucket_name=config.gallery_bucket_name,
        site_origin=f"https://{config.domain_name}",
        protect_resources=config.protect_resources,
        tags=config.tags,
        provider=provider,
    )
    if config.enable_gallery_storage
    else None
)
ses_identity_arn: pulumi.Input[str] | None = None
if config.enable_ses:
    if config.ses_domain_name is None:
        raise pulumi.RunError("sesDomainName is required when enableSes is true")
    validate_hosted_zone(config.ses_domain_name, hosted_zone.name)
    ses = create_ses_domain_identity(
        name_prefix=config.name_prefix,
        domain_name=config.ses_domain_name,
        hosted_zone_id=hosted_zone.zone_id,
        provider=provider,
    )
    ses_identity_arn = ses.identity_arn

api = create_api(
    name_prefix=config.name_prefix,
    lambda_archive_path=Path(config.lambda_archive_path),
    log_retention_days=config.log_retention_days,
    database_url=database_url,
    enable_database=config.enable_database,
    enable_ses=config.enable_ses,
    ses_region=config.aws_region,
    ses_source_email=config.ses_source_email,
    ses_recipient_emails=config.ses_recipient_emails,
    ses_identity_arn=ses_identity_arn,
    gallery_bucket_name=(gallery_storage.bucket_name if gallery_storage else None),
    gallery_bucket_arn=(gallery_storage.bucket_arn if gallery_storage else None),
    enable_gallery_storage=config.enable_gallery_storage,
    tags=config.tags,
    provider=provider,
)
frontend = create_frontend(
    name_prefix=config.name_prefix,
    bucket_name=config.frontend_bucket_name,
    api=api,
    gallery_bucket_domain_name=(
        gallery_storage.bucket_regional_domain_name if gallery_storage else None
    ),
    domain_name=config.domain_name,
    hosted_zone_id=hosted_zone.zone_id,
    certificate_arn=validated_certificate_arn,
    protect_resources=config.protect_resources,
    tags=config.tags,
    provider=provider,
)
if gallery_storage is not None:
    allow_cloudfront_gallery_reads(
        name_prefix=config.name_prefix,
        storage=gallery_storage,
        distribution_arn=frontend.distribution_arn,
        provider=provider,
    )

foundation = pulumi.StackReference(config.github_oidc_stack_reference)
github_subject = immutable_github_environment_subject(
    repository=config.github_repository,
    owner_id=config.github_owner_id,
    repository_id=config.github_repository_id,
    environment=config.github_environment,
)
deployment_identity = create_github_deployment_identity(
    name_prefix=config.name_prefix,
    account_id=config.expected_account_id,
    oidc_provider_arn=foundation.require_output("githubOidcProviderArn"),
    github_subject=github_subject,
    frontend_bucket_arn=frontend.bucket_arn,
    cloudfront_distribution_arn=frontend.distribution_arn,
    lambda_function_arn=api.function_arn,
    tags=config.tags,
    provider=provider,
)

if config.create_budget:
    budget = create_monthly_demo_budget(
        name_prefix=config.name_prefix,
        account_id=config.expected_account_id,
        amount=config.budget_amount,
        email_address=config.budget_email,
        billing_scope=config.billing_scope,
        tags=config.tags,
        provider=provider,
    )
    pulumi.export("budgetName", budget.name)

pulumi.export("apiEndpoint", api.endpoint)
pulumi.export("lambdaFunctionName", api.function_name)
pulumi.export("frontendBucketName", frontend.bucket_name)
pulumi.export("cloudFrontDistributionId", frontend.distribution_id)
pulumi.export("cloudFrontDomainName", frontend.distribution_domain_name)
pulumi.export("demoUrl", f"https://{config.domain_name}")
pulumi.export("githubDeployRoleArn", deployment_identity.role_arn)
pulumi.export("githubOidcSubject", github_subject)
pulumi.export("databaseProvider", config.database_provider)
pulumi.export("databaseEnabled", config.enable_database)
pulumi.export("sesEnabled", config.enable_ses)
pulumi.export("galleryStorageEnabled", config.enable_gallery_storage)
if gallery_storage is not None:
    pulumi.export("galleryBucketName", gallery_storage.bucket_name)

import pulumi
import pulumi_aws as aws

EXPECTED_ACCOUNT_ID = "767688909304"

config = pulumi.Config()
aws_config = pulumi.Config("aws")
expected_account_id = config.get("expectedAccountId") or EXPECTED_ACCOUNT_ID
verification_domain = config.get("verificationDomain") or "wdwebsolutions.com"
activate_cost_allocation_tags = config.get_bool("activateCostAllocationTags") or False

tags = {
    "client_name": "shared",
    "env": "shared",
    "demo": "true",
    "managed_by": "pulumi",
    "repository": "WD-Web-Solutions/austinsurfacepros.com",
}
provider = aws.Provider(
    "wdwebsolutions-foundation-provider",
    region=aws_config.get("region") or "us-east-1",
    profile=aws_config.get("profile") or "default",
    default_tags=aws.ProviderDefaultTagsArgs(tags=tags),
)
identity = aws.get_caller_identity(opts=pulumi.InvokeOptions(provider=provider))
if identity.account_id != expected_account_id:
    raise pulumi.RunError(
        f"AWS account mismatch: expected {expected_account_id}, got {identity.account_id}"
    )

verification_zone = aws.route53.get_zone(
    name=verification_domain,
    private_zone=False,
    opts=pulumi.InvokeOptions(provider=provider),
)
if verification_zone.name.rstrip(".") != verification_domain.rstrip("."):
    raise pulumi.RunError(
        f"Expected Route 53 zone {verification_domain}, got {verification_zone.name}"
    )

github_oidc = aws.iam.OpenIdConnectProvider(
    "github-actions-oidc",
    url="https://token.actions.githubusercontent.com",
    client_id_lists=["sts.amazonaws.com"],
    tags=tags,
    opts=pulumi.ResourceOptions(provider=provider),
)

if activate_cost_allocation_tags:
    billing_scope_tag = aws.costexplorer.CostAllocationTag(
        "billing-scope-cost-allocation-tag",
        tag_key="billing_scope",
        status="Active",
        opts=pulumi.ResourceOptions(provider=provider),
    )
    pulumi.export("billingScopeCostAllocationTagStatus", billing_scope_tag.status)
else:
    pulumi.export("billingScopeCostAllocationTagStatus", "not-requested")

pulumi.export("githubOidcProviderArn", github_oidc.arn)
pulumi.export("verifiedHostedZoneId", verification_zone.zone_id)

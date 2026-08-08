from dataclasses import dataclass

import pulumi
import pulumi_aws as aws


@dataclass(frozen=True)
class DeploymentIdentityOutputs:
    role_arn: pulumi.Output[str]


def immutable_github_environment_subject(
    repository: str,
    owner_id: str,
    repository_id: str,
    environment: str,
) -> str:
    try:
        owner, repository_name = repository.split("/", maxsplit=1)
    except ValueError as error:
        raise ValueError("GitHub repository must use owner/name format") from error
    return f"repo:{owner}@{owner_id}/{repository_name}@{repository_id}:environment:{environment}"


def create_github_deployment_identity(
    name_prefix: str,
    account_id: str,
    oidc_provider_arn: pulumi.Input[str],
    github_subject: str,
    frontend_bucket_arn: pulumi.Input[str],
    cloudfront_distribution_arn: pulumi.Input[str],
    lambda_function_arn: pulumi.Input[str],
    tags: dict[str, str],
    provider: aws.Provider,
) -> DeploymentIdentityOutputs:
    assume_role_policy = aws.iam.get_policy_document_output(
        statements=[
            aws.iam.GetPolicyDocumentStatementArgs(
                sid="GitHubActionsDemoEnvironment",
                effect="Allow",
                actions=["sts:AssumeRoleWithWebIdentity"],
                principals=[
                    aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                        type="Federated",
                        identifiers=[oidc_provider_arn],
                    )
                ],
                conditions=[
                    aws.iam.GetPolicyDocumentStatementConditionArgs(
                        test="StringEquals",
                        variable="token.actions.githubusercontent.com:aud",
                        values=["sts.amazonaws.com"],
                    ),
                    aws.iam.GetPolicyDocumentStatementConditionArgs(
                        test="StringEquals",
                        variable="token.actions.githubusercontent.com:sub",
                        values=[github_subject],
                    ),
                ],
            )
        ],
        opts=pulumi.InvokeOptions(provider=provider),
    )
    role = aws.iam.Role(
        f"{name_prefix}-github-deploy-role",
        name=f"{name_prefix}-github-deploy",
        assume_role_policy=assume_role_policy.json,
        max_session_duration=3600,
        tags=tags,
        opts=pulumi.ResourceOptions(provider=provider),
    )

    deploy_policy = aws.iam.get_policy_document_output(
        statements=[
            aws.iam.GetPolicyDocumentStatementArgs(
                sid="ListFrontendBucket",
                effect="Allow",
                actions=["s3:GetBucketLocation", "s3:ListBucket"],
                resources=[frontend_bucket_arn],
            ),
            aws.iam.GetPolicyDocumentStatementArgs(
                sid="DeployFrontendObjects",
                effect="Allow",
                actions=["s3:DeleteObject", "s3:PutObject"],
                resources=[pulumi.Output.concat(frontend_bucket_arn, "/*")],
            ),
            aws.iam.GetPolicyDocumentStatementArgs(
                sid="InvalidateDemoCloudFront",
                effect="Allow",
                actions=["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
                resources=[cloudfront_distribution_arn],
            ),
            aws.iam.GetPolicyDocumentStatementArgs(
                sid="DeployDemoLambda",
                effect="Allow",
                actions=["lambda:GetFunctionConfiguration", "lambda:UpdateFunctionCode"],
                resources=[lambda_function_arn],
            ),
        ],
        opts=pulumi.InvokeOptions(provider=provider),
    )
    aws.iam.RolePolicy(
        f"{name_prefix}-github-deploy-policy",
        name=f"{name_prefix}-github-deploy",
        role=role.id,
        policy=deploy_policy.json,
        opts=pulumi.ResourceOptions(provider=provider),
    )

    return DeploymentIdentityOutputs(role_arn=role.arn)

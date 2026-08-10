import json
from dataclasses import dataclass
from pathlib import Path

import pulumi
import pulumi_aws as aws


@dataclass(frozen=True)
class ApiOutputs:
    endpoint: pulumi.Output[str]
    origin_domain_name: pulumi.Output[str]
    function_name: pulumi.Output[str]
    function_arn: pulumi.Output[str]


def create_api(
    name_prefix: str,
    lambda_archive_path: Path,
    log_retention_days: int,
    database_url: pulumi.Output[str] | None,
    enable_database: bool,
    enable_ses: bool,
    ses_region: str,
    ses_source_email: str | None,
    ses_recipient_emails: tuple[str, ...],
    ses_identity_arn: pulumi.Input[str] | None,
    gallery_bucket_name: pulumi.Input[str] | None,
    gallery_bucket_arn: pulumi.Input[str] | None,
    enable_gallery_storage: bool,
    tags: dict[str, str],
    provider: aws.Provider,
) -> ApiOutputs:
    role = aws.iam.Role(
        f"{name_prefix}-lambda-role",
        assume_role_policy=aws.iam.get_policy_document_output(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    actions=["sts:AssumeRole"],
                    effect="Allow",
                    principals=[
                        aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                            type="Service",
                            identifiers=["lambda.amazonaws.com"],
                        )
                    ],
                )
            ],
            opts=pulumi.InvokeOptions(provider=provider),
        ).json,
        tags=tags,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.iam.RolePolicyAttachment(
        f"{name_prefix}-lambda-basic-execution",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=pulumi.ResourceOptions(provider=provider),
    )
    if ses_identity_arn is not None:
        send_email_policy = aws.iam.get_policy_document_output(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    sid="SendContactRequestEmail",
                    effect="Allow",
                    actions=["ses:SendEmail"],
                    resources=[ses_identity_arn],
                )
            ],
            opts=pulumi.InvokeOptions(provider=provider),
        )
        aws.iam.RolePolicy(
            f"{name_prefix}-lambda-ses-policy",
            role=role.id,
            policy=send_email_policy.json,
            opts=pulumi.ResourceOptions(provider=provider),
        )
    if gallery_bucket_arn is not None:
        gallery_policy = aws.iam.get_policy_document_output(
            statements=[
                aws.iam.GetPolicyDocumentStatementArgs(
                    sid="StageAndProcessGalleryPhotos",
                    effect="Allow",
                    actions=["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                    resources=[
                        pulumi.Output.concat(gallery_bucket_arn, "/gallery-media/staging/*"),
                        pulumi.Output.concat(gallery_bucket_arn, "/gallery-media/processed/*"),
                    ],
                )
            ],
            opts=pulumi.InvokeOptions(provider=provider),
        )
        aws.iam.RolePolicy(
            f"{name_prefix}-lambda-gallery-policy",
            role=role.id,
            policy=gallery_policy.json,
            opts=pulumi.ResourceOptions(provider=provider),
        )

    function_name = f"{name_prefix}-api"
    log_group = aws.cloudwatch.LogGroup(
        f"{name_prefix}-lambda-logs",
        name=f"/aws/lambda/{function_name}",
        retention_in_days=log_retention_days,
        tags=tags,
        opts=pulumi.ResourceOptions(provider=provider),
    )

    environment_variables: dict[str, pulumi.Input[str]] = {
        "ASP_ENVIRONMENT": "demo",
        "ASP_LOG_LEVEL": "INFO",
        "ASP_CORS_ORIGINS": "[]",
        "ASP_ENABLE_DATABASE": str(enable_database).lower(),
        "ASP_ENABLE_SES": str(enable_ses).lower(),
        "ASP_SES_REGION": ses_region,
        "ASP_SES_RECIPIENT_EMAILS": json.dumps(ses_recipient_emails),
        "ASP_ENABLE_GALLERY_STORAGE": str(enable_gallery_storage).lower(),
        "ASP_GALLERY_REGION": ses_region,
        "ASP_GALLERY_PUBLIC_BASE_URL": "",
        "ASP_GALLERY_UPLOAD_EXPIRES_SECONDS": "300",
    }
    if database_url is not None:
        environment_variables["ASP_DATABASE_URL"] = database_url
    if ses_source_email is not None:
        environment_variables["ASP_SES_SOURCE_EMAIL"] = ses_source_email
    if gallery_bucket_name is not None:
        environment_variables["ASP_GALLERY_BUCKET_NAME"] = gallery_bucket_name

    function = aws.lambda_.Function(
        f"{name_prefix}-api",
        name=function_name,
        runtime="python3.14",
        architectures=["arm64"],
        handler="austin_surface_pros_api.lambda_handler.handler",
        role=role.arn,
        code=pulumi.FileArchive(str(lambda_archive_path)),
        memory_size=512,
        timeout=30,
        environment=aws.lambda_.FunctionEnvironmentArgs(variables=environment_variables),
        tags=tags,
        opts=pulumi.ResourceOptions(provider=provider, depends_on=[log_group]),
    )

    api = aws.apigatewayv2.Api(
        f"{name_prefix}-http-api",
        name=f"{name_prefix}-http-api",
        protocol_type="HTTP",
        tags=tags,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    integration = aws.apigatewayv2.Integration(
        f"{name_prefix}-lambda-integration",
        api_id=api.id,
        integration_type="AWS_PROXY",
        integration_uri=function.arn,
        integration_method="POST",
        payload_format_version="2.0",
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.apigatewayv2.Route(
        f"{name_prefix}-default-route",
        api_id=api.id,
        route_key="$default",
        target=integration.id.apply(lambda integration_id: f"integrations/{integration_id}"),
        opts=pulumi.ResourceOptions(provider=provider),
    )

    access_log_group = aws.cloudwatch.LogGroup(
        f"{name_prefix}-api-access-logs",
        retention_in_days=log_retention_days,
        tags=tags,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.apigatewayv2.Stage(
        f"{name_prefix}-default-stage",
        api_id=api.id,
        name="$default",
        auto_deploy=True,
        access_log_settings=aws.apigatewayv2.StageAccessLogSettingsArgs(
            destination_arn=access_log_group.arn,
            format=json.dumps(
                {
                    "requestId": "$context.requestId",
                    "routeKey": "$context.routeKey",
                    "status": "$context.status",
                    "responseLatency": "$context.responseLatency",
                }
            ),
        ),
        tags=tags,
        opts=pulumi.ResourceOptions(provider=provider),
    )
    aws.lambda_.Permission(
        f"{name_prefix}-api-gateway-permission",
        action="lambda:InvokeFunction",
        function=function.name,
        principal="apigateway.amazonaws.com",
        source_arn=api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
        opts=pulumi.ResourceOptions(provider=provider),
    )

    return ApiOutputs(
        endpoint=api.api_endpoint,
        origin_domain_name=api.api_endpoint.apply(
            lambda endpoint: endpoint.removeprefix("https://")
        ),
        function_name=function.name,
        function_arn=function.arn,
    )

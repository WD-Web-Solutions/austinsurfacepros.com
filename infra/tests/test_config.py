from pathlib import Path

import pulumi
import pytest

from infrastructure.config import InfrastructureConfig


def make_config(**overrides: object) -> InfrastructureConfig:
    values: dict[str, object] = {
        "environment": "demo",
        "client_name": "austinsurfacepros",
        "expected_account_id": "767688909304",
        "aws_region": "us-east-1",
        "aws_profile": "default",
        "root_domain": "wdwebsolutions.com",
        "domain_name": "austinsurfaceprosdemo.wdwebsolutions.com",
        "certificate_domain": "wdwebsolutions.com",
        "lambda_archive_path": Path("../backend/dist/lambda.zip"),
        "frontend_bucket_name": "asp-demo-frontend-767688909304",
        "database_provider": "deferred",
        "enable_database": False,
        "enable_ses": False,
        "ses_domain_name": None,
        "ses_source_email": None,
        "ses_recipient_emails": (),
        "github_repository": "WD-Web-Solutions/austinsurfacepros.com",
        "github_owner_id": "78939019",
        "github_repository_id": "1322502457",
        "github_environment": "demo",
        "github_oidc_stack_reference": ("derek-dreibrodt/wdwebsolutions-aws-foundation/shared"),
        "protect_resources": False,
        "log_retention_days": 7,
        "budget_amount": "5",
        "budget_email": "derekd@wdwebsolutions.com",
        "create_budget": False,
    }
    values.update(overrides)
    return InfrastructureConfig(**values)  # type: ignore[arg-type]


def test_accepts_demo_configuration() -> None:
    config = make_config()

    config.validate()

    assert config.name_prefix == "asp-demo"
    assert config.billing_scope == "austinsurfacepros-demo"
    assert config.tags["client_name"] == "austinsurfacepros"
    assert config.tags["env"] == "demo"
    assert config.tags["demo"] == "true"


def test_rejects_non_demo_stack() -> None:
    with pytest.raises(pulumi.RunError, match="only the demo stack"):
        make_config(environment="production").validate()


def test_rejects_domain_outside_root_zone() -> None:
    with pytest.raises(pulumi.RunError, match="must be a subdomain"):
        make_config(domain_name="example.com").validate()


def test_database_provider_is_required_when_database_is_enabled() -> None:
    with pytest.raises(pulumi.RunError, match="databaseProvider"):
        make_config(enable_database=True).validate()


def test_ses_settings_are_required_when_ses_is_enabled() -> None:
    with pytest.raises(pulumi.RunError, match="sesDomainName"):
        make_config(enable_ses=True).validate()


def test_bucket_name_is_scoped_to_expected_account() -> None:
    with pytest.raises(pulumi.RunError, match="expectedAccountId"):
        make_config(frontend_bucket_name="unsafe-global-bucket-name").validate()

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import pulumi

DatabaseProvider = Literal["deferred", "aurora-serverless-v2", "external-postgres"]


@dataclass(frozen=True)
class InfrastructureConfig:
    environment: str
    client_name: str
    expected_account_id: str
    aws_region: str
    aws_profile: str
    root_domain: str
    domain_name: str
    certificate_domain: str
    lambda_archive_path: Path
    frontend_bucket_name: str
    database_provider: DatabaseProvider
    enable_database: bool
    enable_ses: bool
    ses_domain_name: str | None
    ses_source_email: str | None
    ses_recipient_emails: tuple[str, ...]
    github_repository: str
    github_owner_id: str
    github_repository_id: str
    github_environment: str
    github_oidc_stack_reference: str
    protect_resources: bool
    log_retention_days: int
    budget_amount: str
    budget_email: str
    create_budget: bool

    @property
    def name_prefix(self) -> str:
        return f"asp-{self.environment}"

    @property
    def billing_scope(self) -> str:
        return f"{self.client_name}-{self.environment}"

    @property
    def tags(self) -> dict[str, str]:
        return {
            "client_name": self.client_name,
            "env": self.environment,
            "demo": "true" if self.environment == "demo" else "false",
            "billing_scope": self.billing_scope,
            "managed_by": "pulumi",
            "repository": self.github_repository,
        }

    @classmethod
    def load(cls) -> InfrastructureConfig:
        config = pulumi.Config()
        aws_config = pulumi.Config("aws")
        infra_directory = Path(__file__).resolve().parents[1]
        archive_setting = config.get("lambdaArchivePath") or "../backend/dist/lambda.zip"
        archive_path = Path(archive_setting)
        if not archive_path.is_absolute():
            archive_path = (infra_directory / archive_path).resolve()

        environment = config.get("environment") or pulumi.get_stack()
        expected_account_id = config.require("expectedAccountId")
        client_name = config.get("clientName") or "austinsurfacepros"
        database_provider = config.get("databaseProvider") or "deferred"
        if database_provider not in {
            "deferred",
            "aurora-serverless-v2",
            "external-postgres",
        }:
            raise pulumi.RunError(f"Unsupported databaseProvider: {database_provider}")

        protect_resources = config.get_bool("protectResources")
        enable_database = config.get_bool("enableDatabase") or False
        enable_ses = config.get_bool("enableSes") or False

        instance = cls(
            environment=environment,
            client_name=client_name,
            expected_account_id=expected_account_id,
            aws_region=aws_config.get("region") or "us-east-1",
            aws_profile=aws_config.get("profile") or "default",
            root_domain=config.require("rootDomain"),
            domain_name=config.require("domainName"),
            certificate_domain=config.get("certificateDomain") or config.require("rootDomain"),
            lambda_archive_path=archive_path,
            frontend_bucket_name=config.get("frontendBucketName")
            or f"asp-{environment}-frontend-{expected_account_id}",
            database_provider=database_provider,  # type: ignore[arg-type]
            enable_database=enable_database,
            enable_ses=enable_ses,
            ses_domain_name=config.get("sesDomainName"),
            ses_source_email=config.get("sesSourceEmail"),
            ses_recipient_emails=tuple(config.get_object("sesRecipientEmails") or []),
            github_repository=config.get("githubRepository")
            or "WD-Web-Solutions/austinsurfacepros.com",
            github_owner_id=config.get("githubOwnerId") or "78939019",
            github_repository_id=config.get("githubRepositoryId") or "1322502457",
            github_environment=config.get("githubEnvironment") or environment,
            github_oidc_stack_reference=config.get("githubOidcStackReference")
            or "derek-dreibrodt/wdwebsolutions-aws-foundation/shared",
            protect_resources=True if protect_resources is None else protect_resources,
            log_retention_days=config.get_int("logRetentionDays") or 7,
            budget_amount=config.get("budgetAmount") or "5",
            budget_email=config.get("budgetEmail") or "derekd@wdwebsolutions.com",
            create_budget=config.get_bool("createBudget") or False,
        )
        instance.validate()
        return instance

    def validate(self) -> None:
        if self.environment != "demo":
            raise pulumi.RunError("This deployment project currently permits only the demo stack")
        if self.aws_region != "us-east-1":
            raise pulumi.RunError("The demo stack must use us-east-1")
        if not self.domain_name.endswith(f".{self.root_domain}"):
            raise pulumi.RunError(
                f"domainName {self.domain_name} must be a subdomain of {self.root_domain}"
            )
        if self.enable_database and self.database_provider == "deferred":
            raise pulumi.RunError("databaseProvider must be selected when enableDatabase is true")
        if self.enable_ses and (
            self.ses_domain_name is None
            or self.ses_source_email is None
            or not self.ses_recipient_emails
        ):
            raise pulumi.RunError(
                "sesDomainName, sesSourceEmail, and sesRecipientEmails are required "
                "when enableSes is true"
            )
        if not self.frontend_bucket_name.endswith(self.expected_account_id):
            raise pulumi.RunError(
                "frontendBucketName must end with expectedAccountId to prevent cross-account reuse"
            )
        try:
            float(self.budget_amount)
        except ValueError as error:
            raise pulumi.RunError("budgetAmount must be numeric") from error

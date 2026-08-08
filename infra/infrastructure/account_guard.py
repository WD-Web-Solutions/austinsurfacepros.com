from collections.abc import Sequence

import pulumi
import pulumi_aws as aws


def validate_account(actual_account_id: str, expected_account_id: str) -> None:
    if actual_account_id != expected_account_id:
        raise ValueError(
            f"AWS account mismatch: expected {expected_account_id}, got {actual_account_id}"
        )


def validate_hosted_zone(domain_name: str, hosted_zone_name: str) -> None:
    normalized_domain = domain_name.rstrip(".")
    normalized_zone = hosted_zone_name.rstrip(".")
    if normalized_domain != normalized_zone and not normalized_domain.endswith(
        f".{normalized_zone}"
    ):
        raise ValueError(
            f"Domain {domain_name} is not contained by Route 53 zone {hosted_zone_name}"
        )


def certificate_name_covers_domain(certificate_name: str, domain_name: str) -> bool:
    normalized_certificate = certificate_name.rstrip(".").lower()
    normalized_domain = domain_name.rstrip(".").lower()
    if normalized_certificate == normalized_domain:
        return True
    if not normalized_certificate.startswith("*."):
        return False
    certificate_suffix = normalized_certificate[2:]
    if not normalized_domain.endswith(f".{certificate_suffix}"):
        return False
    prefix = normalized_domain[: -(len(certificate_suffix) + 1)]
    return "." not in prefix


def validate_certificate_coverage(
    domain_name: str,
    certificate_domain: str,
    subject_alternative_names: Sequence[str],
) -> None:
    names = (certificate_domain, *subject_alternative_names)
    if not any(certificate_name_covers_domain(name, domain_name) for name in names):
        raise ValueError(f"Certificate {certificate_domain} does not cover {domain_name}")


def assert_aws_account(
    expected_account_id: str,
    provider: aws.Provider,
) -> None:
    identity = aws.get_caller_identity(opts=pulumi.InvokeOptions(provider=provider))
    try:
        validate_account(identity.account_id, expected_account_id)
    except ValueError as error:
        raise pulumi.RunError(str(error)) from error

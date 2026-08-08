import pytest

from infrastructure.account_guard import (
    certificate_name_covers_domain,
    validate_account,
    validate_certificate_coverage,
    validate_hosted_zone,
)


def test_accepts_expected_aws_account() -> None:
    validate_account("123456789012", "123456789012")


def test_rejects_unexpected_aws_account() -> None:
    with pytest.raises(ValueError, match="AWS account mismatch"):
        validate_account("999999999999", "123456789012")


@pytest.mark.parametrize(
    ("domain_name", "zone_name"),
    [
        ("austinsurfacepros.com", "austinsurfacepros.com."),
        ("www.austinsurfacepros.com", "austinsurfacepros.com."),
    ],
)
def test_accepts_domain_in_hosted_zone(domain_name: str, zone_name: str) -> None:
    validate_hosted_zone(domain_name, zone_name)


def test_rejects_domain_outside_hosted_zone() -> None:
    with pytest.raises(ValueError, match="is not contained"):
        validate_hosted_zone("austinsurfacepros.com", "example.com.")


@pytest.mark.parametrize(
    ("certificate_name", "domain_name"),
    [
        ("austinsurfaceprosdemo.wdwebsolutions.com", "austinsurfaceprosdemo.wdwebsolutions.com"),
        ("*.wdwebsolutions.com", "austinsurfaceprosdemo.wdwebsolutions.com"),
    ],
)
def test_certificate_name_covers_demo_domain(
    certificate_name: str,
    domain_name: str,
) -> None:
    assert certificate_name_covers_domain(certificate_name, domain_name)


def test_wildcard_certificate_does_not_cover_nested_subdomain() -> None:
    assert not certificate_name_covers_domain(
        "*.wdwebsolutions.com",
        "nested.austinsurfaceprosdemo.wdwebsolutions.com",
    )


def test_rejects_certificate_without_matching_name() -> None:
    with pytest.raises(ValueError, match="does not cover"):
        validate_certificate_coverage(
            "austinsurfaceprosdemo.wdwebsolutions.com",
            "wdwebsolutions.com",
            ["www.wdwebsolutions.com"],
        )

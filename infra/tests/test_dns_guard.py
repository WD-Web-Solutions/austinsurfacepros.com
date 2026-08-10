from types import SimpleNamespace

import pulumi
import pytest

from infrastructure.dns_guard import reject_hosted_zone_resources


def test_rejects_managed_route53_hosted_zone() -> None:
    args = SimpleNamespace(type_="aws:route53/zone:Zone")

    with pytest.raises(pulumi.RunError, match="may never manage a hosted zone"):
        reject_hosted_zone_resources(args)  # type: ignore[arg-type]


def test_allows_route53_record() -> None:
    args = SimpleNamespace(type_="aws:route53/record:Record")

    assert reject_hosted_zone_resources(args) is None  # type: ignore[arg-type]

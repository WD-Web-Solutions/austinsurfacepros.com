import pytest

from infrastructure.deployment import immutable_github_environment_subject


def test_builds_immutable_github_environment_subject() -> None:
    subject = immutable_github_environment_subject(
        repository="WD-Web-Solutions/austinsurfacepros.com",
        owner_id="78939019",
        repository_id="1322502457",
        environment="demo",
    )

    assert subject == (
        "repo:WD-Web-Solutions@78939019/austinsurfacepros.com@1322502457:environment:demo"
    )


def test_rejects_repository_without_owner() -> None:
    with pytest.raises(ValueError, match="owner/name"):
        immutable_github_environment_subject(
            repository="austinsurfacepros.com",
            owner_id="78939019",
            repository_id="1322502457",
            environment="demo",
        )

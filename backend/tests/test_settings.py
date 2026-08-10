import pytest
from pydantic import ValidationError

from austin_surface_pros_api.core.config import Settings


def test_database_configuration_is_required_only_when_enabled() -> None:
    Settings(enable_database=False, database_url=None)

    with pytest.raises(ValidationError, match="database_url is required"):
        Settings(enable_database=True, database_url=None)


def test_ses_configuration_is_required_only_when_enabled() -> None:
    Settings(enable_ses=False)

    with pytest.raises(ValidationError, match="ses_source_email"):
        Settings(enable_ses=True, ses_source_email=None, ses_recipient_emails=[])

from io import StringIO
from django.core.management import call_command
from django.core.management.base import CommandError
from unittest.mock import MagicMock, patch
import pytest

from .test_api import OUR_FIELDS
from .test_settings import configure_airtable_settings
from .fake_airtable import FakeAirtable
from users.tests.factories import UserFactory
from ..record import Fields
from ..sync import logger, AirtableSynchronizer, sync_user


def test_multiple_rows_with_same_pk_are_logged():
    airtable = FakeAirtable()
    syncer = AirtableSynchronizer(airtable)
    for i in range(2):
        airtable.create(Fields(**OUR_FIELDS))
    with patch.object(logger, "warning") as m:
        syncer._get_record_dict()
    m.assert_called_once_with("Multiple rows with pk 1 exist in Airtable!")


@pytest.mark.django_db
def test_airtable_synchronizer_works():
    user = UserFactory.create(
        full_legal_name="Boop Jones", phone_number="5551234567", username="boop"
    )

    airtable = FakeAirtable()
    syncer = AirtableSynchronizer(airtable)

    def resync():
        io = StringIO()
        syncer.sync_users(stdout=io)
        return io.getvalue()

    assert "boop does not exist in Airtable, adding them.\n" in resync()
    assert airtable.get(user.pk).fields_.last_name == "Jones"
    assert "boop is already synced.\n" in resync()

    user.last_name = "Denver"
    user.save()
    assert "Updating boop.\n" in resync()
    assert airtable.get(user.pk).fields_.last_name == "Denver"


class TestSyncUser:
    def test_is_noop_if_airtable_is_disabled(self):
        sync_user(None)

    @pytest.mark.django_db
    def test_exceptions_are_caught_and_logged(self, settings):
        configure_airtable_settings(settings)
        user = UserFactory()
        with patch("airtable.sync.Airtable") as constructor_mock:
            airtable_mock = MagicMock()
            airtable_mock.create_or_update.side_effect = Exception("kabooom")
            constructor_mock.return_value = airtable_mock
            with patch.object(logger, "exception") as m:
                sync_user(user)
        m.assert_called_once_with("Error while communicating with Airtable")

    @pytest.mark.django_db
    def test_it_works(self, settings):
        configure_airtable_settings(settings)
        user = UserFactory()
        with patch("airtable.sync.Airtable"):
            with patch.object(logger, "exception") as m:
                sync_user(user)
        m.assert_not_called()


class TestSyncAirtableCommand:
    def test_it_raises_error_when_settings_are_not_defined(self):
        with pytest.raises(CommandError, match="AIRTABLE_URL must be configured"):
            call_command("syncairtable")

    @pytest.mark.django_db
    def test_it_works(self, settings):
        configure_airtable_settings(settings)

        UserFactory.create()
        io = StringIO()
        with patch("airtable.management.commands.syncairtable.Airtable") as m:
            m.return_value = FakeAirtable()
            call_command("syncairtable", stdout=io)
        assert io.getvalue().split("\n") == [
            "Retrieving current Airtable...",
            "Synchronizing users...",
            "boop does not exist in Airtable, adding them.",
            "Finished synchronizing with Airtable!",
            "",
        ]

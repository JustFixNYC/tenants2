from datetime import datetime
from io import StringIO
from unittest.mock import MagicMock
from django.core.management import call_command, CommandError
from django.utils.timezone import make_aware
from temba_client.v2.types import Contact, Group
import pytest
import freezegun

from users.tests.factories import UserFactory
from rapidpro.management.commands import syncrapidpro
from rapidpro.models import Metadata, ContactGroup, UserContactGroup, Contact as ContactModel

SYNCING_USER_SENTINEL = "Syncing user"


def call(*args):
    out = StringIO()
    call_command("syncrapidpro", *args, stdout=out)
    return out.getvalue()


def make_group(uuid="funky", name="Funky Group"):
    return Group.create(uuid=uuid, name=name)


def make_phone_number_urn(phone_number: str) -> str:
    return f"tel:+1{phone_number}"


def make_contact(phone_number="5551234567", groups=None, uuid="blarg"):
    if groups is None:
        groups = []
    return Contact.create(
        uuid=uuid,
        urns=[make_phone_number_urn(phone_number)],
        groups=groups,
        modified_on=make_aware(datetime(2018, 1, 2, 3, 4, 5)),
    )


class TestSyncrapidpro:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, settings, monkeypatch):
        settings.RAPIDPRO_API_TOKEN = "boop"
        self.get_contact_batches = MagicMock(return_value=[[]])
        monkeypatch.setattr(syncrapidpro, "get_contact_batches", self.get_contact_batches)

    def test_it_syncs_contacts(self):
        contact = make_contact("5551234567", uuid="blarg")
        self.get_contact_batches.return_value = [[contact]]
        call()
        cm = ContactModel.objects.get(uuid="blarg")
        assert cm.phone_number == "5551234567"

        contact.urns = [make_phone_number_urn("5552221111")]
        call()
        cm = ContactModel.objects.get(uuid="blarg")
        assert cm.phone_number == "5552221111"

    def test_it_syncs_contact_groups(self):
        cmd = syncrapidpro.Command()
        group = make_group("funky", "Funky Group")
        cmd.sync_contact_group(group)
        assert str(list(ContactGroup.objects.all())) == "[<ContactGroup: Funky Group>]"
        group.name = "Monkey Group"
        cmd.sync_contact_group(group)
        assert str(list(ContactGroup.objects.all())) == "[<ContactGroup: Monkey Group>]"

    def test_it_updates_metadata_with_sync_time_minus_clock_skew(self):
        with freezegun.freeze_time("2012-01-14 12:00:00"):
            call()
            self.get_contact_batches.assert_called_once_with(after=None)

        m = Metadata.objects.first()
        last_sync = m.last_sync
        assert str(last_sync) == "2012-01-14 11:55:00+00:00"

        self.get_contact_batches.reset_mock()
        self.get_contact_batches.return_value = [[]]
        with freezegun.freeze_time("2012-01-15 03:00:00"):
            call()
            self.get_contact_batches.assert_called_once_with(after=last_sync)

        assert Metadata.objects.count() == 1
        assert str(Metadata.objects.first().last_sync) == "2012-01-15 02:55:00+00:00"

    def test_full_resync_works(self):
        call()
        self.get_contact_batches.assert_called_with(after=None)
        call("--full-resync")
        self.get_contact_batches.assert_called_with(after=None)

    def test_it_does_nothing_with_contacts_that_do_not_map_to_existing_users(self):
        self.get_contact_batches.return_value = [[make_contact()]]
        assert SYNCING_USER_SENTINEL not in call()

    def test_it_syncs_contacts_that_map_to_existing_users(self):
        user = UserFactory()
        contact = make_contact(user.phone_number, [make_group()])
        self.get_contact_batches.return_value = [[contact]]

        def call_and_ensure_expected_models():
            assert SYNCING_USER_SENTINEL in call()
            ucgs = list(UserContactGroup.objects.all())
            assert str(ucgs) == (
                "[<UserContactGroup: User boop's association with RapidPro "
                "contact group 'Funky Group'>]"
            )
            assert str(ucgs[0].earliest_known_date) == "2018-01-02 03:04:05+00:00"

            cgs = list(ContactGroup.objects.all())
            assert str(cgs) == "[<ContactGroup: Funky Group>]"
            assert cgs[0].uuid == "funky"

        call_and_ensure_expected_models()

        # Now re-sync and ensure idempotency.
        contact.modified_on = make_aware(datetime(2019, 1, 2))
        call_and_ensure_expected_models()

        # Now remove the user's association with the group and make sure it syncs.
        contact.groups[:] = []
        call()
        assert UserContactGroup.objects.count() == 0


def test_it_raises_error_when_settings_are_not_defined():
    with pytest.raises(CommandError, match="RAPIDPRO_API_TOKEN must be configured"):
        call()


def test_find_user_from_urns_returns_none_on_no_parseable_urns():
    assert syncrapidpro.find_user_from_urns([]) is None
    assert syncrapidpro.find_user_from_urns(["blah"]) is None

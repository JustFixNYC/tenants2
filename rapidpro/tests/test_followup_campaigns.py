from unittest.mock import MagicMock
from temba_client.v2.types import Contact
from freezegun import freeze_time
import pytest

from rapidpro import tasks
from rapidpro.followup_campaigns import (
    DjangoSettingsFollowupCampaigns, FollowupCampaign, trigger_followup_campaign_async)
from .test_rapidpro_util import mock_query, make_client_mocks


class TestDjangoSettingsFollowupCampaigns:
    def test_get_names_works(self):
        assert "RH" in DjangoSettingsFollowupCampaigns.get_names()

    def test_get_campaign_returns_none_if_unconfigured(self):
        assert DjangoSettingsFollowupCampaigns.get_campaign("RH") is None

    def test_get_campaign_returns_campaign_if_configured(self, settings):
        settings.RAPIDPRO_FOLLOWUP_CAMPAIGN_RH = "Blarg,date_of_blarg"
        assert DjangoSettingsFollowupCampaigns.get_campaign("RH") == \
            FollowupCampaign('Blarg', 'date_of_blarg')


class TestFollowupCampaign:
    def test_validate_works(self):
        client, _ = make_client_mocks('get_fields', "FAKE FIELD")
        mock_query(client, 'get_groups', "FAKE GROUP")
        campaign = FollowupCampaign('Boop Group', 'date_of_boop')
        campaign.validate(client)

    def test_validate_raises_error_on_failure(self):
        client, _ = make_client_mocks('get_fields', "FAKE FIELD")
        mock_query(client, 'get_groups', None)
        campaign = FollowupCampaign('Boop Group', 'date_of_boop')
        with pytest.raises(ValueError, match="Unable to find RapidPro group 'Boop Group'"):
            campaign.validate(client)

    def test_add_contact_works(self):
        contact = Contact.create(groups=["FAKE ARG GROUP"], fields={'fake_field': 'blah'})
        client, _ = make_client_mocks('get_contacts', contact)
        mock_query(client, 'get_groups', "FAKE BOOP GROUP")
        campaign = FollowupCampaign('Boop Group', 'date_of_boop')
        with freeze_time('2018-01-02'):
            campaign.add_contact(client, "Narf Jones", "5551234567", "en")
        client.update_contact.assert_called_once_with(
            contact,
            groups=["FAKE ARG GROUP", "FAKE BOOP GROUP"],
            fields={
                'fake_field': 'blah',
                'date_of_boop': '2018-01-02T00:00:00.000000Z'
            }
        )


class TestTriggerFollowupCampaignAsync:
    @pytest.fixture
    def tasks_trigger(self, monkeypatch):
        tasks_trigger = MagicMock()
        monkeypatch.setattr(tasks, 'trigger_followup_campaign_v2', tasks_trigger)
        yield tasks_trigger

    def test_it_does_nothing_if_rapidpro_is_unconfigured(self, settings, tasks_trigger):
        settings.RAPIDPRO_FOLLOWUP_CAMPAIGN_RH = 'Boop Group,date_of_boop'
        trigger_followup_campaign_async('Boop', '5551234567', 'RH', 'en')
        tasks_trigger.assert_not_called()

    def test_it_does_nothing_if_campaign_is_unconfigured(self, settings, tasks_trigger):
        settings.RAPIDPRO_API_TOKEN = 'blorp'
        trigger_followup_campaign_async('Boop', '5551234567', 'RH', 'en')
        tasks_trigger.assert_not_called()

    def test_it_triggers_if_rapidpro_and_campaign_are_configured(self, settings, tasks_trigger):
        settings.RAPIDPRO_FOLLOWUP_CAMPAIGN_RH = 'Boop Group,date_of_boop'
        settings.RAPIDPRO_API_TOKEN = 'blorp'
        trigger_followup_campaign_async('Boop Jones', '5551234567', 'RH', 'en')
        tasks_trigger.delay.assert_called_once_with('Boop Jones', '5551234567', 'RH', 'en')

    def test_task_works(self, settings, monkeypatch):
        settings.RAPIDPRO_FOLLOWUP_CAMPAIGN_RH = 'Boop Group,date_of_boop'
        settings.RAPIDPRO_API_TOKEN = 'blorp'
        dsfc = MagicMock()
        campaign = MagicMock()
        dsfc.get_campaign.return_value = campaign
        monkeypatch.setattr(tasks, 'DjangoSettingsFollowupCampaigns', dsfc)
        trigger_followup_campaign_async('Boop Jones', '5551234567', 'RH', 'en')
        dsfc.get_campaign.assert_called_once_with('RH')
        campaign.add_contact.assert_called_once()
        assert campaign.add_contact.call_args.args[1:] == ('Boop Jones', '5551234567')
        assert campaign.add_contact.call_args.kwargs == {'locale': 'en'}

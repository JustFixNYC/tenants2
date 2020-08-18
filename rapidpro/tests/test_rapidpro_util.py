from unittest.mock import MagicMock
from temba_client.v2 import TembaClient
import pytest

from rapidpro import rapidpro_util


@pytest.mark.parametrize('one,two', [
    ('en', 'eng'),
    ('es', 'spa'),
])
def test_iso639one2two(one, two):
    assert rapidpro_util.iso639one2two(one) == two


def test_iso639one2two_works_for_all_project_locales():
    from project.locales import ALL

    for locale, _ in ALL.choices:
        assert len(rapidpro_util.iso639one2two(locale)) == 3


class TestGetClientFromSettings:
    def test_it_returns_none_when_rapidpro_is_not_configured(self):
        assert rapidpro_util.get_client_from_settings() is None

    def test_it_returns_client_when_rapidpro_is_configured(self, settings):
        settings.RAPIDPRO_API_TOKEN = 'blah'
        assert isinstance(rapidpro_util.get_client_from_settings(), TembaClient)


def mock_query(client, query_method_name, first_result):
    query = MagicMock()
    query_method = getattr(client, query_method_name)
    query_method.return_value = query
    query.first.return_value = first_result
    return query


def make_client_mocks(query_method_name, first_result):
    client = MagicMock()
    query = mock_query(client, query_method_name, first_result)
    return (client, query)


class TestGetOrCreateContact:
    def test_it_returns_pre_existing_contacts(self):
        client, contacts = make_client_mocks('get_contacts', first_result="BOOP")
        assert rapidpro_util.get_or_create_contact(client, "Blarg", "5551234567", "en") == "BOOP"
        client.get_contacts.assert_called_once_with(urn="tel:+15551234567")
        contacts.first.assert_called_once()
        client.create_contact.assert_not_called()

    def test_it_creates_contact_when_needed(self):
        client, contacts = make_client_mocks('get_contacts', first_result=None)
        client.create_contact.return_value = "BOOP"
        assert rapidpro_util.get_or_create_contact(client, "Blarg", "5551234567", "en") == "BOOP"
        client.get_contacts.assert_called_once_with(urn="tel:+15551234567")
        contacts.first.assert_called_once()
        client.create_contact.assert_called_once_with(
            name="Blarg", urns=["tel:+15551234567"], language="eng")


class TestGetField:
    def test_it_raises_exception_if_not_found(self):
        client, _ = make_client_mocks('get_fields', first_result=None)
        with pytest.raises(ValueError, match="Unable to find RapidPro field with key 'foo_a'"):
            rapidpro_util.get_field(client, 'foo_a')

    def test_it_returns_field_if_found(self):
        client, _ = make_client_mocks('get_fields', first_result="BOOP")
        assert rapidpro_util.get_field(client, 'date_of_boop') == "BOOP"
        client.get_fields.assert_called_once_with(key="date_of_boop")


class TestGetGroup:
    def test_it_raises_exception_if_not_found(self):
        client, _ = make_client_mocks('get_groups', first_result=None)
        with pytest.raises(ValueError, match="Unable to find RapidPro group 'Foo Group'"):
            rapidpro_util.get_group(client, 'Foo Group')

    def test_it_returns_group_if_found(self):
        client, _ = make_client_mocks('get_groups', first_result="BOOP")
        assert rapidpro_util.get_group(client, 'Boop Group') == "BOOP"
        client.get_groups.assert_called_once_with(name="Boop Group")

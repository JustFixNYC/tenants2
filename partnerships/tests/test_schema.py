import pytest

from .factories import PartnerOrgFactory
from partnerships import referral


class TestActivePartnerReferral:
    QUERY = 'query { session { activePartnerReferral { name, slug, website } } }'

    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client):
        self.graphql_client = graphql_client

    def execute(self):
        res = self.graphql_client.execute(self.QUERY)
        return res['data']['session']['activePartnerReferral']

    def test_it_returns_none_when_no_referral_is_active(self):
        assert self.execute() is None

    def test_it_returns_info_when_referral_is_active(self, db):
        partner = PartnerOrgFactory()
        referral.set_partner(self.graphql_client.request, partner)
        assert self.execute()['slug'] == 'j4ac'

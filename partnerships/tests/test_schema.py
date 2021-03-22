from project.util.testing_util import TestWithGraphQL
from .factories import PartnerOrgFactory
from partnerships import referral


class TestActivePartnerReferral(TestWithGraphQL):
    def execute(self):
        res = self.graphql_client.execute(
            "query { session { activePartnerReferral { name, slug, website } } }"
        )
        return res["data"]["session"]["activePartnerReferral"]

    def test_it_returns_none_when_no_referral_is_active(self):
        assert self.execute() is None

    def test_it_returns_info_when_referral_is_active(self, db):
        partner = PartnerOrgFactory()
        referral.set_partner(self.request, partner)
        assert self.execute()["slug"] == "j4ac"

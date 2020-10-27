from .factories import PartnerOrgFactory
from partnerships.referral import PARTNER_REFERRAL_SESSION_KEY


class TestActivateReferral:
    def test_it_works(self, db, client):
        PartnerOrgFactory()
        res = client.get('/p/j4ac')
        assert client.session[PARTNER_REFERRAL_SESSION_KEY] == 'j4ac'
        assert res['location'] == '/'

    def test_it_accepts_next_param(self, db, client):
        PartnerOrgFactory()
        res = client.get('/p/j4ac?next=/blah/')
        assert res['location'] == '/blah/'

        res = client.get('/p/j4ac?next=http://evil.com/')
        assert res['location'] == '/'

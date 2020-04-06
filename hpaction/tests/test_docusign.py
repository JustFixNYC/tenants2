from django.contrib.auth.models import AnonymousUser
import pytest

from .factories import HPActionDocumentsFactory, DocusignEnvelopeFactory
from users.tests.factories import JustfixUser
from loc.tests.factories import LandlordDetailsFactory
from hpaction import docusign


def test_create_envelope_definition_for_hpa_works(db, django_file_storage):
    docs = HPActionDocumentsFactory()
    ed = docusign.create_envelope_definition_for_hpa(docs)
    assert len(ed.documents) == 1
    assert len(ed.recipients.signers) == 1


class TestGetContactInfo:
    def assert_unknown_info(self, user):
        info = docusign.get_contact_info(user)
        assert "landlord phone: unknown" in info
        assert "landlord email: unknown" in info

    def test_it_works_when_no_landlord_details_exist(self):
        self.assert_unknown_info(JustfixUser())

    def test_it_works_when_landlord_details_are_empty(self, db):
        self.assert_unknown_info(LandlordDetailsFactory().user)

    def test_it_works_when_landlord_details_are_populated(self, db):
        ld = LandlordDetailsFactory(phone_number="5551234567", email="landlordo@gmail.com")
        info = docusign.get_contact_info(ld.user)
        assert "landlord phone: (555) 123-4567" in info
        assert "landlord email: landlordo@gmail.com" in info


@pytest.mark.parametrize('docusign_event,envelope_status', [
    ('signing_complete', 'SIGNED'),
    ('decline', 'DECLINED'),
    ('viewing_complete', 'IN_PROGRESS'),
    ('cancel', 'IN_PROGRESS'),
])
def test_update_envelope_status(db, docusign_event, envelope_status, django_file_storage):
    de = DocusignEnvelopeFactory()
    docusign.update_envelope_status(de, docusign_event)
    de.refresh_from_db()
    assert de.status == envelope_status


class TestCallbackHandler:
    def test_it_returns_none_when_qs_args_do_not_apply(self, rf):
        req = rf.get('/')
        assert docusign.callback_handler(req) is None

    def handler(self, rf, event='myevt', envelope='myeid', next='myurl', user=None):
        url = f"/?type=ehpa&envelope={envelope}&next={next}&event={event}"
        req = rf.get(url)
        req.user = user or AnonymousUser()
        return docusign.callback_handler(req)

    def test_it_returns_400_on_invalid_envelope_id(self, rf, db):
        assert self.handler(rf, envelope='blarg').status_code == 400

    def test_it_returns_403_on_invalid_user(self, rf, db, django_file_storage):
        DocusignEnvelopeFactory(id='boop')
        assert self.handler(rf, envelope='boop').status_code == 403

    def test_it_updates_status_and_redirects_on_success(self, rf, db, django_file_storage):
        de = DocusignEnvelopeFactory(id='boop')
        res = self.handler(
            rf, envelope='boop', event='decline', user=de.docs.user)
        de.refresh_from_db()
        assert de.status == 'DECLINED'
        assert res.status_code == 302
        assert res['Location'] == 'myurl?event=decline'

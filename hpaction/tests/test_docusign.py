from .factories import HPActionDocumentsFactory
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

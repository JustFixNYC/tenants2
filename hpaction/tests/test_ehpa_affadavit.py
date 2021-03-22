from users.models import JustfixUser
from users.tests.factories import UserFactory
from hpaction.ehpa_affadavit import EHPAAffadavitVars, get_landlord_details
from loc.models import LandlordDetails
from loc.tests.factories import LandlordDetailsV2Factory
from onboarding.tests.factories import OnboardingInfoFactory


class TestEHPAAffadavitVarsFromUser:
    def test_it_works_with_empty_user(self, db):
        assert EHPAAffadavitVars.from_user(JustfixUser()).dict() == {
            "tenant_name": "N/A",
            "tenant_email": "N/A",
            "tenant_phone": "N/A",
            "tenant_address": "N/A",
            "landlord_name": "N/A",
            "landlord_email": "N/A",
            "landlord_phone": "N/A",
            "landlord_address": "N/A",
        }

    def test_it_works_with_full_user(self, db):
        onb = OnboardingInfoFactory(user__email="boop@jones.net")
        LandlordDetailsV2Factory(
            user=onb.user,
            email="landlordo@calrissian.net",
            phone_number="5552034032",
        )
        assert EHPAAffadavitVars.from_user(onb.user).dict() == {
            "tenant_name": "Boop Jones",
            "tenant_email": "boop@jones.net",
            "tenant_phone": "(555) 123-4567",
            "tenant_address": "150 court street, Apartment 2, Brooklyn, NY",
            "landlord_name": "Landlordo Calrissian",
            "landlord_email": "landlordo@calrissian.net",
            "landlord_phone": "(555) 203-4032",
            "landlord_address": "123 Cloud City Drive, Bespin, NY 12345",
        }

    def test_it_works_with_looked_up_landlord(self, db, nycdb):
        hpd_reg = nycdb.load_hpd_registration("medium-landlord.json")
        onb = OnboardingInfoFactory(
            user__email="boop@jones.net",
            pad_bbl=hpd_reg.pad_bbl,
        )
        LandlordDetailsV2Factory(
            user=onb.user,
            email="landlordo@calrissian.net",
            phone_number="5552034032",
            is_looked_up=True,
        )
        assert EHPAAffadavitVars.from_user(onb.user).dict() == {
            "tenant_name": "Boop Jones",
            "tenant_email": "boop@jones.net",
            "tenant_phone": "(555) 123-4567",
            "tenant_address": "150 court street, Apartment 2, Brooklyn, NY",
            "landlord_name": "ULTRA DEVELOPERS, LLC",
            "landlord_email": "landlordo@calrissian.net",
            "landlord_phone": "(555) 203-4032",
            "landlord_address": "3 ULTRA STREET, BROOKLYN, NY 11999",
        }


def test_get_landlord_details_works(db):
    user = UserFactory()
    assert get_landlord_details(user).name == ""

    user.landlord_details = LandlordDetails(name="Blarg")
    assert get_landlord_details(user).name == "Blarg"

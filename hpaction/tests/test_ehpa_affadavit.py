from users.models import JustfixUser

from hpaction.ehpa_affadavit import EHPAAffadavitVars
from loc.tests.factories import LandlordDetailsV2Factory
from onboarding.tests.factories import OnboardingInfoFactory


class TestEHPAAffadavitVarsFromUser:
    def test_it_works_with_empty_user(self):
        assert EHPAAffadavitVars.from_user(JustfixUser()).dict() == {
            'tenant_name': 'N/A',
            'tenant_email': 'N/A',
            'tenant_phone': 'N/A',
            'tenant_address': 'N/A',
            'landlord_name': 'N/A',
            'landlord_email': 'N/A',
            'landlord_phone': 'N/A',
            'landlord_address': 'N/A',
        }

    def test_it_works_with_full_user(self, db):
        onb = OnboardingInfoFactory(user__email="boop@jones.net")
        LandlordDetailsV2Factory(
            user=onb.user,
            email='landlordo@calrissian.net',
            phone_number='5552034032',
        )
        assert EHPAAffadavitVars.from_user(onb.user).dict() == {
            'tenant_name': 'Boop Jones',
            'tenant_email': 'boop@jones.net',
            'tenant_phone': '(555) 123-4567',
            'tenant_address': '150 court street, Apartment 2, Brooklyn, NY',
            'landlord_name': 'Landlordo Calrissian',
            'landlord_email': 'landlordo@calrissian.net',
            'landlord_phone': '(555) 203-4032',
            'landlord_address': '123 Cloud City Drive, Bespin, NY 12345'
        }

import factory

from onboarding.models import OnboardingInfo
from users.tests.factories import UserFactory


class OnboardingInfoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OnboardingInfo

    user = factory.SubFactory(UserFactory)

    address = '150 court street'

    address_verified = True

    borough = 'BROOKLYN'

    apt_number = '2'

    is_in_eviction = False

    needs_repairs = False

    has_no_services = False

    has_pests = False

    has_called_311 = False

    lease_type = False

    receives_public_assistance = False

    can_we_sms = True

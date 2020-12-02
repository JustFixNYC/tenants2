import factory

from onboarding.models import OnboardingInfo, LEASE_CHOICES, BOROUGH_CHOICES, SIGNUP_INTENT_CHOICES
from users.tests.factories import UserFactory


class OnboardingInfoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OnboardingInfo

    user = factory.SubFactory(UserFactory)

    address = "150 court street"

    address_verified = True

    borough = BOROUGH_CHOICES.BROOKLYN

    state = "NY"

    apt_number = "2"

    is_in_eviction = False

    needs_repairs = False

    has_no_services = False

    has_pests = False

    has_called_311 = False

    lease_type = LEASE_CHOICES.RENT_STABILIZED

    receives_public_assistance = False

    can_we_sms = True

    signup_intent = SIGNUP_INTENT_CHOICES.LOC

    agreed_to_justfix_terms = True

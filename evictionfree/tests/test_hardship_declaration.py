from freezegun.api import freeze_time
from django.contrib.auth.models import AnonymousUser
import pytest

from evictionfree.hardship_declaration import get_pages, EXAMPLE_VARIABLES, get_vars_for_user
from evictionfree.tests.factories import HardshipDeclarationDetailsFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LandlordDetailsV2Factory


def create_user_with_all_decl_info(hdd=None, oinfo=None):
    hdd = HardshipDeclarationDetailsFactory(**(hdd or {}))
    OnboardingInfoFactory(user=hdd.user, **(oinfo or {}))
    LandlordDetailsV2Factory(user=hdd.user)
    return hdd.user


@pytest.mark.parametrize("locale", ["en", "es"])
def test_get_pages_does_not_explode(locale):
    assert get_pages(EXAMPLE_VARIABLES, locale)


class TestGetVarsForUser:
    def test_it_returns_none_for_anonymous_users(self):
        assert get_vars_for_user(AnonymousUser()) is None

    def test_it_works_for_users_with_all_info(self, db):
        user = create_user_with_all_decl_info(
            hdd=dict(
                index_number="myindex",
                has_financial_hardship=True,
            )
        )
        with freeze_time("2021-01-25"):
            v = get_vars_for_user(user)
        assert v is not None
        assert v.index_number == "myindex"
        assert v.address == "150 court street, Apartment 2, Brooklyn, NY"
        assert v.has_financial_hardship is True
        assert v.has_health_risk is False
        assert v.name == "Boop Jones"
        assert v.date == "01/25/2021"

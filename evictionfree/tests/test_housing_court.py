from evictionfree.housing_court import get_housing_court_info_for_user
from users.tests.factories import UserFactory
from onboarding.tests.factories import NationalOnboardingInfoFactory, OnboardingInfoFactory
from findhelp.tests.factories import CountyFactory


class TestGetHousingCourtInfoForUser:
    def test_it_returns_none_if_user_has_no_onboarding_info(self):
        assert get_housing_court_info_for_user(UserFactory.build()) is None

    def test_it_returns_housing_court_for_nyc_users(self, db):
        hc = get_housing_court_info_for_user(OnboardingInfoFactory().user)
        assert hc is not None
        assert hc.name == "Kings County Housing Court"

    def test_it_returns_none_for_non_nyc_users(self, db):
        assert get_housing_court_info_for_user(NationalOnboardingInfoFactory().user) is None

    def test_it_returns_housing_court_for_non_nyc_ny_users_with_counties(self, db):
        CountyFactory()
        oi = NationalOnboardingInfoFactory(state="NY")
        NationalOnboardingInfoFactory.set_geocoded_point(oi, 0.1, 0.1)
        hc = get_housing_court_info_for_user(oi.user)
        assert hc is not None
        assert hc.name == "Outside NYC Housing Court"

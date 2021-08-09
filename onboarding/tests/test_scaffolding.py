import pytest

from onboarding.scaffolding import OnboardingScaffolding
from findhelp.tests.factories import LngLats


@pytest.fixture
def fake_is_lnglat_in_nyc(monkeypatch):
    from onboarding import scaffolding

    def is_lnglat_in_nyc(point):
        return {
            LngLats.BROOKLYN_HEIGHTS: True,
            LngLats.ALBANY: False,
            LngLats.YONKERS: False,
        }[point]

    monkeypatch.setattr(scaffolding, "is_lnglat_in_nyc", is_lnglat_in_nyc)


@pytest.mark.parametrize(
    "scaffolding,expected",
    [
        (OnboardingScaffolding(), None),
        (OnboardingScaffolding(city="brooklyn", state="NY"), True),
        (OnboardingScaffolding(city="brooklyn heights", state="NY"), False),
        (OnboardingScaffolding(city="New York/ Brooklyn", state="NY"), True),
        (OnboardingScaffolding(city="Jackson Heights/New York/Queens", state="NY"), True),
        (OnboardingScaffolding(city="College Point/Queens", state="NY"), True),
        (OnboardingScaffolding(city="Jackson Heights/New York/QUEENS", state="NY"), True),
        (OnboardingScaffolding(city="New York City/Manhattan", state="NY"), True),
        (OnboardingScaffolding(city="New York City / Manhattan", state="NY"), True),
        (OnboardingScaffolding(city="South ozone park./Queens", state="NY"), True),
        (OnboardingScaffolding(city="blarg / flarg", state="NY"), False),
        (
            OnboardingScaffolding(
                city="brooklyn heights", state="NY", lnglat=LngLats.BROOKLYN_HEIGHTS
            ),
            True,
        ),
        (OnboardingScaffolding(city="Albany", state="NY", lnglat=LngLats.ALBANY), False),
        (OnboardingScaffolding(city="Yonkers", state="NY", lnglat=LngLats.YONKERS), False),
    ],
)
def test_is_city_in_nyc_works(scaffolding, fake_is_lnglat_in_nyc, expected):
    assert scaffolding.is_city_in_nyc() is expected

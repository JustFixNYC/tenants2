import pytest

from onboarding.scaffolding import OnboardingScaffolding


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
            OnboardingScaffolding(city="brooklyn heights", state="NY", lnglat=(-73.9943, 40.6977)),
            True,
        ),
        (OnboardingScaffolding(city="Albany", state="NY", lnglat=(-73.755, 42.6512)), False),
        (OnboardingScaffolding(city="Yonkers", state="NY", lnglat=(-73.8987, 40.9312)), False),
    ],
)
def test_is_city_in_nyc_works(scaffolding, expected):
    assert scaffolding.is_city_in_nyc() is expected

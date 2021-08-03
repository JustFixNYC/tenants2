import pytest

from onboarding.scaffolding import OnboardingScaffolding, get_scaffolding, update_scaffolding
from onboarding.schema import session_key_for_step
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


class TestMigrateOnboardingToScaffolding:
    def test_it_migrates_step_1(self, http_request):
        http_request.session[session_key_for_step(1)] = {
            "first_name": "blop",
            "last_name": "jones",
            "preferred_first_name": "zip",
            "apt_number": "3",
            "address": "123 boop street",
            "borough": "MANHATTAN",
            "address_verified": True,
            "zipcode": "11201",
        }

        scf = get_scaffolding(http_request)

        assert scf.first_name == "blop"
        assert scf.last_name == "jones"
        assert scf.preferred_first_name == "zip"
        assert scf.address_verified is True
        assert scf.apt_number == "3"
        assert scf.street == "123 boop street"
        assert scf.borough == "MANHATTAN"
        assert scf.zip_code == "11201"

        assert session_key_for_step(1) not in http_request.session

    def test_it_migrates_only_step_1_address_info_when_needed(self, http_request):
        update_scaffolding(
            http_request,
            {
                "first_name": "foo",
                "last_name": "bar",
                "preferred_first_name": "bingy",
            },
        )
        http_request.session[session_key_for_step(1)] = {
            "first_name": "ignore",
            "last_name": "ignore",
            "preferred_first_name": "",
            "apt_number": "3",
            "address": "123 boop street",
            "borough": "MANHATTAN",
            "address_verified": True,
            "zipcode": "11201",
        }

        scf = get_scaffolding(http_request)

        assert scf.first_name == "foo"
        assert scf.last_name == "bar"
        assert scf.preferred_first_name == "bingy"
        assert scf.address_verified is True
        assert scf.apt_number == "3"
        assert scf.street == "123 boop street"
        assert scf.borough == "MANHATTAN"

        assert session_key_for_step(1) not in http_request.session

    def test_it_migrates_step_3(self, http_request):
        http_request.session[session_key_for_step(3)] = {
            "lease_type": "RENT_STABILIZED",
            "receives_public_assistance": "True",
        }

        scf = get_scaffolding(http_request)

        assert scf.lease_type == "RENT_STABILIZED"
        assert scf.receives_public_assistance is True

        assert session_key_for_step(3) not in http_request.session

    def test_it_migrates_rent_history_form_info(self, http_request):
        from rh.schema import RhFormInfo

        key = RhFormInfo._meta.session_key

        http_request.session[key] = {
            "address": "123 boop st",
            "borough": "MANHATTAN",
            "first_name": "boop",
            "last_name": "jonze",
            "phone_number": "5551234567",
            "apartment_number": "2B",
            "zipcode": "11201",
        }

        scf = get_scaffolding(http_request)

        assert scf.first_name == "boop"
        assert scf.last_name == "jonze"
        assert scf.street == "123 boop st"
        assert scf.apt_number == "2B"
        assert scf.zip_code == "11201"
        assert scf.phone_number == "5551234567"

        assert key not in http_request.session

from io import StringIO
from unittest.mock import patch
from django.core.management import call_command
from django.utils import timezone
import freezegun

import pytest

from findhelp.tests.factories import CountyFactory
from onboarding.management.commands import verify_addresses
from project.tests.test_geocoding import EXAMPLE_SEARCH, enable_fake_geocoding
from .factories import OnboardingInfoFactory, NationalOnboardingInfoFactory


def make_cmd():
    return verify_addresses.Command(stdout=StringIO())


class TestVerify:
    @pytest.fixture(autouse=True)
    def init_cmd(self, monkeypatch, db):
        self.cmd = make_cmd()
        self.confirm_response = None
        monkeypatch.setattr(self.cmd, "confirm", self.fake_confirm)

    def fake_confirm(self):
        assert isinstance(self.confirm_response, bool)
        return self.confirm_response

    def test_it_does_nothing_on_verification_failure(self):
        self.cmd.verify(OnboardingInfoFactory())
        assert (
            "Unable to geocode address for '150 court street, Brooklyn, New York'"
            in self.cmd.stdout.getvalue()
        )

    def test_it_automatically_saves_exact_nyc_matches(self, db, requests_mock, settings):
        oi = OnboardingInfoFactory()
        with enable_fake_geocoding:
            requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
            self.cmd.verify(oi)
        assert "exactly matches user address" in self.cmd.stdout.getvalue()
        oi.refresh_from_db()
        assert (
            oi.geocoded_address
            == "150 COURT STREET, Brooklyn, New York, NY, USA (via NYC GeoSearch)"
        )

    def test_it_does_nothing_when_user_does_not_confirm_nycaddr(self, db, requests_mock, settings):
        self.confirm_response = False
        oi = OnboardingInfoFactory(address="123 funky street")
        with enable_fake_geocoding:
            requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
            self.cmd.verify(oi)
        assert "Geocoded nyc address:" in self.cmd.stdout.getvalue()
        oi.refresh_from_db()
        assert oi.geocoded_address == ""

    def test_it_updates_info_when_user_confirms_nycaddr(self, db, requests_mock, settings):
        self.confirm_response = True
        oi = OnboardingInfoFactory(address="123 funky street")
        with enable_fake_geocoding:
            requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
            self.cmd.verify(oi)
        assert "Geocoded nyc address:" in self.cmd.stdout.getvalue()
        oi.refresh_from_db()
        assert (
            oi.geocoded_address
            == "150 COURT STREET, Brooklyn, New York, NY, USA (via NYC GeoSearch)"
        )


@pytest.mark.parametrize(
    "addr,expected",
    [
        ("blarg", "blarg"),
        ("Oof, United States (via Mapbox)", "Oof"),
        ("Meh, New York, NY, USA (via NYC GeoSearch)", "Meh"),
    ],
)
def test_strip_suffix_works(addr, expected):
    assert verify_addresses.strip_suffix(addr) == expected


@pytest.mark.parametrize(
    "onboarding_info,expected",
    [
        (OnboardingInfoFactory.build(), "150 court street, Brooklyn, New York"),
        (
            OnboardingInfoFactory.build(zipcode="12345"),
            "150 court street, Brooklyn, New York 12345",
        ),
    ],
)
def test_get_addr_works(onboarding_info, expected):
    assert verify_addresses.get_addr(onboarding_info) == expected


@pytest.mark.parametrize(
    "onboarding_info,expected",
    [
        (OnboardingInfoFactory.build(), "150 court street, Brooklyn"),
        (
            OnboardingInfoFactory.build(zipcode="12345"),
            "150 court street, Brooklyn",
        ),
        (NationalOnboardingInfoFactory.build(), "200 N Spring St, Los Angeles, California"),
        (
            NationalOnboardingInfoFactory.build(zipcode="90012"),
            "200 N Spring St, Los Angeles, California 90012",
        ),
    ],
)
def test_get_expected_geocoded_addr(onboarding_info, expected):
    assert verify_addresses.get_expected_geocoded_addr(onboarding_info) == expected


@pytest.mark.parametrize(
    "user_input,expected",
    [
        ("y", True),
        ("Y", True),
        ("n", False),
        ("N", False),
        ("", False),
        ("eawgpeowgjpoj", False),
    ],
)
def test_confirm_works(user_input, expected):
    cmd = make_cmd()
    with patch.object(verify_addresses, "input", return_value=user_input):
        assert cmd.confirm() is expected


def test_handle_works(db):
    with freezegun.freeze_time("2021-01-10"):
        oi = OnboardingInfoFactory(address_verified=False)
        oi.user.last_login = timezone.now()
        oi.user.save()

    out = StringIO()
    call_command("verify_addresses", "--state", "NY", "--since", "2021-01-02", stdout=out)
    assert out.getvalue().splitlines() == [
        "1 user(s) found.",
        "Verifying nyc address for boop (last login @ 2021-01-10 00:00:00+00:00).",
        f"User admin link: https://example.com/admin/users/justfixuser/{oi.user.pk}/change/",
        "Unable to geocode address for '150 court street, Brooklyn, New York'. The "
        "geocoding service may be down or no addresses matched.",
    ]


class TestConvertNationalToNycAddrIfNeeded:
    def make_national_nyc_onboarding_info(self):
        return NationalOnboardingInfoFactory(
            state="NY",
            non_nyc_city="Stratford",
            geocoded_address="1200 Stratford Avenue, Bronx, New York 10472, "
            "United States (via Mapbox)",
            geometry={
                "type": "Point",
                "coordinates": [0.1, 0.1],
            },
        )

    def test_it_does_nothing_if_already_in_nyc(self, db):
        cmd = verify_addresses.Command()
        oi = OnboardingInfoFactory()
        assert cmd.convert_national_to_nyc_addr_if_needed(oi) is False

    def test_it_does_nothing_if_not_in_nyc_borough(self, db):
        cmd = verify_addresses.Command()
        CountyFactory(name="Erie")
        oi = self.make_national_nyc_onboarding_info()
        assert cmd.convert_national_to_nyc_addr_if_needed(oi) is False

    def test_it_works(self, db):
        cmd = verify_addresses.Command()
        CountyFactory(name="Bronx")
        oi = self.make_national_nyc_onboarding_info()
        assert cmd.convert_national_to_nyc_addr_if_needed(oi) is True
        assert oi.borough == "BRONX"
        assert oi.non_nyc_city == ""
        oi.full_clean()
        oi.save()

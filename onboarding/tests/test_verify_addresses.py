from io import StringIO
from unittest.mock import patch
from django.core.management import call_command
import pytest

from onboarding.management.commands import verify_addresses
from project.tests.test_geocoding import EXAMPLE_SEARCH, enable_fake_geocoding
from .factories import OnboardingInfoFactory


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
        assert "Geocoded address:" in self.cmd.stdout.getvalue()
        oi.refresh_from_db()
        assert oi.geocoded_address == ""

    def test_it_updates_info_when_user_confirms_nycaddr(self, db, requests_mock, settings):
        self.confirm_response = True
        oi = OnboardingInfoFactory(address="123 funky street")
        with enable_fake_geocoding:
            requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
            self.cmd.verify(oi)
        assert "Geocoded address:" in self.cmd.stdout.getvalue()
        oi.refresh_from_db()
        assert (
            oi.geocoded_address
            == "150 COURT STREET, Brooklyn, New York, NY, USA (via NYC GeoSearch)"
        )


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
    oi = OnboardingInfoFactory(address_verified=False)
    out = StringIO()
    call_command("verify_addresses", stdout=out)
    assert out.getvalue().splitlines() == [
        "Verifying nyc address for boop (last login @ None).",
        f"User admin link: https://example.com/admin/users/justfixuser/{oi.user.pk}/change/",
        "Unable to geocode address for '150 court street, Brooklyn, New York'. The "
        "geocoding service may be down or no addresses matched.",
    ]

from io import StringIO
from unittest.mock import patch
from django.forms import ValidationError
from django.core.management import call_command
import pytest

from project.util.address_form_fields import AddressVerificationResult
from onboarding.management.commands import verify_addresses
from .factories import OnboardingInfoFactory


def make_cmd():
    return verify_addresses.Command(stdout=StringIO())


class TestGetVerifiedAddress:
    @patch.object(verify_addresses, "verify_address")
    def test_it_returns_tuple_on_success(self, m):
        m.return_value = AddressVerificationResult("some address", "some borough", True)
        cmd = make_cmd()
        result = cmd.get_verified_address("foo", "bar")
        m.assert_called_once_with("foo", "bar")
        assert result == ("some address", "some borough")
        assert cmd.stdout.getvalue() == ""

    @patch.object(verify_addresses, "verify_address")
    def test_it_returns_none_when_geocoding_is_down(self, m):
        m.return_value = AddressVerificationResult("", "", False)
        cmd = make_cmd()
        result = cmd.get_verified_address("foo", "bar")
        assert result is None
        assert "geocoding service may be down" in cmd.stdout.getvalue()

    @patch.object(verify_addresses, "verify_address")
    def test_it_returns_none_on_invalid_addresses(self, m):
        m.side_effect = ValidationError("blah")
        cmd = make_cmd()
        result = cmd.get_verified_address("foo", "bar")
        assert result is None
        assert "the address appears to be invalid" in cmd.stdout.getvalue()


class TestVerify:
    @pytest.fixture(autouse=True)
    def init_cmd(self, monkeypatch, db):
        self.oi = OnboardingInfoFactory(address_verified=False)
        self.cmd = make_cmd()
        self.confirm_response = False
        monkeypatch.setattr(self.cmd, "confirm", lambda: self.confirm_response)

    def verify(self, get_verified_address, confirm=False):
        self.confirm_response = confirm
        with patch.object(self.cmd, "get_verified_address", return_value=get_verified_address):
            self.cmd.verify(self.oi)

    def test_it_does_nothing_on_verification_failure(self):
        self.verify(get_verified_address=None)
        assert self.cmd.stdout.getvalue() == "Verifying address for boop.\n"

    def test_it_does_nothing_when_user_does_not_confirm(self, db):
        self.verify(get_verified_address=("foo", "MANHATTAN"), confirm=False)
        self.oi.refresh_from_db()
        assert self.oi.address == "150 court street"
        assert self.oi.borough == "BROOKLYN"
        assert self.oi.address_verified is False

    def test_it_updates_info_when_user_confirms(self, db):
        self.verify(get_verified_address=("foo", "MANHATTAN"), confirm=True)

        out = self.cmd.stdout.getvalue()
        assert "User entered the address: 150 court street, BROOKLYN" in out
        assert "Geocoded address is: foo, MANHATTAN" in out

        self.oi.refresh_from_db()
        assert self.oi.address == "foo"
        assert self.oi.borough == "MANHATTAN"
        assert self.oi.address_verified is True


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
    OnboardingInfoFactory(address_verified=False)
    out = StringIO()
    call_command("verify_addresses", stdout=out)
    assert out.getvalue().splitlines() == [
        "Verifying address for boop.",
        "Unable to verify address, the geocoding service may be down.",
    ]

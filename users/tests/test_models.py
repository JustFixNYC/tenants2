from unittest.mock import patch, MagicMock
import pytest

from ..models import JustfixUser, create_random_phone_number
from .factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from texting import twilio


def test_create_random_phone_number_works():
    pn = create_random_phone_number()
    assert pn.startswith("555")
    assert len(pn) == 10


@pytest.mark.django_db
class TestGenerateRandomUsername:
    def generate(self, prefix="", **kwargs):
        user = JustfixUser.objects.create_user(
            username=JustfixUser.objects.generate_random_username(prefix=prefix), **kwargs
        )
        return user

    def test_it_applies_a_prefix_if_provided(self):
        with patch("users.models.get_random_string", side_effect=["boop"]):
            assert self.generate(prefix="bleh_").username == "bleh_boop"

    def test_it_retries_until_a_unique_one_is_found(self):
        with patch("users.models.get_random_string", side_effect=["boop", "boop", "blap"]):
            user = self.generate(phone_number="1234567890")
            assert user.username == "boop"
            user2 = self.generate(phone_number="1234567891")
            assert user2.username == "blap"


def test_formatted_phone_number_works():
    assert JustfixUser().formatted_phone_number() == ""

    user = JustfixUser(phone_number="5551234567")
    assert user.formatted_phone_number() == "(555) 123-4567"

    user = JustfixUser(phone_number="999999999999999999")
    assert user.formatted_phone_number() == "999999999999999999"


@pytest.mark.django_db
def test_admin_url_works():
    user = UserFactory()
    assert user.admin_url == f"https://example.com/admin/users/justfixuser/{user.pk}/change/"


def test_str_works_when_username_is_available():
    user = JustfixUser(username="boop")
    assert str(user) == "boop"


def test_str_works_when_username_is_unavailable():
    user = JustfixUser()
    assert str(user) == "<unnamed user>"


def test_full_legal_name_only_renders_if_both_first_and_last_are_present():
    user = JustfixUser(first_name="Bobby", last_name="Denver")
    assert user.full_legal_name == "Bobby Denver"

    assert JustfixUser(first_name="Bobby").full_legal_name == ""
    assert JustfixUser(last_name="Denver").full_legal_name == ""


@pytest.mark.parametrize(
    "user_kwargs, expected",
    [
        ({"first_name": "Roberta"}, "Roberta"),
        (
            {"first_name": "Roberta", "preferred_first_name": "Bobbie"},
            "Bobbie",
        ),
    ],
)
def test_best_first_name(user_kwargs, expected):
    assert JustfixUser(**user_kwargs).best_first_name == expected


def test_send_sms_does_nothing_if_user_has_no_onboarding_info(smsoutbox):
    user = JustfixUser(phone_number="5551234500")
    assert user.send_sms("hello there") == twilio.SendSmsResult(
        err_code=twilio.TWILIO_USER_OPTED_OUT_ERR
    )
    user.send_sms_async("hello there")
    user.chain_sms_async(["hello there"])
    assert len(smsoutbox) == 0


@pytest.mark.django_db
def test_send_sms_does_nothing_if_user_does_not_allow_it(smsoutbox):
    user = OnboardingInfoFactory(can_we_sms=False).user
    assert user.send_sms("hello there") == twilio.SendSmsResult(
        err_code=twilio.TWILIO_USER_OPTED_OUT_ERR
    )
    user.send_sms_async("hello there")
    user.chain_sms_async(["hello there"])
    assert len(smsoutbox) == 0


@pytest.mark.django_db
def test_send_sms_works_if_user_allows_it(smsoutbox):
    def assert_sms_was_sent():
        assert len(smsoutbox) == 1
        assert smsoutbox[0].to == "+15551234500"
        assert smsoutbox[0].body == "hello there"
        smsoutbox[:] = []

    user = OnboardingInfoFactory(can_we_sms=True, user__phone_number="5551234500").user
    assert user.send_sms("hello there")
    assert_sms_was_sent()
    user.send_sms_async("hello there")
    assert_sms_was_sent()
    user.chain_sms_async(["hello there"])
    assert_sms_was_sent()


class TestTriggerFollowupCampaign:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, monkeypatch):
        from rapidpro import followup_campaigns

        self.trigger = MagicMock()
        monkeypatch.setattr(followup_campaigns, "trigger_followup_campaign_async", self.trigger)

    def test_it_does_nothing_if_user_prohibits_sms(self, db):
        OnboardingInfoFactory(can_we_sms=False).user.trigger_followup_campaign_async("LOC")
        self.trigger.assert_not_called()

    def test_it_triggers_followup_campaign_if_user_allows_sms(self, db):
        OnboardingInfoFactory(can_we_sms=True).user.trigger_followup_campaign_async("LOC")
        self.trigger.assert_called_once_with("Boop Jones", "5551234567", "LOC", locale="en")

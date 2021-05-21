import contextlib
from unittest.mock import patch
import pytest
from twilio.base.exceptions import TwilioRestException
from django.core.exceptions import ImproperlyConfigured

from texting.models import PhoneNumberLookup
from texting import twilio
from texting.twilio import (
    send_sms_async,
    chain_sms_async,
    send_sms,
    validate_settings,
    logger,
    is_phone_number_valid,
    get_carrier_info,
    SendSmsResult,
)


INVALID_SMS_RESULT = SendSmsResult(sid="", err_code=twilio.TWILIO_INVALID_TO_NUMBER_ERR)


class TestSendSmsResult:
    def test_str_works(self):
        assert str(SendSmsResult("blap")) == "SendSmsResult(sid='blap', err_code=None)"

    def test_bool_works(self):
        assert bool(SendSmsResult("")) is False
        assert bool(SendSmsResult("boop")) is True

    @pytest.mark.parametrize(
        "ssr,expected",
        [
            (SendSmsResult(), True),
            (SendSmsResult("1234"), False),
            (SendSmsResult(err_code=12345), True),
            (SendSmsResult(err_code=twilio.TWILIO_BLOCKED_NUMBER_ERR), False),
        ],
    )
    def test_should_retry_works(self, ssr, expected):
        assert ssr.should_retry is expected


def test_send_sms_works(db, settings, smsoutbox):
    settings.TWILIO_PHONE_NUMBER = "9990001234"

    send_sms("5551234567", "boop")
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == "+15551234567"
    assert smsoutbox[0].from_ == "+19990001234"
    assert smsoutbox[0].body == "boop"


def test_send_sms_still_works_if_lookup_says_number_is_valid(db, settings, smsoutbox):
    apply_twilio_settings(settings)

    pn = PhoneNumberLookup(phone_number="5551234567", is_valid=True)
    pn.carrier = {"blah": 1}
    pn.save()
    send_sms("5551234567", "boop")
    assert len(smsoutbox) == 1


def test_send_sms_async_works(db, settings, smsoutbox):
    settings.TWILIO_PHONE_NUMBER = "9990001234"

    send_sms_async("5551234567", "boop")
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == "+15551234567"
    assert smsoutbox[0].from_ == "+19990001234"
    assert smsoutbox[0].body == "boop"


def test_chain_sms_async_adds_countdown_between_sends():
    with patch("celery.chain") as mock:
        chain_sms_async("5551234567", ["boop", "jones", "blarg"])
        (args, kwargs) = mock.call_args_list[0]
        (first, second, third) = args
        assert first.options == {}
        assert second.options == {"countdown": 10}
        assert third.options == {"countdown": 10}


def test_chain_sms_async_works(db, settings, smsoutbox):
    settings.TWILIO_PHONE_NUMBER = "9990001234"

    chain_sms_async("5551234567", ["boop", "jones"])
    assert len(smsoutbox) == 2
    for msg in smsoutbox:
        assert msg.to == "+15551234567"
        assert msg.from_ == "+19990001234"

    assert smsoutbox[0].body == "boop"
    assert smsoutbox[1].body == "jones"


def apply_twilio_settings(settings):
    settings.TWILIO_ACCOUNT_SID = "myaccount"
    settings.TWILIO_AUTH_TOKEN = "test auth token"
    settings.TWILIO_PHONE_NUMBER = "0001234567"


def get_twilio_lookup_url(phone_number: str):
    return f"https://lookups.twilio.com/v1/PhoneNumbers/+1{phone_number}"


def get_twilio_lookup_result():
    # https://www.twilio.com/docs/lookup/api
    return {
        "caller_name": {
            "caller_name": "Delicious Cheese Cake",
            "caller_type": "CONSUMER",
            "error_code": None,
        },
        "carrier": {
            "error_code": None,
            "mobile_country_code": "310",
            "mobile_network_code": "456",
            "name": "verizon",
            "type": "mobile",
        },
        "fraud": {
            "error_code": None,
            "mobile_country_code": "310",
            "mobile_network_code": "456",
            "advanced_line_type": "voip",
            "caller_name": "Delicious Cheese Cake",
            "is_ported": False,
            "last_ported_date": "2018-05-01 04:05:11",
        },
        "country_code": "US",
        "national_format": "(510) 867-5309",
        "phone_number": "+15108675310",
        "add_ons": {"status": "successful", "message": None, "code": None, "results": {}},
        "url": "https://lookups.twilio.com/v1/PhoneNumbers/phone_number",
    }


def get_twilio_sms_url(settings):
    sid = settings.TWILIO_ACCOUNT_SID
    return f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"


@contextlib.contextmanager
def ensure_twilio_error_is_logged():
    with patch.object(logger, "exception") as mock_exc:
        yield
    mock_exc.assert_called_once_with("Error while communicating with Twilio")


@contextlib.contextmanager
def ensure_exception_is_not_logged():
    with patch.object(logger, "exception") as mock_exc:
        yield
    mock_exc.assert_not_called()


def test_send_sms_does_not_send_to_invalid_numbers(db, settings, requests_mock):
    apply_twilio_settings(settings)
    PhoneNumberLookup(phone_number="5551234567", is_valid=False).save()
    assert send_sms("5551234567", "boop", ignore_invalid_phone_number=True) == INVALID_SMS_RESULT


def mock_invalid_number(settings, requests_mock):
    status = 400  # I think this is the status for this error but not sure.
    error_json = {
        "code": 21211,
        "message": "blah",
        "more_info": "https://www.twilio.com/docs/api/errors/21211",
        "status": status,
    }
    requests_mock.post(get_twilio_sms_url(settings), status_code=status, json=error_json)


def mock_blocked_number(settings, requests_mock):
    status = 400  # I think this is the status for this error but not sure.
    error_json = {
        "code": 21610,
        "message": "blah",
        "more_info": "https://www.twilio.com/docs/api/errors/21610",
        "status": status,
    }
    requests_mock.post(get_twilio_sms_url(settings), status_code=status, json=error_json)


def test_send_sms_ignores_invalid_numbers(db, settings, requests_mock):
    apply_twilio_settings(settings)
    mock_invalid_number(settings, requests_mock)
    assert send_sms("5551234567", "boop", ignore_invalid_phone_number=True) == INVALID_SMS_RESULT
    lookup = PhoneNumberLookup.objects.get(phone_number="5551234567")
    assert lookup.is_valid is False


def test_send_sms_ignores_invalid_numbers_we_thought_were_valid(db, settings, requests_mock):
    apply_twilio_settings(settings)
    mock_invalid_number(settings, requests_mock)
    PhoneNumberLookup(phone_number="5551234567", is_valid=True, carrier={}).save()
    assert send_sms("5551234567", "boop", ignore_invalid_phone_number=True) == INVALID_SMS_RESULT
    lookup = PhoneNumberLookup.objects.get(phone_number="5551234567")
    assert lookup.is_valid is False


def test_send_sms_remembers_invalid_numbers_even_when_not_ignoring_them(
    db, settings, requests_mock
):
    apply_twilio_settings(settings)
    mock_invalid_number(settings, requests_mock)
    with pytest.raises(TwilioRestException, match="Unable to create record") as excinfo:
        send_sms("5551234567", "boop", ignore_invalid_phone_number=False)
    assert excinfo.value.code == 21211

    lookup = PhoneNumberLookup.objects.get(phone_number="5551234567")
    assert lookup.is_valid is False


def test_send_sms_logs_errors_when_failing_silently(db, settings, requests_mock):
    apply_twilio_settings(settings)
    requests_mock.post(get_twilio_sms_url(settings), json={})
    with ensure_twilio_error_is_logged():
        send_sms("5551234567", "boop", fail_silently=True)


def test_send_sms_does_not_log_blocked_numbers_when_failing_silently(db, settings, requests_mock):
    apply_twilio_settings(settings)
    mock_blocked_number(settings, requests_mock)
    with ensure_exception_is_not_logged():
        send_sms("5551234567", "boop", fail_silently=True)


def test_send_sms_raises_exception_by_default(db, settings, requests_mock):
    apply_twilio_settings(settings)
    requests_mock.post(get_twilio_sms_url(settings), json={})
    with pytest.raises(KeyError):
        send_sms("5551234567", "boop")


def test_sms_does_not_send_sms_if_sms_is_disabled(settings, smsoutbox):
    settings.TWILIO_ACCOUNT_SID = ""
    send_sms("5551234567", "boop")
    assert len(smsoutbox) == 0


class TestValidateSettings:
    def test_no_account_sid_is_valid(self, settings):
        settings.TWILIO_ACCOUNT_SID = ""
        validate_settings()

    def test_all_settings_is_valid(self, settings):
        apply_twilio_settings(settings)
        validate_settings()

    def test_partial_config_is_invalid(self, settings):
        settings.TWILIO_ACCOUNT_SID = "test account sid"
        settings.TWILIO_AUTH_TOKEN = ""
        settings.TWILIO_PHONE_NUMBER = ""

        with pytest.raises(ImproperlyConfigured, match="TWILIO_ACCOUNT_SID is non-empty, but"):
            validate_settings()


class BaseTest:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, settings):
        apply_twilio_settings(settings)
        self.settings = settings


class TestGetCarrierInfo(BaseTest):
    def test_it_returns_none_when_twilio_is_disabled(self):
        self.settings.TWILIO_ACCOUNT_SID = ""
        assert get_carrier_info("5108675310") is None

    def test_it_returns_info(self, requests_mock):
        requests_mock.get(
            get_twilio_lookup_url("5108675310") + "?Type=carrier",
            json=get_twilio_lookup_result(),
        )
        info = get_carrier_info("5108675310")
        assert info is not None
        assert info["type"] == "mobile"

    def test_it_returns_none_on_error(self, requests_mock):
        requests_mock.get(get_twilio_lookup_url("5108675310") + "?Type=carrier", status_code=500)
        with ensure_twilio_error_is_logged():
            assert get_carrier_info("5108675310") is None


class TestIsPhoneNumberValid(BaseTest):
    def test_it_returns_none_when_twilio_is_disabled(self):
        self.settings.TWILIO_ACCOUNT_SID = ""
        assert is_phone_number_valid("5108675310") is None

    def test_it_returns_true_when_valid(self, requests_mock):
        requests_mock.get(
            get_twilio_lookup_url("5108675310"),
            complete_qs=True,
            json={**get_twilio_lookup_result(), "carrier": None},
        )
        assert is_phone_number_valid("5108675310") is True

    def test_it_returns_false_when_invalid(self, requests_mock):
        # https://www.twilio.com/console/runtime/api-explorer/lookup/lookup-phone-numbers/fetch
        error_json = {
            "code": 20404,
            "message": "The requested resource /PhoneNumbers/5108675310 was not found",
            "more_info": "https://www.twilio.com/docs/errors/20404",
            "status": 404,
        }
        requests_mock.get(
            get_twilio_lookup_url("5108675310"), complete_qs=True, status_code=404, json=error_json
        )
        assert is_phone_number_valid("5108675310") is False

    def test_it_returns_none_on_other_errors(self, requests_mock):
        requests_mock.get(get_twilio_lookup_url("5108675310"), complete_qs=True, status_code=500)
        with ensure_twilio_error_is_logged():
            assert is_phone_number_valid("5108675310") is None

from project.twilio import send_sms


def test_send_sms_works(settings, smsoutbox):
    settings.TWILIO_PHONE_NUMBER = '9990001234'

    send_sms('5551234567', 'boop')
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == '+15551234567'
    assert smsoutbox[0].from_ == '+19990001234'
    assert smsoutbox[0].body == 'boop'


def test_sms_does_not_send_sms_if_sms_is_disabled(settings, smsoutbox):
    settings.TWILIO_ACCOUNT_SID = ''
    send_sms('5551234567', 'boop')
    assert len(smsoutbox) == 0

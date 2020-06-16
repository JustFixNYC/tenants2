from django.core.management import call_command


def test_sendtestsms_works(db, smsoutbox):
    call_command('sendtestsms', '5551234568', 'blarg')
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == '+15551234568'
    assert smsoutbox[0].body == 'blarg'

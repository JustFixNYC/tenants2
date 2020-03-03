from django.core.management import call_command

from texting_history.models import Message


def test_it_works(db, mock_twilio_api):
    call_command('update_texting_history')

    msg = Message.objects.filter(body="testing").first()
    assert msg.is_from_us is False
    assert msg.ordering == 1558719890.0

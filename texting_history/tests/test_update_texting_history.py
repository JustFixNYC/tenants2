from django.core.management import call_command

from texting_history.models import Message
from texting_history.management.commands.update_texting_history import update_texting_history


def test_it_returns_none_if_twilio_is_disabled():
    assert update_texting_history() is None


def test_it_works(db, mock_twilio_api):
    call_command("update_texting_history")

    msg = Message.objects.filter(body="testing").first()
    assert msg.is_from_us is False
    assert msg.ordering == 1558719890.0

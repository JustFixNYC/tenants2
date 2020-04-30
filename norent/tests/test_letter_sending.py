from django.utils import timezone

from norent.letter_sending import (
    email_letter_to_landlord,
    send_letter_via_lob,
)
from norent.models import Letter


def test_nothing_is_emailed_on_demo_deployment(settings, mailoutbox, rf):
    settings.IS_DEMO_DEPLOYMENT = True
    letter = Letter()
    assert email_letter_to_landlord(rf.get('/'), letter, b"blah") is False
    assert letter.letter_emailed_at is None
    assert len(mailoutbox) == 0


def test_nothing_is_emailed_if_already_emailed(settings, mailoutbox, rf):
    settings.IS_DEMO_DEPLOYMENT = False
    letter = Letter(letter_emailed_at=timezone.now())
    assert email_letter_to_landlord(rf.get('/'), letter, b"blah") is False
    assert len(mailoutbox) == 0


def test_nothing_is_mailed_if_already_sent():
    letter = Letter(letter_sent_at=timezone.now())
    assert send_letter_via_lob(letter, b"blah") is False

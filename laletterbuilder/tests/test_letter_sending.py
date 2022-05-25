from django.utils import timezone
import pytest

from users.tests.factories import UserFactory
from .factories import HabitabilityLetterFactory, LandlordDetailsFactory
from laletterbuilder.letter_sending import (
    email_letter_to_landlord,
    send_letter_via_lob,
    create_letter,
)
from laletterbuilder.models import HabitabilityLetter


def test_nothing_is_emailed_on_demo_deployment(settings, mailoutbox, db):
    settings.IS_DEMO_DEPLOYMENT = True
    letter = HabitabilityLetterFactory()
    LandlordDetailsFactory(user=letter.user, email="landlordo@calrissian.net")
    assert email_letter_to_landlord(letter, b"blah") is True
    assert letter.letter_emailed_at is not None
    assert len(mailoutbox) == 0


def test_nothing_is_emailed_if_already_emailed(settings, mailoutbox):
    settings.IS_DEMO_DEPLOYMENT = False
    letter = HabitabilityLetter(letter_emailed_at=timezone.now())
    assert email_letter_to_landlord(letter, b"blah") is False
    assert len(mailoutbox) == 0


def test_nothing_is_mailed_if_already_sent(settings):
    settings.IS_DEMO_DEPLOYMENT = False
    letter = HabitabilityLetter(letter_sent_at=timezone.now())
    assert (
        send_letter_via_lob(
            letter,
            b"blah",
            letter_description="laletterbuilder letter",
        )
        is False
    )


class TestCreateLetter:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, monkeypatch):
        self.user = UserFactory()

    def test_it_creates_habitability_letter(self):
        letter = create_letter(self.user)
        assert letter.locale == "en"
        assert letter.html_content == "<>"
        assert letter.localized_html_content == ""

    def test_it_sets_spanish_locale(self):
        self.user.locale = "es"
        letter = create_letter(self.user)
        assert letter.locale == "es"

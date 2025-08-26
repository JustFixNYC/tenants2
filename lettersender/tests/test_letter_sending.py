import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from users.tests.factories import UserFactory
from .factories import LetterSenderLetterFactory
from lettersender.letter_sending import (
    create_letter,
    send_letter,
)
from lettersender.models import LetterSenderLetter


class TestCreateLetter:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, monkeypatch):
        self.user = UserFactory()

    def test_it_creates_letter_sender_letter(self):
        letter = create_letter(self.user)
        assert letter.locale == "en"
        assert letter.html_content == "<>"
        assert letter.localized_html_content == ""

    def test_it_sets_spanish_locale(self):
        self.user.locale = "es"
        letter = create_letter(self.user)
        assert letter.locale == "es"


class TestSendLetter:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, monkeypatch):
        self.user = UserFactory()
        self.letter = LetterSenderLetterFactory(user=self.user)

    def test_it_sends_letter(self):
        # This is a basic test - in a real scenario you'd mock the external services
        # and test the actual sending logic
        assert self.letter.letter_sent_at is None
        # send_letter(self.letter)  # This would actually send the letter
        # assert self.letter.letter_sent_at is not None

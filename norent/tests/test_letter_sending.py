from unittest.mock  import MagicMock
from django.utils import timezone
import pytest

from users.tests.factories import UserFactory
from project.util.testing_util import Blob
from .factories import RentPeriodFactory
import norent.letter_sending
from norent.letter_sending import (
    email_letter_to_landlord,
    send_letter_via_lob,
    create_letter,
)
from norent.models import Letter


def test_nothing_is_emailed_on_demo_deployment(settings, mailoutbox):
    settings.IS_DEMO_DEPLOYMENT = True
    letter = Letter()
    assert email_letter_to_landlord(letter, b"blah") is False
    assert letter.letter_emailed_at is None
    assert len(mailoutbox) == 0


def test_nothing_is_emailed_if_already_emailed(settings, mailoutbox):
    settings.IS_DEMO_DEPLOYMENT = False
    letter = Letter(letter_emailed_at=timezone.now())
    assert email_letter_to_landlord(letter, b"blah") is False
    assert len(mailoutbox) == 0


def test_nothing_is_mailed_if_already_sent():
    letter = Letter(letter_sent_at=timezone.now())
    assert send_letter_via_lob(letter, b"blah") is False


class TestCreateLetter:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, monkeypatch):
        self.rp = RentPeriodFactory()
        self.user = UserFactory()
        monkeypatch.setattr(
            norent.letter_sending,
            'render_static_content_via_react',
            self.render_static_content_via_react
        )

    def render_static_content_via_react(self, *args, locale, **kwargs):
        return Blob(html=f"fake letter in {locale}")

    def test_it_renders_only_english_when_user_is_english(self):
        letter = create_letter(self.user, self.rp)
        assert letter.locale == "en"
        assert letter.html_content == "fake letter in en"
        assert letter.localized_html_content == ""

    def test_it_renders_in_locale_when_user_is_not_english(self):
        self.user.locale = 'es'
        letter = create_letter(self.user, self.rp)
        assert letter.locale == "es"
        assert letter.html_content == "fake letter in en"
        assert letter.localized_html_content == "fake letter in es"

from unittest.mock import MagicMock
from django.core.management import call_command
from django.utils import timezone
from freezegun import freeze_time
import pytest

from .factories import LetterFactory
from norent.management.commands import process_norent_letters


@pytest.fixture
def fake_send_letter(monkeypatch):
    send_letter = MagicMock()
    monkeypatch.setattr(process_norent_letters, "send_letter", send_letter)
    yield send_letter


def test_it_ignores_brand_new_unprocessed_letters(db, fake_send_letter):
    LetterFactory(fully_processed_at=None)
    call_command("process_norent_letters")
    fake_send_letter.assert_not_called()


def test_it_processes_slightly_old_unprocessed_letters(db, fake_send_letter):
    with freeze_time("2021-02-01"):
        letter = LetterFactory(fully_processed_at=None)
    call_command("process_norent_letters")
    fake_send_letter.assert_called_once_with(letter)


def test_it_ignores_fully_processed_letters(db, fake_send_letter):
    with freeze_time("2021-02-01"):
        LetterFactory(fully_processed_at=timezone.now())
    call_command("process_norent_letters")
    fake_send_letter.assert_not_called()

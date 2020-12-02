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
    render_multilingual_letter,
    _merge_pdfs,
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
        monkeypatch.setattr(norent.letter_sending, "react_render", self.react_render)

    def react_render(self, site_type, locale, *args, **kwargs):
        return Blob(html=f"fake {site_type} letter in {locale}")

    def test_it_renders_only_english_when_user_is_english(self):
        letter = create_letter(self.user, [self.rp])
        assert letter.locale == "en"
        assert letter.html_content == "fake NORENT letter in en"
        assert letter.localized_html_content == ""

    def test_it_renders_in_locale_when_user_is_not_english(self):
        self.user.locale = "es"
        letter = create_letter(self.user, [self.rp])
        assert letter.locale == "es"
        assert letter.html_content == "fake NORENT letter in en"
        assert letter.localized_html_content == "fake NORENT letter in es"


class TestRenderMultilingualLetter:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, monkeypatch):
        monkeypatch.setattr(norent.letter_sending, "render_pdf_bytes", self.fake_render_pdf_bytes)
        monkeypatch.setattr(norent.letter_sending, "_merge_pdfs", self.fake_merge_pdfs)

    def fake_render_pdf_bytes(self, html: str):
        return bytes(f"FAKE PDF {html}", encoding="ascii")

    def fake_merge_pdfs(self, pdfs):
        return b" FOLLOWED BY ".join(pdfs)

    def test_it_returns_pdf_bytes_for_english_only(self):
        letter = Letter(html_content="english", localized_html_content="")
        assert render_multilingual_letter(letter) == b"FAKE PDF english"

    def test_it_merges_pdfs_when_localized_content_is_available(self):
        letter = Letter(html_content="english", localized_html_content="spanish")
        assert (
            render_multilingual_letter(letter) == b"FAKE PDF english FOLLOWED BY FAKE PDF spanish"
        )


def test_merge_pdfs_works():
    from hpaction.tests.factories import ONE_PAGE_PDF
    from io import BytesIO
    from PyPDF2 import PdfFileReader

    pdf_bytes = ONE_PAGE_PDF.read_bytes()
    merged_pdf_bytes = _merge_pdfs([pdf_bytes, pdf_bytes])

    reader = PdfFileReader(BytesIO(merged_pdf_bytes))
    assert reader.numPages == 2

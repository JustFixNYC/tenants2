from norent.models import Letter
import project.util.letter_sending as letter_sending
import pytest
from project.util.letter_sending import render_multilingual_letter, _merge_pdfs


class TestRenderMultilingualLetter:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, monkeypatch):
        monkeypatch.setattr(letter_sending, "render_pdf_bytes", self.fake_render_pdf_bytes)
        monkeypatch.setattr(letter_sending, "_merge_pdfs", self.fake_merge_pdfs)

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

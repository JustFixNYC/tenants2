import pytest


@pytest.fixture
def fake_fill_hardship_pdf(monkeypatch):
    """
    A fixture to "fake" the filling out of a hardship declaration PDF
    because the real thing takes a _really_ long time on slower systems
    (even on fast systems, it takes over a second, which adds up).
    """

    from evictionfree import hardship_declaration
    from hpaction.tests.factories import ONE_PAGE_PDF

    def fake(v, locale):
        return ONE_PAGE_PDF.read_bytes()

    monkeypatch.setattr(hardship_declaration, "fill_hardship_pdf", fake)

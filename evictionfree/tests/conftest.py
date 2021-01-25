import pytest


@pytest.fixture
def fake_fill_hardship_pdf(monkeypatch):
    from evictionfree import views

    def fake(v, locale):
        return bytes(b"blah")

    monkeypatch.setattr(views, "fill_hardship_pdf", fake)

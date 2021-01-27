import pytest


@pytest.fixture
def fake_fill_hardship_pdf(monkeypatch):
    from evictionfree import hardship_declaration

    def fake(v, locale):
        return bytes(b"blah")

    monkeypatch.setattr(hardship_declaration, "fill_hardship_pdf", fake)

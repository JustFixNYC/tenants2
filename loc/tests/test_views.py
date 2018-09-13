import pytest

from loc.views import can_we_render_pdfs, render_document


def test_render_document_raises_err_on_invalid_format():
    with pytest.raises(ValueError, match='unknown format "boof"'):
        render_document(None, None, None, 'boof')


def test_letter_requires_login(client):
    res = client.get('/loc/letter.html')
    assert res.status_code == 302


def test_letter_html_works(admin_client):
    res = admin_client.get('/loc/letter.html')
    assert res.status_code == 200
    assert res['Content-Type'] == 'text/html; charset=utf-8'


def test_example_html_works(client):
    res = client.get('/loc/example.html')
    assert res.status_code == 200
    assert res['Content-Type'] == 'text/html; charset=utf-8'


@pytest.mark.skipif(not can_we_render_pdfs(),
                    reason='PDF generation is unsupported')
def test_letter_pdf_works(admin_client):
    res = admin_client.get('/loc/letter.pdf')
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'


@pytest.mark.skipif(not can_we_render_pdfs(),
                    reason='PDF generation is unsupported')
def test_example_pdf_works(client):
    res = client.get('/loc/example.pdf')
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'

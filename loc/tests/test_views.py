import pytest

from loc.views import can_we_render_pdfs


@pytest.mark.skipif(not can_we_render_pdfs(),
                    reason='PDF generation is unsupported')
def test_letter_works(client):
    res = client.get('/loc/letter.pdf')
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'


@pytest.mark.skipif(not can_we_render_pdfs(),
                    reason='PDF generation is unsupported')
def test_example_works(client):
    res = client.get('/loc/example.pdf')
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'

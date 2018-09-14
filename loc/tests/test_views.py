import pytest

from users.tests.factories import UserFactory
from issues.models import Issue, CustomIssue
from loc.models import LandlordDetails
from loc.views import (
    can_we_render_pdfs, render_document, get_issues, get_landlord_name)


@pytest.mark.django_db
def test_get_landlord_name_works():
    user = UserFactory()
    assert get_landlord_name(user) == ''

    user.landlord_details = LandlordDetails(name="Blarg")
    assert get_landlord_name(user) == 'Blarg'


@pytest.mark.django_db
def test_get_issues_works():
    user = UserFactory()
    Issue.objects.set_area_issues_for_user(user, 'HOME', ['HOME__MICE'])
    CustomIssue.objects.set_for_user(user, 'BEDROOMS', 'Bleh.')

    assert get_issues(user) == [
        ('Entire home and hallways', ['Mice']),
        ('Bedrooms', ['Bleh.']),
    ]


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

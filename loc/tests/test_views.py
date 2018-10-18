import pytest

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
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


@pytest.mark.django_db
def test_letter_html_includes_expected_content(client):
    info = OnboardingInfoFactory(
        user__full_name="Bobby Denver",
        address="1 Times Square",
        borough="MANHATTAN",
        apt_number="301",
        zipcode="11201"
    )
    user = info.user
    Issue.objects.set_area_issues_for_user(user, 'HOME', ['HOME__MICE'])
    client.force_login(user)
    res = client.get('/loc/letter.html')
    html = res.content.decode('utf-8')

    assert 'Bobby Denver' in html
    assert '1 Times Square' in html
    assert 'Apartment 301' in html
    assert 'New York, NY 11201' in html

    # Make sure the section symbol is in there, to ensure that
    # we don't have any unicode issues.
    assert u"\u00A7" in html


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


@pytest.mark.skipif(not can_we_render_pdfs(),
                    reason='PDF generation is unsupported')
def test_admin_letter_pdf_works(admin_client):
    user = UserFactory()
    res = admin_client.get(f'/loc/admin/{user.pk}/letter.pdf')
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'


def test_admin_letter_pdf_returns_404_for_nonexistent_users(admin_client):
    res = admin_client.get(f'/loc/admin/1024/letter.pdf')
    assert res.status_code == 404


@pytest.mark.django_db
def test_admin_letter_pdf_is_inaccessible_to_non_staff_users(client):
    user = UserFactory()
    client.force_login(user)

    # Yes, even the user's own LoC should be forbidden to them.
    res = client.get(f'/loc/admin/{user.pk}/letter.pdf')

    assert res.status_code == 302
    assert res.url == f"/login?next=/loc/admin/{user.pk}/letter.pdf"

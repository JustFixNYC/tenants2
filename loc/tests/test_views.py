import pytest

from users.tests.factories import UserFactory
from issues.models import Issue, CustomIssue
from loc.models import LandlordDetails
from loc.views import (
    can_we_render_pdfs, render_document, get_issues, get_landlord_details,
    parse_comma_separated_ints)
from .factories import create_user_with_all_info

# Text that shows up in the letter of complaint if the user
# has reported their issues to 311.
CALLED_311_SENTINEL = "already contacted 311"


@pytest.mark.django_db
def test_get_landlord_details_works():
    user = UserFactory()
    assert get_landlord_details(user).name == ''

    user.landlord_details = LandlordDetails(name="Blarg")
    assert get_landlord_details(user).name == 'Blarg'


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


def get_letter_html(client):
    res = client.get('/loc/letter.html')
    assert res.status_code == 200
    assert res['Content-Type'] == 'text/html; charset=utf-8'
    return res.content.decode('utf-8')


def test_letter_html_works_for_users_with_minimal_info(admin_client):
    get_letter_html(admin_client)


@pytest.mark.django_db
def test_letter_html_includes_expected_content(client):
    user = create_user_with_all_info()
    client.force_login(user)
    html = get_letter_html(client)

    assert 'Bobby Denver' in html
    assert '1 Times Square' in html
    assert 'Apartment 301' in html
    assert 'New York, NY 11201' in html
    assert 'Dear Landlordo Calrissian' in html
    assert '1 Cloud City<br/>' in html
    assert CALLED_311_SENTINEL not in html

    # Make sure the section symbol is in there, to ensure that
    # we don't have any unicode issues.
    assert u"\u00A7" in html

    info = user.onboarding_info
    info.has_called_311 = True
    info.save()
    html = get_letter_html(client)
    assert CALLED_311_SENTINEL in html


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
def test_admin_letter_pdf_works(outreach_client):
    user = UserFactory()
    res = outreach_client.get(f'/loc/admin/{user.pk}/letter.pdf')
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


@pytest.mark.django_db
def test_admin_envelopes_pdf_is_inaccessible_to_non_staff_users(client):
    user = UserFactory()
    client.force_login(user)

    res = client.get(f'/loc/admin/envelopes.pdf')

    assert res.status_code == 302
    assert res.url == f"/login?next=/loc/admin/envelopes.pdf"


@pytest.mark.skipif(not can_we_render_pdfs(),
                    reason='PDF generation is unsupported')
def test_admin_envelopes_pdf_works(outreach_client):
    user = create_user_with_all_info()
    bare_user = UserFactory(phone_number='6141234567', username='blah')
    res = outreach_client.get(f'/loc/admin/envelopes.pdf?user_ids={user.pk},{bare_user.pk},zz')
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'
    assert res.context['users'] == [user]


def test_parse_comma_separated_ints_works():
    assert parse_comma_separated_ints('1') == [1]
    assert parse_comma_separated_ints('1,15') == [1, 15]
    assert parse_comma_separated_ints('1,lol') == [1]
    assert parse_comma_separated_ints('') == []
    assert parse_comma_separated_ints('haha') == []

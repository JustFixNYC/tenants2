from functools import wraps
from django.urls import reverse
import pytest

from users.tests.factories import UserFactory
from issues.models import Issue, CustomIssue
from loc.models import LandlordDetails, LetterRequest, LOC_MAILING_CHOICES
from loc.views import (
    can_we_render_pdfs, render_document, get_issues, get_landlord_details,
    parse_comma_separated_ints)
from .factories import create_user_with_all_info

# Text that shows up in the letter of complaint if the user
# has reported their issues to 311.
CALLED_311_SENTINEL = "already contacted 311"


# This is a warning raised from within defusedxml, which
# is used by one of our dependencies. At the time of this
# writing, we can't prevent it because a PR in defusedxml
# has yet to be merged: https://github.com/tiran/defusedxml/pull/24
ignore_defusedxml_warning = pytest.mark.filterwarnings(
    "ignore:The html argument of XMLParser")


def example_url(format: str) -> str:
    return reverse('loc_example', args=(format,))


def letter_url(format: str) -> str:
    return reverse('loc', args=(format,))


def admin_letter_url(user_id: int) -> str:
    return reverse('loc_for_user', kwargs={'user_id': user_id})


def requires_pdf_rendering(fn):
    @pytest.mark.skipif(not can_we_render_pdfs(),
                        reason='PDF generation is unsupported')
    @ignore_defusedxml_warning
    @wraps(fn)
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)
    return wrapper


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
    user.custom_issues.add(CustomIssue(area='BEDROOMS', description='Bleh.'), bulk=False)

    assert get_issues(user) == [
        ('Entire home and hallways', ['Mice']),
        ('Bedrooms', ['Other: Bleh.']),
    ]


def test_render_document_raises_err_on_invalid_format():
    with pytest.raises(ValueError, match='unknown format "boof"'):
        render_document(None, None, None, 'boof')


def test_letter_requires_login(client):
    res = client.get(letter_url('html'))
    assert res.status_code == 302


def get_letter_html(client, querystring=''):
    res = client.get(letter_url('html') + querystring)
    assert res.status_code == 200
    assert res['Content-Type'] == 'text/html; charset=utf-8'
    return res.content.decode('utf-8')


def test_letter_html_works_for_users_with_minimal_info(admin_client):
    get_letter_html(admin_client)


@pytest.mark.django_db
def test_letter_html_prefers_prerendered_content(client):
    zzzz = '<p>ZZZZ</p>'
    user = UserFactory()
    lr = LetterRequest(
        user=user, mail_choice=LOC_MAILING_CHOICES.WE_WILL_MAIL,
        html_content=zzzz)
    lr.save()
    client.force_login(user)
    assert zzzz in get_letter_html(client)
    assert zzzz not in get_letter_html(client, '?live_preview=on')


@pytest.mark.django_db
def test_letter_html_includes_expected_content(client):
    user = create_user_with_all_info()

    client.force_login(user)
    html = get_letter_html(client)

    assert 'BOBBY DENVER' in html
    assert '1 Times Square' in html
    assert 'Apartment 301' in html
    assert 'New York, NY 11201' in html
    assert 'Dear LANDLORDO CALRISSIAN' in html
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
    res = client.get(example_url('html'))
    assert res.status_code == 200
    assert res['Content-Type'] == 'text/html; charset=utf-8'


@requires_pdf_rendering
def test_letter_pdf_works(admin_client):
    res = admin_client.get(letter_url('pdf'))
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'


@requires_pdf_rendering
def test_example_pdf_works(client):
    res = client.get(example_url('pdf'))
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'


@requires_pdf_rendering
def test_admin_letter_pdf_works(outreach_client):
    user = UserFactory()
    res = outreach_client.get(admin_letter_url(user.pk))
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'


def test_admin_letter_pdf_returns_404_for_nonexistent_users(admin_client):
    res = admin_client.get(admin_letter_url(1024))
    assert res.status_code == 404


@pytest.mark.django_db
def test_admin_letter_pdf_is_inaccessible_to_non_staff_users(client):
    user = UserFactory()
    client.force_login(user)

    # Yes, even the user's own LoC should be forbidden to them.
    url = admin_letter_url(user.pk)
    res = client.get(url)

    assert res.status_code == 302
    assert res.url == f"/login?next={url}"


@pytest.mark.django_db
def test_admin_envelopes_pdf_is_inaccessible_to_non_staff_users(client):
    user = UserFactory()
    client.force_login(user)

    res = client.get(reverse('loc_envelopes'))

    assert res.status_code == 302
    assert res.url == f"/login?next={reverse('loc_envelopes')}"


@requires_pdf_rendering
def test_admin_envelopes_pdf_works(outreach_client):
    user = create_user_with_all_info()
    bare_user = UserFactory(phone_number='6141234567', username='blah')
    res = outreach_client.get(f'{reverse("loc_envelopes")}?user_ids={user.pk},{bare_user.pk},zz')
    assert res.status_code == 200
    assert res['Content-Type'] == 'application/pdf'
    assert res.context['users'] == [user]


def test_parse_comma_separated_ints_works():
    assert parse_comma_separated_ints('1') == [1]
    assert parse_comma_separated_ints('1,15') == [1, 15]
    assert parse_comma_separated_ints('1,lol') == [1]
    assert parse_comma_separated_ints('') == []
    assert parse_comma_separated_ints('haha') == []

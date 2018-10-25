import pytest
from django.test.client import Client
from django.contrib.auth.models import Permission

from .factories import UserFactory


# Content that shows up on a user change page if the
# logged-in user can set the superuser status of the user.
SUPERUSER_SENTINEL = 'superuser'


def get_permissions_from_ns_codenames(ns_codenames):
    '''
    Returns a list of Permission objects for the specified namespaced codenames
    '''

    splitnames = [ns_codename.split('.') for ns_codename in ns_codenames]
    return [
        Permission.objects.get(codename=codename,
                               content_type__app_label=app_label)
        for app_label, codename in splitnames
    ]


@pytest.fixture
def staff_user(db):
    user = UserFactory(
        username='staff',
        phone_number='1234567000',
        is_staff=True)
    user.user_permissions.set(get_permissions_from_ns_codenames([
        'users.change_justfixuser'
    ]))
    return user


@pytest.fixture
def staff_client(staff_user):
    client = Client()
    client.force_login(staff_user)
    return client


def test_list_view_works(admin_client):
    UserFactory(full_name='Blargy Blargface')
    res = admin_client.get('/admin/users/justfixuser/')
    assert res.status_code == 200
    assert b'Blargy' in res.content


def get_user_change_view_html(client):
    user = UserFactory(full_name='Blargy Blargface')
    res = client.get(f'/admin/users/justfixuser/{user.pk}/change/')
    assert res.status_code == 200
    assert b'Blargface' in res.content
    return res.content.decode('utf-8')


def test_change_view_works_for_superusers(admin_client):
    html = get_user_change_view_html(admin_client)
    assert SUPERUSER_SENTINEL in html


def test_change_view_works_for_staff(staff_client):
    html = get_user_change_view_html(staff_client)
    assert SUPERUSER_SENTINEL not in html

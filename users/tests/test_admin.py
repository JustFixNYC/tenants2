import pytest
from django.test.client import Client
from django.contrib.auth.models import Group
from django.core.management import call_command

from .factories import UserFactory


# Content that shows up on a user change page if the
# logged-in user can set the superuser status of the user.
SUPERUSER_SENTINEL = 'superuser'


@pytest.fixture
def initgroups(db):
    call_command('initgroups')


@pytest.fixture
def outreach_user(initgroups):
    user = UserFactory(
        username='outreacher',
        phone_number='1234567000',
        is_staff=True)
    group = Group.objects.get(name='Outreach Coordinators')
    user.groups.add(group)
    return user


@pytest.fixture
def outreach_client(outreach_user):
    client = Client()
    client.force_login(outreach_user)
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


def test_change_view_works_for_outreach(outreach_client):
    html = get_user_change_view_html(outreach_client)
    assert SUPERUSER_SENTINEL not in html

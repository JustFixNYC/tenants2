import pytest

from users.tests.factories import UserFactory
from airtable.record import Fields


@pytest.mark.django_db
def test_from_user_works_with_minimal_user():
    user = UserFactory(
        full_name='Bobby Denver'
    )
    fields = Fields.from_user(user)
    assert fields.pk == user.pk
    assert fields.first_name == 'Bobby'
    assert fields.last_name == 'Denver'
    assert fields.admin_url == f'https://example.com/admin/users/justfixuser/{user.pk}/change/'

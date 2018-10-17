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
    assert fields.Name == 'Bobby Denver'
    assert fields.AdminURL == f'https://example.com/admin/users/justfixuser/{user.pk}/change/'

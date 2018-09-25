from .factories import UserFactory


def test_list_view_works(admin_client):
    UserFactory(full_name='Blargy Blargface')
    res = admin_client.get('/admin/users/justfixuser/')
    assert res.status_code == 200
    assert b'Blargy' in res.content


def test_change_view_works(admin_client):
    user = UserFactory(full_name='Blargy Blargface')
    res = admin_client.get(f'/admin/users/justfixuser/{user.pk}/change/')
    assert res.status_code == 200
    assert b'Blargface' in res.content

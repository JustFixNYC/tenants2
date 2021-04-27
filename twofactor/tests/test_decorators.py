from django.http import HttpResponse
from django.urls import path
import pytest

from twofactor.decorators import twofactor_required
from twofactor.util import is_request_user_verified
from . import urls


@twofactor_required
def my_2fa_view(request):
    assert is_request_user_verified(request)
    return HttpResponse("hello verified user")


urlpatterns = [
    path("myview", my_2fa_view),
] + urls.urlpatterns


@pytest.mark.urls(__name__)
class TestTwofactorRequired:
    def test_it_redirects_to_verify_if_user_is_not_logged_in(self, client):
        res = client.get("/myview")
        assert res.status_code == 302
        assert res["location"] == "/verify?next=http%3A//testserver/myview"

    def test_it_redirects_to_verify_if_user_is_not_verified(self, admin_client):
        res = admin_client.get("/myview")
        assert res.status_code == 302
        assert res["location"] == "/verify?next=http%3A//testserver/myview"

    def test_it_renders_view_if_user_is_verified(self, admin_client):
        admin_client.post("/autoverify")
        res = admin_client.get("/myview")
        assert res.status_code == 200
        assert res.content == b"hello verified user"

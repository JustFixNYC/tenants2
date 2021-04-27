from django.http.response import HttpResponseBase
import pytest

from project import monkeypatch_django  # noqa


def test_it_rejects_invalid_samesite_values():
    res = HttpResponseBase()
    with pytest.raises(ValueError, match="samesite must be"):
        res.set_cookie("boop", "hi", samesite="BOOP")


@pytest.mark.parametrize("samesite", ["Lax", "None", "Strict"])
def test_it_accepts_valid_samesite_values(samesite):
    res = HttpResponseBase()
    res.set_cookie("boop", "hallo there", samesite=samesite)
    assert "hallo there" in str(res.cookies["boop"])
    assert res.cookies["boop"]["samesite"] == samesite

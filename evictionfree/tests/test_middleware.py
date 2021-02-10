import pytest


class TestUnsupportedLocaleMiddleware:
    @pytest.mark.parametrize(
        "accept_lang",
        [
            "en",
            "en, ht",
            "*",
            "??!@#",
        ],
    )
    def test_it_redirects_homepage_to_supported_locale(
        self, client, use_evictionfree_site, accept_lang
    ):
        res = client.get("/", HTTP_ACCEPT_LANGUAGE=accept_lang)
        assert res.status_code == 302
        assert res["Location"] == "/en/"

    @pytest.mark.parametrize(
        "accept_lang",
        [
            "ht",
            "ht, en",
        ],
    )
    def test_it_redirects_homepage_to_unsupported_locale(
        self, client, use_evictionfree_site, accept_lang
    ):
        res = client.get("/", HTTP_ACCEPT_LANGUAGE=accept_lang)
        assert res.status_code == 302
        assert res["Location"] == f"/unsupported-locale/ht"

    @pytest.mark.parametrize(
        "accept_lang",
        [
            "ht",
            "ht, en",
        ],
    )
    def test_it_ignores_unsupported_lang_for_non_efny_sites(self, client, db, accept_lang):
        res = client.get("/", HTTP_ACCEPT_LANGUAGE=accept_lang)
        assert res.status_code == 302
        assert res["Location"] == "/en/"

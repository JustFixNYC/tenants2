from io import StringIO
from django.core.management import call_command
import pytest

from project.util import site_util
from project.management.commands.healthcheck import (
    assert_equal,
    get_first_regex_match_group,
    get_base_mime_type,
    Command,
)


def test_get_base_mime_type_works():
    assert get_base_mime_type("text/html") == "text/html"
    assert get_base_mime_type("text/html; charset=utf-8") == "text/html"


def test_assert_equal_works():
    assert_equal(1, 1)
    with pytest.raises(AssertionError, match="1 != 2"):
        assert_equal(1, 2)


def test_get_first_regex_match_group_works():
    pattern = r"blarg (.*)!"
    assert get_first_regex_match_group(pattern, "blarg zz!") == "zz"
    with pytest.raises(AssertionError, match="Unable to find match for"):
        get_first_regex_match_group(pattern, "zzzz")


def test_it_prints_msg_on_failure(monkeypatch, db):
    out = StringIO()
    cmd = Command(stdout=out)

    class Kaboom(Exception):
        pass

    def fake_run_check():
        raise Kaboom()

    monkeypatch.setattr(cmd, "run_check", fake_run_check)

    with pytest.raises(Kaboom):
        cmd.handle()

    assert out.getvalue() == "Health check FAILED! Traceback follows.\n"


def test_it_works(live_server, monkeypatch, allow_lambda_http):
    urls = []

    def fake_absolutify_url(url, request):
        assert request is None
        urls.append(url)
        return live_server.url + url

    monkeypatch.setattr(site_util, "absolutify_url", fake_absolutify_url)
    out = StringIO()
    call_command("healthcheck", stdout=out)
    assert "Health check for example.com successful!" in out.getvalue()
    assert len(urls) > 0

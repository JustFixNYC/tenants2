import pytest

from project.util.site_util import get_default_site
from frontend.static_content import (
    get_language_from_url_or_default,
    render_raw_lambda_static_content,
)


@pytest.mark.parametrize(
    "url,locale",
    [
        ("/dev/stuff", "en"),
        ("/en/stuff", "en"),
        ("/es/stuff", "es"),
        ("/fr/stuff", "en"),
    ],
)
def test_get_language_from_url_or_default(url, locale, settings):
    settings.LANGUAGES = [
        ("en", "English"),
        ("es", "Spanish"),
    ]
    assert get_language_from_url_or_default(url) == locale


def test_render_raw_lambda_static_content_works(db, allow_lambda_http):
    lr = render_raw_lambda_static_content(
        "/dev/examples/static-page.pdf",
        site=get_default_site(),
    )
    assert lr is not None
    assert "<!DOCTYPE html>" in lr.html
    assert "This is an example static PDF page" in lr.html


def test_render_raw_lambda_static_content_returns_none_on_error(db, allow_lambda_http):
    lr = render_raw_lambda_static_content("/blarfle", site=get_default_site())
    assert lr is None

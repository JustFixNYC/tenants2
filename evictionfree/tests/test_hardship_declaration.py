import pytest

from evictionfree.hardship_declaration import get_pages, EXAMPLE_VARIABLES


@pytest.mark.parametrize("locale", ["en", "es"])
def test_get_pages_does_not_explode(locale):
    assert get_pages(EXAMPLE_VARIABLES, locale)

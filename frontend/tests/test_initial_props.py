from frontend.initial_props import (
    get_enabled_locales,
)


def test_get_enabled_locales_works():
    assert "en" in get_enabled_locales()

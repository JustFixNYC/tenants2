import pytest
from django.core.exceptions import ImproperlyConfigured

from project.util.settings_util import (
    ensure_dependent_settings_are_nonempty,
    parse_comma_separated_list,
    LazilyImportedFunction,
    change_db_url_to_postgis,
)


class TestEnsureDependentSettingsAreNonempty:
    def test_empty_first_setting_makes_others_irrelevant(self, settings):
        settings.FOO = ""
        settings.BAR = ""
        ensure_dependent_settings_are_nonempty("FOO", "BAR")

    def test_all_settings_nonempty_raises_no_errors(self, settings):
        settings.FOO = "foo"
        settings.BAR = "bar"
        ensure_dependent_settings_are_nonempty("FOO", "BAR")

    def test_partial_config_is_invalid(self, settings):
        settings.FOO = "foo"
        settings.BAR = ""

        with pytest.raises(ImproperlyConfigured, match="FOO is non-empty, but"):
            ensure_dependent_settings_are_nonempty("FOO", "BAR")


def example_lazy_func(a, b):
    return f"blorp a={a} b={b}"


def test_lazily_imported_function_works():
    lif = LazilyImportedFunction(f"{__name__}.example_lazy_func")
    assert lif(1, b=2) == "blorp a=1 b=2"
    assert lif(2, b=3) == "blorp a=2 b=3"


@pytest.mark.parametrize(
    "input,output",
    [
        ("foo", ["foo"]),
        ("foo, bar", ["foo", "bar"]),
        ("", []),
        (",,,,", []),
    ],
)
def test_parse_comma_separated_list_works(input, output):
    assert parse_comma_separated_list(input) == output


class TestChangeDbUrlToPostgis:
    def test_it_raises_error_on_unsupported_url_protocol(self):
        with pytest.raises(ValueError, match="Expected URL to start with"):
            change_db_url_to_postgis("sqlite://boop")

    def test_it_does_nothing_to_postgis_urls(self):
        assert change_db_url_to_postgis("postgis://boop") == "postgis://boop"

    def test_it_changes_postgres_urls(self):
        assert change_db_url_to_postgis("postgres://boop") == "postgis://boop"

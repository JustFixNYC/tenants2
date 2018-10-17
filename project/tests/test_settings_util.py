import pytest
from django.core.exceptions import ImproperlyConfigured

from project.util.settings_util import ensure_dependent_settings_are_nonempty


class TestEnsureDependentSettingsAreNonempty:
    def test_empty_first_setting_makes_others_irrelevant(self, settings):
        settings.FOO = ''
        settings.BAR = ''
        ensure_dependent_settings_are_nonempty('FOO', 'BAR')

    def test_all_settings_nonempty_raises_no_errors(self, settings):
        settings.FOO = 'foo'
        settings.BAR = 'bar'
        ensure_dependent_settings_are_nonempty('FOO', 'BAR')

    def test_partial_config_is_invalid(self, settings):
        settings.FOO = 'foo'
        settings.BAR = ''

        with pytest.raises(
            ImproperlyConfigured,
            match="FOO is non-empty, but"
        ):
            ensure_dependent_settings_are_nonempty('FOO', 'BAR')

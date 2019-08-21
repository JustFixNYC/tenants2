import pytest
from django.core.exceptions import ImproperlyConfigured

from project.util.settings_util import (
    parse_celery_broker_url,
    CelerySettings,
    ensure_dependent_settings_are_nonempty,
    LazilyImportedFunction
)


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


def example_lazy_func(a, b):
    return f'blorp a={a} b={b}'


def test_lazily_imported_function_works():
    lif = LazilyImportedFunction(f'{__name__}.example_lazy_func')
    assert lif(1, b=2) == 'blorp a=1 b=2'
    assert lif(2, b=3) == 'blorp a=2 b=3'


class TestParseCeleryBrokerUrl:
    def test_it_works_with_blank_url(self):
        assert parse_celery_broker_url('') == CelerySettings('', {})

    def test_it_works_with_nonblank_url(self):
        assert parse_celery_broker_url('amqp://') == CelerySettings('amqp://', {})

    def test_it_works_with_justfix_sqs_scheme(self):
        assert parse_celery_broker_url('justfix-sqs:///', 'key', 'secret') == CelerySettings(
            'sqs://key:secret@', {'queue_name_prefix': ''})

    def test_it_works_with_queue_name_prefix_querystring_arg(self):
        assert parse_celery_broker_url(
            'justfix-sqs:///?queue_name_prefix=boop', 'key', 'secret'
        ) == CelerySettings('sqs://key:secret@', {'queue_name_prefix': 'boop'})

    def test_it_uses_default_queue_name_prefix(self):
        assert parse_celery_broker_url(
            'justfix-sqs:///', 'key', 'secret', 'flarg'
        ) == CelerySettings('sqs://key:secret@', {'queue_name_prefix': 'flarg'})

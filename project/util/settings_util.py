from typing import Optional, Callable
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.module_loading import import_string


def parse_secure_proxy_ssl_header(field):
    '''
    Parse an environment variable that specifies our
    secure proxy SSL header, e.g.:

        >>> parse_secure_proxy_ssl_header('X-Forwarded-Proto: https')
        ('HTTP_X_FORWARDED_PROTO', 'https')
    '''

    name, value = field.split(':')
    return ('HTTP_%s' % name.upper().replace('-', '_'), value.strip())


def ensure_dependent_settings_are_nonempty(setting: str, *dependent_settings: str):
    '''
    If the first Django setting with the given name is truthy, make sure
    the rest of the settings are truthy too.
    '''

    if not getattr(settings, setting):
        return

    for dependent_setting in dependent_settings:
        if not getattr(settings, dependent_setting):
            raise ImproperlyConfigured(
                f"{setting} is non-empty, but {dependent_setting} is empty!"
            )


class LazilyImportedFunction:
    '''
    A class that can be used to import a function lazily,
    which can be useful in working around circular
    dependency issues in settings.py.
    '''

    def __init__(self, dotted_path: str) -> None:
        self.dotted_path = dotted_path
        self.func: Optional[Callable] = None

    def __call__(self, *args, **kwargs):
        self.__call__ = import_string(self.dotted_path)  # type: ignore
        return self.__call__(*args, **kwargs)

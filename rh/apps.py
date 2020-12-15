from django.apps import AppConfig


class RhConfig(AppConfig):
    name = "rh"

    def ready(self):
        from . import signals  # noqa

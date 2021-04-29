from django.apps import AppConfig


class AmplitudeConfig(AppConfig):
    name = "amplitude"

    def ready(self):
        from .util import get_url_for_user_page

        # This will raise ImproperlyConfigured if anything is amiss.
        get_url_for_user_page(1)

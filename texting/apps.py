from django.apps import AppConfig


class TextingConfig(AppConfig):
    name = "texting"

    def ready(self):
        from . import twilio

        twilio.validate_settings()

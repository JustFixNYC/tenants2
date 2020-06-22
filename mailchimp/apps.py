from django.apps import AppConfig


class MailchimpConfig(AppConfig):
    name = 'mailchimp'

    def ready(self):
        from .mailchimp import validate_settings

        validate_settings()

from django.apps import AppConfig
from django.db.models.signals import post_migrate

from .post_migration import create_default_docusign_config


class DocusignConfig(AppConfig):
    name = "docusign"

    def ready(self):
        post_migrate.connect(create_default_docusign_config, sender=self)

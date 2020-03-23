from django.apps import AppConfig
from django.db.models.signals import post_migrate

from .docusign_management import create_default_docusign_config


class HPActionConfig(AppConfig):
    name = 'hpaction'

    verbose_name = 'HP Action'

    def ready(self):
        post_migrate.connect(create_default_docusign_config, sender=self)

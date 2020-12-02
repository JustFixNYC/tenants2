"""
Creates the default HP Action Config object.

This code is based on the default Site object creation code:

  https://github.com/django/django/blob/master/django/contrib/sites/management.py
"""

from django.apps import apps as global_apps
from django.db import DEFAULT_DB_ALIAS, router


def create_default_hpaction_config(
    app_config, verbosity=2, interactive=True, using=DEFAULT_DB_ALIAS, apps=global_apps, **kwargs
):
    try:
        Config = apps.get_model("hpaction", "Config")
    except LookupError:
        return

    if not router.allow_migrate_model(using, Config):
        return

    if not Config.objects.using(using).exists():
        # The default settings set SITE_ID = 1, and some tests in Django's test
        # suite rely on this value. However, if database sequences are reused
        # (e.g. in the test suite after flush/syncdb), it isn't guaranteed that
        # the next id will be 1, so we coerce it. See #15573 and #16353. This
        # can also crop up outside of tests - see #15346.
        if verbosity >= 2:
            print("Creating default HP Action Config object")
        Config().save(using=using)

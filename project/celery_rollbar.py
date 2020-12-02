from django.conf import settings
import rollbar


def init():
    if settings.ROLLBAR is not None:
        print("Configuring Rollbar for Celery.")

        rollbar.init(**settings.ROLLBAR, handler="blocking")

        def celery_base_data_hook(request, data):
            data["framework"] = "celery"

        rollbar.BASE_DATA_HOOK = celery_base_data_hook


def report_exc_info(**kwargs):
    if settings.ROLLBAR is not None:
        rollbar.report_exc_info(extra_data=kwargs)

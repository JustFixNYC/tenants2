import os
from celery import Celery
from celery.signals import worker_init, task_failure


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")

app = Celery("project")

app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@worker_init.connect
def init_rollbar(*args, **kwargs):
    from . import celery_rollbar

    celery_rollbar.init()


@task_failure.connect
def handle_task_failure(**kwargs):
    from . import celery_rollbar

    celery_rollbar.report_exc_info()


@app.task(bind=True)
def debug_task(self):
    print("Request: {0!r}".format(self.request))

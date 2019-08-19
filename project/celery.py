import os
import rollbar
from celery import Celery
from celery.signals import worker_init, task_failure


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

app = Celery('project')

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


@worker_init.connect
def init_rollbar(*args, **kwargs):
    from django.conf import settings

    if settings.ROLLBAR is None:
        return

    print("Configuring Rollbar for Celery.")

    rollbar.init(**settings.ROLLBAR, handler='blocking')

    def celery_base_data_hook(request, data):
        data['framework'] = 'celery'

    rollbar.BASE_DATA_HOOK = celery_base_data_hook


@task_failure.connect
def handle_task_failure(**kwargs):
    from django.conf import settings

    if settings.ROLLBAR is None:
        return

    rollbar.report_exc_info(extra_data=kwargs)


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))

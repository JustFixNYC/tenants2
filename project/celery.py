import os
from celery import Celery, shared_task

from project import slack


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

app = Celery('project')

app.config_from_object('django.conf:settings', namespace='CELERY')


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))


shared_task(ignore_result=True)(slack.sendmsg)

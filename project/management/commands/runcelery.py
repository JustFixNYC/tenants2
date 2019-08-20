# https://avilpage.com/2017/05/how-to-auto-reload-celery-workers-in-development.html

import shlex
import subprocess
from django.core.management.base import BaseCommand
from django.utils import autoreload
from django.conf import settings

import project


def restart_celery():
    cmd = 'pkill -9 celery'
    subprocess.call(shlex.split(cmd))
    cmd = f'celery worker -l info -A {project.__name__}'
    subprocess.call(shlex.split(cmd))


class Command(BaseCommand):
    def handle(self, *args, **options):
        if not settings.CELERY_BROKER_URL:
            print('Celery is disabled, exiting.')
            return
        print('Starting celery worker with autoreload...')
        autoreload.run_with_reloader(restart_celery)

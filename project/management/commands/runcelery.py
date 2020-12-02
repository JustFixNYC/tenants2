# https://avilpage.com/2017/05/how-to-auto-reload-celery-workers-in-development.html

import shlex
import subprocess
from django.core.management.base import BaseCommand
from django.utils import autoreload

import project


def restart_celery():
    cmd = "pkill -9 celery"
    subprocess.call(shlex.split(cmd))
    cmd = f"celery worker -l info --quiet -A {project.__name__} --without-heartbeat"
    subprocess.call(shlex.split(cmd))


class Command(BaseCommand):
    def handle(self, *args, **options):
        print("Starting celery worker with autoreload...")
        autoreload.run_with_reloader(restart_celery)

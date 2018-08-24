import os
import sys
import subprocess
from typing import Dict
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Run the server in production mode.'

    def handle(self, *args, **options):
        env: Dict[str, str] = {}
        env.update(os.environ)
        env.update({
            'NODE_ENV': 'production',
            'DEBUG': 'false',
            'USE_DEVELOPMENT_DEFAULTS': 'true'
        })
        subprocess.check_call([
            'npm', 'run', 'postinstall'], env=env, shell=True)
        subprocess.check_call([
            sys.executable, 'manage.py', 'collectstatic', '--no-input', '--clear'], env=env)
        subprocess.check_call([
            sys.executable, 'manage.py', 'runserver'], env=env)

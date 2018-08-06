import subprocess

from ..justfix_environment import BASE_DIR


def test_mypy():
    subprocess.check_call(['mypy', '.'], cwd=BASE_DIR)


def test_flake8():
    subprocess.check_call(['flake8'], cwd=BASE_DIR)

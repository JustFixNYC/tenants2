import subprocess


def test_mypy():
    subprocess.check_call(['mypy', '.'])

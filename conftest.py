from pathlib import Path
import subprocess
import pytest


BASE_DIR = Path(__file__).parent.resolve()

STATICFILES_DIR = BASE_DIR / 'staticfiles'


@pytest.fixture(scope="session")
def staticfiles() -> Path:
    '''
    This test fixture ensures that 'manage.py collectstatic' has been run
    by the time the test using it executes. It returns the location of
    the staticfiles directory (which should be the same as
    settings.STATIC_ROOT).
    '''

    subprocess.check_call([
        'python', 'manage.py', 'collectstatic', '--noinput'
    ], cwd=BASE_DIR)
    assert STATICFILES_DIR.exists()
    return STATICFILES_DIR

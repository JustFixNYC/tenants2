import os
from pathlib import Path
import dotenv

from .util import typed_environ


BASE_DIR = Path(__file__).parent.parent.resolve()

IS_RUNNING_TESTS = False


class JustfixEnvironment(typed_environ.BaseEnvironment):
    '''
    Our base environment variables.
    '''

    # This is the URL to the database, as per dj-database-url:
    #
    #   https://github.com/kennethreitz/dj-database-url#url-schema
    DATABASE_URL: str

    # This is a large random value corresponding to Django's
    # SECRET_KEY setting.
    SECRET_KEY: str

    # This indicates whether debugging is enabled (this should always
    # be false in production).
    DEBUG: bool = False


class JustfixDebugEnvironment(JustfixEnvironment):
    '''
    These are the environment defaults when DEBUG is set.
    '''

    DEBUG = True

    SECRET_KEY = 'for development only!'

    DATABASE_URL = f"sqlite:///{BASE_DIR / 'db.sqlite3'}"


class JustfixTestingEnvironment(JustfixEnvironment):
    '''
    These are the environment defaults when tests are being run.
    '''

    DEBUG = False

    SECRET_KEY = 'for testing only!'

    DATABASE_URL = f"sqlite:///{BASE_DIR / 'db.testing.sqlite3'}"


def get() -> JustfixEnvironment:
    dotenv.load_dotenv(BASE_DIR / '.justfix-env')
    if IS_RUNNING_TESTS:
        return JustfixTestingEnvironment(exit_when_invalid=True)
    is_debug = typed_environ.Converters.convert_bool(
        os.environ.get('DEBUG', 'no'))
    if is_debug:
        return JustfixDebugEnvironment(exit_when_invalid=True)
    return JustfixEnvironment(exit_when_invalid=True)

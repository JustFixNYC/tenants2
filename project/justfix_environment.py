import os
from pathlib import Path
import dotenv

from .util import typed_environ


BASE_DIR = Path(__file__).parent.parent.resolve()


class JustfixEnvironment(typed_environ.BaseEnvironment):
    '''
    Our base environment variables.
    '''

    # The URL to the database, as per dj-database-url:
    # https://github.com/kennethreitz/dj-database-url#url-schema
    DATABASE_URL: str

    # SECURITY WARNING: keep the secret key used in production secret!
    SECRET_KEY: str

    # SECURITY WARNING: don't run with debug turned on in production!
    DEBUG: bool = False


class JustfixDebugEnvironment(JustfixEnvironment):
    '''
    These are the environment defaults when DEBUG is set.
    '''

    DEBUG = True

    SECRET_KEY = 'for development/testing only!'

    DATABASE_URL = f"sqlite:///{BASE_DIR / 'db.sqlite3'}"


def get() -> JustfixEnvironment:
    dotenv.load_dotenv(BASE_DIR / '.env')
    is_debug = typed_environ.Converters.convert_bool(
        os.environ.get('DEBUG', 'no'))
    if is_debug:
        return JustfixDebugEnvironment()
    return JustfixEnvironment()

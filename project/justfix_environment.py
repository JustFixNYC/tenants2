from pathlib import Path
from typing import Type

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

    # This is only useful when DEBUG is False. If it is True, it
    # applies all development defaults. Useful for testing
    # production-like setups in a jiffy.
    USE_DEVELOPMENT_DEFAULTS: bool = False


class JustfixDevelopmentDefaults(JustfixEnvironment):
    '''
    Reasonable defaults for developing the project.
    '''

    SECRET_KEY = 'for development only!'

    DATABASE_URL = f"sqlite:///{BASE_DIR / 'db.sqlite3'}"


class JustfixDebugEnvironment(JustfixDevelopmentDefaults):
    '''
    These are the environment defaults when DEBUG is set.
    '''

    DEBUG = True


class JustfixTestingEnvironment(JustfixEnvironment):
    '''
    These are the environment defaults when tests are being run.
    '''

    DEBUG = False

    SECRET_KEY = 'for testing only!'

    DATABASE_URL = f"sqlite:///{BASE_DIR / 'db.testing.sqlite3'}"


def get() -> JustfixEnvironment:
    try:
        import dotenv
        dotenv.load_dotenv(BASE_DIR / '.justfix-env')
    except ModuleNotFoundError:
        # dotenv is a dev dependency, so no biggie if it can't be found.
        pass

    env_class: Type[JustfixEnvironment] = JustfixEnvironment

    if IS_RUNNING_TESTS:
        env_class = JustfixTestingEnvironment
    else:
        env = JustfixEnvironment(throw_when_invalid=False)
        if env.DEBUG:
            env_class = JustfixDebugEnvironment
        elif env.USE_DEVELOPMENT_DEFAULTS:
            env_class = JustfixDevelopmentDefaults

    return env_class(exit_when_invalid=True)

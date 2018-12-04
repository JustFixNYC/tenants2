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

    # The NYC-DB database URL. If empty, NYCDB integration will be
    # disabled. For more details on NYCDB, see:
    #
    #   https://github.com/aepyornis/nyc-db
    NYCDB_DATABASE_URL: str = ''

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

    # This is the URL to the MongoDB instance of the legacy
    # tenants app, e.g. "mongodb://localhost:27017/somedb". If undefined,
    # connectivity to the legacy tenants app will be disabled.
    LEGACY_MONGODB_URL: str = ''

    # This is the URL for the origin of the legacy tenants app,
    # e.g. "https://beta.justfix.nyc".
    LEGACY_ORIGIN: str = 'https://beta.justfix.nyc'

    # This is an optional HTTP request header field name and
    # value indicating that the request is actually secure.
    # For example, Heroku deployments should set this to
    # "X-Forwarded-Proto: https".
    SECURE_PROXY_SSL_HEADER: str = ''

    # If true, redirects all non-HTTPS requests to HTTPS.
    SECURE_SSL_REDIRECT: bool = True

    # If set to a non-zero integer value, sets the HTTP
    # Strict Transport Security (HSTS) header on all
    # responses that do not already have it.
    SECURE_HSTS_SECONDS: int = 0

    # The Google Analytics Tracking ID for the app.
    # If empty (the default), Google Analytics is disabled.
    GA_TRACKING_ID: str = ''

    # The Facebook Pixel ID for the app.
    # If empty (the default), Facebook Pixel is disabled.
    FACEBOOK_PIXEL_ID: str = ''

    # An access token for Rollbar with the 'post_client_item'
    # scope. If empty (the default), Rollbar is disabled on
    # the client-side.
    ROLLBAR_ACCESS_TOKEN: str = ''

    # An access token for Rollbar with the 'post_server_item'
    # scope. If empty (the default), Rollbar is disabled on
    # the server-side.
    ROLLBAR_SERVER_ACCESS_TOKEN: str = ''

    # The Twilio account SID used to send text messages. If
    # empty, text message integration will be disabled.
    TWILIO_ACCOUNT_SID: str = ''

    # The Twilio auth token. If TWILIO_ACCOUNT_SID is
    # specified, this must also be specified.
    TWILIO_AUTH_TOKEN: str = ''

    # The 10-digit U.S. phone number to send Twilio messages from,
    # e.g. "5551234567". If TWILIO_ACCOUNT_SID is
    # specified, this must also be specified.
    TWILIO_PHONE_NUMBER: str = ''

    # This is the URL of a Slack incoming webhook that will be
    # sent messages whenever certain kinds of events occur in
    # the app. If blank (the default), Slack integration is
    # disabled.
    SLACK_WEBHOOK_URL: str = ''

    # An Airtable API key. If empty, Airtable integration
    # will be disabled.
    AIRTABLE_API_KEY: str = ''

    # The base URL for an Airtable table API endpoint, e.g.
    # "https://api.airtable.com/v0/appEH2XUPhLwkrS66/Users".
    # If AIRTABLE_API_KEY is specified, this must also
    # be specified.
    AIRTABLE_URL: str = ''

    # An Amazon Web Services access key. If provided, S3 will
    # be used as the default Django file storage backend.
    AWS_ACCESS_KEY_ID: str = ''

    # An Amazon Web Services secret access key.
    # If AWS_ACCESS_KEY_ID is specified, this must be specified too.
    AWS_SECRET_ACCESS_KEY: str = ''

    # The Amazon Web Services bucket name to store non-public files in.
    # If AWS_ACCESS_KEY_ID is specified, this must be specified too.
    AWS_STORAGE_BUCKET_NAME: str = ''

    # The Amazon Web Services bucket name to store public static files in
    # (e.g. JavaScript, CSS, and images). If this is empty, then the app
    # will host static files itself. However, if this isn't empty,
    # AWS_ACCESS_KEY_ID (and all its dependencies) will also need to
    # be specified.
    AWS_STORAGE_STATICFILES_BUCKET_NAME: str = ''

    # The default log level. Can be one of DEBUG, INFO, WARNING,
    # ERROR, or CRITICAL.
    LOG_LEVEL: str = 'INFO'

    # The API endpoint for the HP Action SOAP endpoint.
    HP_ACTION_API_ENDPOINT: str = (
        'https://lhiutility.lawhelpinteractive.org/LHIIntegration/LHIIntegration.svc'
    )

    # The HotDocs template ID to pass to the HP Action SOAP endpoint,
    # e.g. "5395".
    HP_ACTION_TEMPLATE_ID: str = '6590'

    # The customer key to pass to the HP Action SOAP endpoint. If
    # not provided, HP Action submission will fail.
    HP_ACTION_CUSTOMER_KEY: str = ''


class JustfixDevelopmentDefaults(JustfixEnvironment):
    '''
    Reasonable defaults for developing the project.
    '''

    SECRET_KEY = 'for development only!'

    DATABASE_URL = f"sqlite:///{BASE_DIR / 'db.sqlite3'}"

    SECURE_SSL_REDIRECT = False


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

    SECURE_SSL_REDIRECT = False


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

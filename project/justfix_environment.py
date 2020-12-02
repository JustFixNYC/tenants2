import os
from pathlib import Path
from typing import Type

from .util import typed_environ
from docker_django_management import get_management_command, BUILD_PIPELINE_MANAGEMENT_CMDS


BASE_DIR = Path(__file__).parent.parent.resolve()

IS_RUNNING_TESTS = False


class JustfixEnvironment(typed_environ.BaseEnvironment):
    """
    Our base environment variables.
    """

    # This is the URL to the database, as per dj-database-url:
    #
    #   https://github.com/kennethreitz/dj-database-url#url-schema
    #
    # Note that only Postgres/PostGIS are officially supported
    # by this project.
    DATABASE_URL: str

    # The NYC-DB database URL. If empty, NYCDB integration will be
    # disabled. For more details on NYCDB, see:
    #
    #   https://github.com/aepyornis/nyc-db
    NYCDB_DATABASE_URL: str = ""

    # The Who Owns What (WOW) database URL. If empty, WOW integration will be
    # disabled. For more details on WOW, see:
    #
    #   https://github.com/JustFixNYC/who-owns-what
    WOW_DATABASE_URL: str = ""

    # The Celery broker URL, e.g. 'amqp://'. If not provided, Celery integration
    # will be disabled.
    #
    # Note that we're prefixing this with "JUSTFIX_" because "CELERY_BROKER_URL"
    # is actually a Celery-specific environment variable that will be
    # interpreted by Celery; because we want to be able to override the value
    # for tests and so forth, we don't want Celery to interpret this environment
    # variable directly, hence the namespacing.
    JUSTFIX_CELERY_BROKER_URL: str = ""

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

    # This is an optional HTTP request header field name and
    # value indicating that the request is actually secure.
    # For example, Heroku deployments should set this to
    # "X-Forwarded-Proto: https".
    SECURE_PROXY_SSL_HEADER: str = ""

    # If true, redirects all non-HTTPS requests to HTTPS.
    SECURE_SSL_REDIRECT: bool = True

    # Whether to use a secure cookie for the session cookie.
    # If this is set to true, the cookie will be marked as
    # "secure", which means browsers may ensure that the
    # cookie is only sent under an HTTPS connection.
    SESSION_COOKIE_SECURE: bool = True

    # Whether to use a secure cookie for the CSRF cookie.
    # If this is set to true, the cookie will be marked as
    # "secure", which means browsers may ensure that the
    # cookie is only sent with an HTTPS connection.
    CSRF_COOKIE_SECURE: bool = True

    # If set to a non-zero integer value, sets the HTTP
    # Strict Transport Security (HSTS) header on all
    # responses that do not already have it.
    SECURE_HSTS_SECONDS: int = 0

    # The Google Analytics Tracking ID for the app.
    # If empty (the default), Google Analytics is disabled.
    GA_TRACKING_ID: str = ""

    # The Google Tag Manager Container ID for the app.
    # If empty (the default), Google Tag Manager is disabled.
    GTM_CONTAINER_ID: str = ""

    # The Facebook Pixel ID for the app.
    # If empty (the default), Facebook Pixel is disabled.
    FACEBOOK_PIXEL_ID: str = ""

    # The Facebook App ID for the an associated organization's Facebook page.
    # If empty (the default), there will be no reference to a Facebook App ID
    # in the header metatags for the site.
    FACEBOOK_APP_ID: str = ""

    # The Amplitude API key. If empty (the default), Amplitude integration
    # will be disabled.
    AMPLITUDE_API_KEY: str = ""

    # An access token for Rollbar with the 'post_client_item'
    # scope. If empty (the default), Rollbar is disabled on
    # the client-side.
    ROLLBAR_ACCESS_TOKEN: str = ""

    # An access token for Rollbar with the 'post_server_item'
    # scope. If empty (the default), Rollbar is disabled on
    # the server-side.
    ROLLBAR_SERVER_ACCESS_TOKEN: str = ""

    # The Twilio account SID used to send text messages. If
    # empty, text message integration will be disabled.
    TWILIO_ACCOUNT_SID: str = ""

    # The Twilio auth token. If TWILIO_ACCOUNT_SID is
    # specified, this must also be specified.
    TWILIO_AUTH_TOKEN: str = ""

    # The 10-digit U.S. phone number to send Twilio messages from,
    # e.g. "5551234567". If TWILIO_ACCOUNT_SID is
    # specified, this must also be specified.
    TWILIO_PHONE_NUMBER: str = ""

    # This is the URL of a Slack incoming webhook that will be
    # sent messages whenever certain kinds of events occur in
    # the app. If blank (the default), Slack integration is
    # disabled.
    SLACK_WEBHOOK_URL: str = ""

    # An Airtable API key. If empty, Airtable integration
    # will be disabled.
    AIRTABLE_API_KEY: str = ""

    # The base URL for an Airtable table API endpoint to sync users, e.g.
    # "https://api.airtable.com/v0/appEH2XUPhLwkrS66/Users".
    # If this is specified, AIRTABLE_API_KEY must also
    # be specified.
    AIRTABLE_URL: str = ""

    # An Amazon Web Services access key. If provided, S3 will
    # be used as the default Django file storage backend.
    AWS_ACCESS_KEY_ID: str = ""

    # An Amazon Web Services secret access key.
    # If AWS_ACCESS_KEY_ID is specified, this must be specified too.
    AWS_SECRET_ACCESS_KEY: str = ""

    # The Amazon Web Services bucket name to store non-public files in.
    # If AWS_ACCESS_KEY_ID is specified, this must be specified too.
    AWS_STORAGE_BUCKET_NAME: str = ""

    # The Amazon Web Services bucket name to store public static files in
    # (e.g. JavaScript, CSS, and images). If this is empty, then the app
    # will host static files itself. However, if this isn't empty,
    # AWS_ACCESS_KEY_ID (and all its dependencies) will also need to
    # be specified.
    AWS_STORAGE_STATICFILES_BUCKET_NAME: str = ""

    # The default log level. Can be one of DEBUG, INFO, WARNING,
    # ERROR, or CRITICAL.
    LOG_LEVEL: str = "INFO"

    # The API endpoint for the HP Action SOAP endpoint.
    HP_ACTION_API_ENDPOINT: str = (
        "https://lhiutility.lawhelpinteractive.org/LHIIntegration/LHIIntegration.svc"
    )

    # The HotDocs template ID to pass to the HP Action SOAP endpoint,
    # e.g. "5395".
    HP_ACTION_TEMPLATE_ID: str = "7141"

    # The customer key to pass to the HP Action SOAP endpoint. If
    # not provided, HP Action submission will fail.
    HP_ACTION_CUSTOMER_KEY: str = ""

    # How long two-factor authentication (2FA) verification lasts,
    # in seconds. Once this amount of time has passed, the user
    # will need to re-verify via their 2FA device (they will
    # not necessarily need to re-authenticate with their
    # password, though). If this is zero or a negative number,
    # 2FA will be disabled.
    TWOFACTOR_VERIFY_DURATION: int = 60 * 60 * 24

    # Whether or not to enable the findhelp app, also known as
    # the Tenant Assistance Directory. This requires that the
    # default database be PostGIS, and that GeoDjango's requisite
    # geospatial libraries are installed.
    ENABLE_FINDHELP: bool = False

    # A Mapbox public access token for embedded maps and/or geocoding. If
    # not provided, mapbox integration will be disabled.
    MAPBOX_ACCESS_TOKEN: str = ""

    # The RapidPro API token to use. If not provided, RapidPro
    # integration is disabled.
    RAPIDPRO_API_TOKEN: str = ""

    # The hostname of the RapidPro server to access.
    RAPIDPRO_HOSTNAME: str = "api.textit.in"

    # An optional URL for the data warehouse database, used for
    # storing analytics obtained via ETL.  If empty, the default
    # database will be used.
    DWH_DATABASE_URL: str = ""

    # Your secret Lob API key. Leaving this empty disables the sending
    # of letters via Lob. You can get this key from
    # https://dashboard.lob.com/#/settings/keys.
    LOB_SECRET_API_KEY: str = ""

    # Your publishable Lob API key. Leaving this empty disables
    # address verification via Lob.
    LOB_PUBLISHABLE_API_KEY: str = ""

    # A directory containing CSV/JSON files corresponding to the
    # various data downloads available through the admin UI, which
    # will override the "live" feeds provided by the server. This
    # can be used e.g. to generate the dashboard visualizations
    # based on different (or even production) data without having
    # to manually construct the underlying database models.
    #
    # This feature is only enabled if it's non-empty and DEBUG
    # is also True.
    DEBUG_DATA_DIR: str = str(BASE_DIR / "debug-data")

    # Your FullStory Org ID. Leaving this empty disables
    # FullStory integration.
    #
    # This can be found in FullStory's `Settings > FullStory Setup`
    # tab.  Look for the value found on this line:
    #
    #   `window['_fs_org'] = 'ABC'`.
    FULLSTORY_ORG_ID: str = ""

    # Whether or not to disable source maps in development mode.
    #
    # Setting this to true can speed up builds.
    DISABLE_DEV_SOURCE_MAPS: bool = False

    # The value of the 'extended' querystring argument on the /health
    # endpoint that will trigger an extended healthcheck. Because an
    # extended healthcheck can consume valuable resources, this can
    # be set to a secret value to deter DoS attacks.
    EXTENDED_HEALTHCHECK_KEY: str = "on"

    # This is the URL for the service to use when sending email, as
    # per the dj-email-url schema:
    #
    #   https://github.com/migonzalvar/dj-email-url#supported-backends
    #
    # When DEBUG is true, this defaults to `console:`. If it is set to
    # `dummy:` then no emails will be sent and messages about email
    # notifications will not be shown to users. The setting can be
    # manually tested via the manage.py `sendtestemail` command.
    EMAIL_URL: str = "dummy:"

    # Default email address to use for various automated correspondence
    # from the site manager(s).
    DEFAULT_FROM_EMAIL = "JustFix.nyc no-reply <no-reply@justfix.nyc>"

    # The email address used for court documents (e.g. HP Actions).
    COURT_DOCUMENTS_EMAIL: str = "JustFix.nyc <documents@justfix.nyc>"

    # The email address used for LOC notifications. If blank (the default),
    # no LOC notifications will be sent.
    LOC_EMAIL: str = ""

    # Sender email address used to send a user's rental history request.
    DHCR_EMAIL_SENDER_ADDRESS: str = "support@justfix.nyc"

    # Recipient email addresses that we send a user's rental history request to.
    DHCR_EMAIL_RECIPIENT_ADDRESSES: str = "rentinfo@nyshcr.org"

    # An optional label to show in the site's navbar and other communications,
    # next to "JustFix.nyc". This can be useful to e.g. distinguish a production
    # deployment from a staging one.
    NAVBAR_LABEL: str = ""

    # The base url for outbound links to Who Owns What.
    WOW_ORIGIN: str = "https://whoownswhat.justfix.nyc"

    # The base url for outbound links to Eviction Free NYC.
    EFNYC_ORIGIN: str = "https://www.evictionfreenyc.org"

    # Whether to use the experimental lambda HTTP server.
    USE_LAMBDA_HTTP_SERVER: bool = False

    # The RapidPro group name and date field key, separated by a comma, that
    # trigger the follow-up campaign for rent history. If empty, this follow-up
    # campaign will be disabled.
    RAPIDPRO_FOLLOWUP_CAMPAIGN_RH: str = ""

    # The RapidPro group name and date field key, separated by a comma, that
    # trigger the follow-up campaign for letter of complaint. If empty, this follow-up
    # campaign will be disabled.
    RAPIDPRO_FOLLOWUP_CAMPAIGN_LOC: str = ""

    # The RapidPro group name and date field key, separated by a comma, that
    # trigger the follow-up campaign for HP Action. If empty, this follow-up
    # campaign will be disabled.
    RAPIDPRO_FOLLOWUP_CAMPAIGN_HP: str = ""

    # The RapidPro group name and date field key, separated by a comma, that
    # trigger the follow-up campaign for Emergency HP Action. If empty, this
    # follow-up campaign will be disabled.
    RAPIDPRO_FOLLOWUP_CAMPAIGN_EHP: str = ""

    # The DocuSign account ID to use. Leaving this empty disables DocuSign
    # integration.
    DOCUSIGN_ACCOUNT_ID: str = ""

    # The DocuSign integration key to use. Required if DocuSign integration is
    # enabled.
    DOCUSIGN_INTEGRATION_KEY: str = ""

    # The DocuSign user ID of the user to impersonate. Required if DocuSign
    # integration is enabled.
    DOCUSIGN_USER_ID: str = ""

    # The domain of the DocuSign authentication server. Note that this default
    # is the *development* auth server, so you will want to set this to
    # a production domain on live production (non-staging) systems.
    DOCUSIGN_AUTH_SERVER_DOMAIN: str = "account-d.docusign.com"

    # Whether or not the Emergency HP Action (COVID-19) is enabled and
    # prioritized over normal HP Actions. Note that this also requires
    # DocuSign integration to be working properly!
    ENABLE_EMERGENCY_HP_ACTION: bool = False

    # Whether or not this deployment represents a "demo site" that is
    # intended for training or review purposes. This controls whether
    # certain actions, such as emailing a landlord a notice, will
    # actually be taken. It also controls whether certain notices
    # will appear on the site to inform users of any demo-specific
    # behavior.
    IS_DEMO_DEPLOYMENT: bool = False

    # Whether or not to enable localizations that are still
    # works-in-progress (WIPs), i.e. only partially localized.
    ENABLE_WIP_LOCALES: bool = False

    # A comma-separated list of hostname redirects. Each redirect
    # is of the form "<src> to <dest>", where src is the hostname to redirect
    # from, and where dest is the hostname to redirect to.  If any requests
    # ever come in on one of the src hostnames, they will automatically
    # be redirected to the corresponding dest hostname. For
    # example, 'foo.com to bar.com' will result in all requests
    # to foo.com being redirected to bar.com.
    HOSTNAME_REDIRECTS: str = ""

    # The Mailchimp API key. If blank, Mailchimp integration will
    # be disabled.
    MAILCHIMP_API_KEY: str = ""

    # The Mailchimp list ID. Required for Mailchimp integration.
    MAILCHIMP_LIST_ID: str = ""

    # Comma-separated list of HTTP origins that can access our
    # Mailchimp subscription endpoint. It can also be '*', in
    # which case any website can use the endpoint.
    MAILCHIMP_CORS_ORIGINS: str = ""

    # The auth secret used by Front's Plugin API. If empty,
    # Front integration will be disabled.
    FRONTAPP_PLUGIN_AUTH_SECRET: str = ""


class JustfixBuildPipelineDefaults(JustfixEnvironment):
    """
    Defaults when running management commands that are part
    of our static asset/i18n build pipeline. These commands
    don't need to use the secret key or the database so it's fine
    for us to set them to arbitrary defaults.
    """

    SECRET_KEY = "for development and build pipeline commands only!"

    DATABASE_URL = "postgres://it-does-not/matter"


class JustfixDevelopmentDefaults(JustfixEnvironment):
    """
    Reasonable defaults for developing the project.
    """

    SECRET_KEY = "for development only!"

    SECURE_SSL_REDIRECT = False

    SESSION_COOKIE_SECURE = False

    CSRF_COOKIE_SECURE = False


class JustfixDebugEnvironment(JustfixDevelopmentDefaults):
    """
    These are the environment defaults when DEBUG is set.
    """

    DEBUG = True

    EMAIL_URL = "console:"

    NAVBAR_LABEL = "LOCAL DEV"


class JustfixTestingEnvironment(JustfixEnvironment):
    """
    These are the environment defaults when tests are being run.
    """

    DEBUG = False

    SECRET_KEY = "for testing only!"

    SECURE_SSL_REDIRECT = False

    SESSION_COOKIE_SECURE = False

    CSRF_COOKIE_SECURE = False


def get() -> JustfixEnvironment:
    try:
        import dotenv

        if os.environ.get("IGNORE_JUSTFIX_ENV_FILE") != "1":
            dotenv.load_dotenv(BASE_DIR / ".justfix-env")
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
        elif get_management_command() in BUILD_PIPELINE_MANAGEMENT_CMDS:
            env_class = JustfixBuildPipelineDefaults

    return env_class(exit_when_invalid=True)

import dj_email_url
from . import justfix_environment, locales  # noqa

justfix_environment.IS_RUNNING_TESTS = True

from .settings import *  # noqa

HOSTNAME_REDIRECTS = {}

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Only support our fully-supported languages by default.
LANGUAGES = locales.FULLY_SUPPORTED_ONLY.choices  # noqa

# Disable 2FA by default.
TWOFACTOR_VERIFY_DURATION = 0

# Disable Twilio by default.
TWILIO_ACCOUNT_SID = ""
TWILIO_AUTH_TOKEN = ""
TWILIO_PHONE_NUMBER = ""

# Disable a bunch of third-party integrations by default.
GEOCODING_SEARCH_URL = ""
CONTENTFUL_SPACE_ID = ""
CONTENTFUL_ACCESS_TOKEN = ""
AIRTABLE_API_KEY = ""
AIRTABLE_URL = ""
SLACK_WEBHOOK_URL = ""
GA_TRACKING_ID = ""
GTM_CONTAINER_ID = ""
FACEBOOK_PIXEL_ID = ""
FACEBOOK_APP_ID = ""
AMPLITUDE_API_KEY = ""
AMPLITUDE_PROJECT_SETTINGS_URL = ""
ROLLBAR_ACCESS_TOKEN = ""
MAPBOX_ACCESS_TOKEN = ""
DASHBOARD_DB_ALIAS = None
NYCDB_DATABASE = None
WOW_DATABASE = None
DWH_DATABASE = "default"
ROLLBAR = {}
LOGGING["handlers"]["rollbar"] = {"class": "logging.NullHandler"}  # type: ignore  # noqa
HP_ACTION_CUSTOMER_KEY = ""
RAPIDPRO_API_TOKEN = ""
RAPIDPRO_FOLLOWUP_CAMPAIGN_RH = ""
RAPIDPRO_FOLLOWUP_CAMPAIGN_LOC = ""
RAPIDPRO_FOLLOWUP_CAMPAIGN_HP = ""
RAPIDPRO_FOLLOWUP_CAMPAIGN_EHP = ""
LOB_SECRET_API_KEY = ""
LOB_PUBLISHABLE_API_KEY = ""
DOCUSIGN_ACCOUNT_ID = ""
DOCUSIGN_INTEGRATION_KEY = ""
DOCUSIGN_USER_ID = ""
MAILCHIMP_API_KEY = ""
MAILCHIMP_LIST_ID = ""
MAILCHIMP_CORS_ORIGINS = []
FRONTAPP_PLUGIN_AUTH_SECRET = ""

# Because we generally *don't* do things when we're on a demo
# deployment, we'll default this to true, which will force tests
# to set it to false in order to pass, which feels like a more
# explicit way of writing tests, but we can always change this
# default in the future if it ends up being a bad decision.
IS_DEMO_DEPLOYMENT = True

CELERY_BROKER_URL = ""
CELERY_TASK_ALWAYS_EAGER = True

DEBUG_DATA_DIR = ""

DHCR_EMAIL_SENDER_ADDRESS = "rhrequest@justfix.org"
DHCR_EMAIL_RECIPIENT_ADDRESSES = ["boop@fakedhcr.org"]

email_config = dj_email_url.parse("dummy:")
vars().update(email_config)

DEFAULT_FILE_STORAGE = "project.settings_pytest.NotActuallyFileStorage"

# Use defaults for static file storage.
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"
STATIC_URL = "/static/"

# Use very fast but horribly insecure password hashing
# to make tests run faster.
PASSWORD_HASHERS = ("django.contrib.auth.hashers.MD5PasswordHasher",)

# Access to the nycdb is read-only anyways, so we won't be able to create a
# test database on it.
if "nycdb" in DATABASES:  # noqa
    del DATABASES["nycdb"]  # noqa

if "wow" in DATABASES:  # noqa
    del DATABASES["wow"]  # noqa

if "dashboard" in DATABASES:  # noqa
    del DATABASES["dashboard"]  # noqa

NAVBAR_LABEL = ""

WOW_ORIGIN = "https://demo-whoownswhat.herokuapp.com"
EFNYC_ORIGIN = "https://demo-efnyc.netlify.com"

ENABLE_EMERGENCY_HP_ACTION = True

GCE_API_TOKEN = "boop"

class NotActuallyFileStorage:
    def __init__(self):
        raise Exception(
            "Please use the django_file_storage pytest fixture if "
            "you need to use Django file storage"
        )

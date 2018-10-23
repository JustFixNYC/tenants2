from . import justfix_environment  # noqa

justfix_environment.IS_RUNNING_TESTS = True

from .settings import *  # noqa

# Disable legacy auth by default, tests will need
# to override settings if they want to enable it.
LEGACY_MONGODB_URL = ''

# Disable Twilio by default.
TWILIO_ACCOUNT_SID = ''
TWILIO_AUTH_TOKEN = ''
TWILIO_PHONE_NUMBER = ''

# Disable a bunch of third-party integrations by default.
GEOCODING_SEARCH_URL = ""
LANDLORD_LOOKUP_URL = ""
AIRTABLE_API_KEY = ''
SLACK_WEBHOOK_URL = ''
GA_TRACKING_ID = ''
FACEBOOK_PIXEL_ID = ''
ROLLBAR_ACCESS_TOKEN = ''
ROLLBAR = {}  # type: ignore
LOGGING['handlers']['rollbar'] = {  # type: ignore  # noqa
    'class': 'logging.NullHandler'
}

# Use very fast but horribly insecure password hashing
# to make tests run faster.
PASSWORD_HASHERS = (
    'django.contrib.auth.hashers.MD5PasswordHasher',
)

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

# We don't want any actual network requests to go out
# while we're testing, so just point these at a
# nonexistent localhost port.
GEOCODING_SEARCH_URL = "http://127.0.0.1:9999/v1/search"
GEOCODING_TIMEOUT = 0.001
LANDLORD_LOOKUP_URL = "http://127.0.0.1:9999/api/landlord"
LANDLORD_LOOKUP_TIMEOUT = GEOCODING_TIMEOUT

# Disable a bunch of third-party integrations by default.
AIRTABLE_API_KEY = ''
SLACK_WEBHOOK_URL = ''
GA_TRACKING_ID = ''
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

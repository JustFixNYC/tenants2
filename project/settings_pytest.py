from . import justfix_environment  # noqa

justfix_environment.IS_RUNNING_TESTS = True

from .settings import *  # noqa

# Disable legacy auth by default, tests will need
# to override settings if they want to enable it.
LEGACY_MONGODB_URL = ''

# Use very fast but horribly insecure password hashing
# to make tests run faster.
PASSWORD_HASHERS = (
    'django.contrib.auth.hashers.MD5PasswordHasher',
)

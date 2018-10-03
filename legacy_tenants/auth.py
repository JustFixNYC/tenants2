import base64
import hashlib
from typing import Optional
from django.utils.crypto import pbkdf2
from django.conf import settings

from . import mongo
from users.models import JustfixUser
from .models import LegacyUserInfo


def convert_salt_to_bytes(salt: str) -> bytes:
    '''
    Although the JustFix tenant app's current codebase base64
    encodes the salt, it appears that some early records
    in the database have raw binary values encoded as
    strings.

    The NodeJS fix for this is Buffer.from(salt, 'binary'),
    but I didn't know of a Python equivalent so I tried
    to implement one here.
    '''

    try:
        return salt.encode('ascii')
    except UnicodeEncodeError:
        # I don't actually know what's going on at a fundamental
        # level here; I just noticed that node's own
        # Buffer.from(salt, 'binary') (which is the fix in Node)
        # was essentially clearing the upper 16 bits of each
        # character's unicode codepoint representation,
        # so I did the same thing here.
        #
        # But because I essentially just saw a pattern and
        # accounted for it, it's quite possible I'm missing out
        # on some edge cases, or that this might all break
        # down if run on a different kind of system.
        return bytes([ord(ch) & 0x00ff for ch in salt])


def validate_password(password: str, expected_hash: str, salt: str) -> bool:
    '''
    Validates whether the given password is valid, given its
    expected hash and salt.
    '''

    salt_bytes = convert_salt_to_bytes(salt)

    hashval = base64.b64encode(
        pbkdf2(password, salt_bytes, 10000, dklen=64, digest=hashlib.sha1)
    )

    return hashval == expected_hash.encode('ascii')


def try_password(identity: mongo.MongoIdentity, password: str) -> bool:
    '''
    Return whether the password for the given user account
    is correct.
    '''

    return validate_password(password, identity.password, identity.salt)


class LegacyTenantsAppBackend:
    '''
    A Django authentication backend that authenticates against the
    legacy tenants app.
    '''

    def authenticate(self, request, phone_number: Optional[str]=None,
                     password: Optional[str]=None):
        if settings.LEGACY_MONGODB_URL and phone_number and password:
            mongo_user = mongo.get_user_by_phone_number(phone_number)
            if mongo_user and try_password(mongo_user.identity, password):
                try:
                    user = JustfixUser.objects.get(phone_number=phone_number)
                except JustfixUser.DoesNotExist:
                    user = JustfixUser(
                        username=f"legacy_{phone_number}",
                        phone_number=phone_number
                    )
                    user.save()
                if LegacyUserInfo.is_legacy_user(user):
                    legacy_user = user.legacy_info
                else:
                    legacy_user = LegacyUserInfo(user=user)
                legacy_user.update_from_mongo_user(mongo_user)
                legacy_user.save()
                user.save()
                return user

        return None

    def get_user(self, user_id):
        try:
            return JustfixUser.objects.get(pk=user_id)
        except JustfixUser.DoesNotExist:
            return None

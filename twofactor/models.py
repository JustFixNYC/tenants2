from users.models import JustfixUser
from django.db import models
import pyotp

from project.util.site_util import get_default_site


TOTP_SECRET_LENGTH = 16


class TwofactorInfo(models.Model):
    """
    Represents details about a user's two-factor authentication (2FA).
    """

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name="twofactor_info"
    )

    secret = models.CharField(
        max_length=TOTP_SECRET_LENGTH,
        default=pyotp.random_base32,
        help_text="The Time-based One-time Password (TOTP) secret for this user.",
    )

    has_user_seen_secret_yet = models.BooleanField(
        default=False,
        help_text=(
            "Whether or not we've shown the TOTP secret to the user yet. If "
            "false, we will show it to them when they next need to be verified; "
            "otherwise we will assume they have stored it."
        ),
    )

    @property
    def totp(self):
        "The PyOTP TOTP instance for the user."

        return pyotp.TOTP(self.secret)

    @property
    def provisioning_uri(self) -> str:
        "The provisioning URI for the user."

        return self.totp.provisioning_uri(self.user.full_name, issuer_name=get_default_site().name)

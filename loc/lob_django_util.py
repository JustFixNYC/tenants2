from typing import Any, Dict, Optional
from django.utils.html import format_html

from project import common_data
from project.util.admin_util import admin_field


USPS_TRACKING_URL_PREFIX = common_data.load_json("loc.json")["USPS_TRACKING_URL_PREFIX"]


class SendableViaLobMixin:
    """
    This mixin can be used on any Django model that represents something that
    may possibly have been mailed via Lob.

    Note that it doesn't define any model fields itself, but *does* require that
    subclasses actually define some model fields, which are documented below. This
    is done in part because this mixin was created after a number of model classes
    having these fields were already in existence, but which all varied in small
    ways (e.g. their help text).
    """

    # This should be set to a `JSONField` of the JSON response of the API call that
    # was made to send the item that was mailed (or None if it wasn't mailed).
    lob_letter_object: Optional[Dict[str, Any]] = None

    # This should be set to a `CharField` of the USPS tracking number for the
    # thing that was mailed (or an empty string if it wasn't mailed).
    tracking_number: str = ""

    @property
    def lob_letter_html_description(self) -> str:
        """
        Return an HTML string that describes the mailed Lob letter. If
        the letter has not been sent through Lob, return an empty string.
        """

        if not self.lob_letter_object:
            return ""
        return format_html(
            'The letter was <a href="{}" rel="noreferrer noopener" target="_blank">'
            "sent via Lob</a> with the tracking number "
            '<a href="{}" rel="noreferrer noopener" target="_blank">{}</a> and '
            "has an expected delivery date of {}.",
            self.lob_url,
            self.usps_tracking_url,
            self.tracking_number,
            self.lob_letter_object["expected_delivery_date"],
        )

    @property
    def lob_url(self) -> str:
        """
        Return the URL on Lob where more information about the mailed Lob
        version of this letter can be found.

        If the letter has not been sent through Lob, return an empty string.
        """

        if not self.lob_letter_object:
            return ""
        ltr_id = self.lob_letter_object["id"]

        # This URL structure isn't formally documented anywhere, it was
        # just inferred, so it could technically break at any time, but
        # it's better than nothing!
        return f"https://dashboard.lob.com/#/letters/{ltr_id}"

    @property
    def usps_tracking_url(self) -> str:
        """
        Return the URL on the USPS website where more information about
        the mailed letter can be found.

        If the letter has not been sent, return an empty string.
        """

        if not self.tracking_number:
            return ""

        return f"{USPS_TRACKING_URL_PREFIX}{self.tracking_number}"


class SendableViaLobAdminMixin:
    @admin_field(short_description="Lob integration", allow_tags=True)
    def lob_integration(self, obj: SendableViaLobMixin) -> str:
        if obj.lob_letter_object:
            return obj.lob_letter_html_description
        return "This has not been sent via Lob."

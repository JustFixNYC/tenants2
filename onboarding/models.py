import json
from typing import List, Dict, Optional
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.gis.db.models import PointField
from django.contrib.gis.geos import GEOSGeometry

from project.common_data import Choices
from project import geocoding, mapbox
from project.util.nyc import PAD_BBL_DIGITS, PAD_BIN_DIGITS
from project.util.instance_change_tracker import InstanceChangeTracker
from project.util.hyperlink import Hyperlink
from project.util.admin_util import admin_field
from project.util.address_form_fields import (
    ADDRESS_FIELD_KWARGS,
    BOROUGH_FIELD_KWARGS,
    BOROUGH_CHOICES,
)
from project.util.mailing_address import CITY_KWARGS, STATE_KWARGS, ZipCodeValidator
from users.models import JustfixUser


LEASE_CHOICES = Choices.from_file("lease-choices.json", name="LeaseType")

SIGNUP_INTENT_CHOICES = Choices.from_file("signup-intent-choices.json")

APT_NUMBER_KWARGS = dict(max_length=10)

NYCADDR_META_HELP = (
    "This field is automatically updated for NYC users when you change the " "address or borough."
)


class AddressWithoutBoroughDiagnostic(models.Model):
    """
    Information about submitted onboarding forms that contained
    address information without borough information. For more
    details on the rationale behind this, see:

        https://github.com/JustFixNYC/tenants2/issues/533

    We're not storing this information in Google Analytics
    or Rollbar because those services make it very hard
    or impossible to delete sensitive data, and a user's
    address can be PII.
    """

    address = models.CharField(**ADDRESS_FIELD_KWARGS)

    created_at = models.DateTimeField(auto_now_add=True)


class OnboardingInfo(models.Model):
    """
    The details a user filled out when they joined the site.

    Note that this model was originally NYC-specific, but was
    subsequently changed to support non-NYC users. As such, it
    has a few wrinkles.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # This keeps track of the fields that comprise our NYC address.
        self.__nycaddr = InstanceChangeTracker(self, ["address", "borough"])

        # This keeps track of fields that comprise metadata about our NYC address,
        # which can be determined from the fields comprising our address.
        self.__nycaddr_meta = InstanceChangeTracker(
            self, ["geocoded_address", "zipcode", "geometry", "pad_bbl", "pad_bin"]
        )

        # This keeps track of the fields that comprise our non-NYC address.
        self.__nationaladdr = InstanceChangeTracker(
            self, ["address", "non_nyc_city", "state", "zipcode"]
        )

        # This keeps track of fields that comprise metadata about our non-NYC address,
        # which can be determined from the fields comprising our address.
        self.__nationaladdr_meta = InstanceChangeTracker(self, ["geocoded_address", "geometry"])

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name="onboarding_info"
    )

    signup_intent = models.CharField(
        max_length=30,
        choices=SIGNUP_INTENT_CHOICES.choices,
        help_text="The reason the user originally signed up with us.",
    )

    address = models.CharField(
        **ADDRESS_FIELD_KWARGS,
        help_text="The user's address. Only street name and number are required.",
    )

    # TODO: This is currently only used for NYC-based users, and we might want to
    # deprecate it entirely: https://github.com/JustFixNYC/tenants2/issues/1991
    address_verified = models.BooleanField(
        default=False,
        help_text=(
            "Whether we've verified, on the server-side, that the user's " "address is valid."
        ),
    )

    geocoded_address = models.CharField(
        max_length=255,
        blank=True,
        help_text=(
            "This is the user's definitive street address returned by the geocoder, and "
            "what the user's latitude, longitude, and other attributes are based from. This "
            "should not be very different from the address field (if it is, you "
            "may need to change the address so the geocoder matches to the "
            "proper location)."
        ),
    )

    borough = models.CharField(
        **BOROUGH_FIELD_KWARGS,
        blank=True,
        help_text=(
            "The New York City borough the user's address is in, if they " "live inside NYC."
        ),
    )

    non_nyc_city = models.CharField(
        **CITY_KWARGS,
        blank=True,
        help_text=("The non-NYC city the user's address is in, if they live outside " "of NYC."),
    )

    state = models.CharField(
        **STATE_KWARGS, help_text='The two-letter state or territory of the user, e.g. "NY".'
    )

    zipcode = models.CharField(
        # https://stackoverflow.com/q/325041/2422398
        max_length=12,
        blank=True,
        validators=[ZipCodeValidator()],
        help_text=f"The user's ZIP code. {NYCADDR_META_HELP}",
    )

    geometry = models.JSONField(
        blank=True,
        null=True,
        help_text="The GeoJSON point representing the user's address, if available.",
    )

    geocoded_point = PointField(
        null=True,
        blank=True,
        srid=4326,
        help_text="The point representing the user's address, if available.",
    )

    pad_bbl: str = models.CharField(
        max_length=PAD_BBL_DIGITS,
        blank=True,
        help_text=f"The user's Boro, Block, and Lot number. {NYCADDR_META_HELP}",
    )

    pad_bin: str = models.CharField(
        max_length=PAD_BIN_DIGITS,
        blank=True,
        help_text=f"The user's building identification number (BIN). {NYCADDR_META_HELP}",
    )

    apt_number = models.CharField(**APT_NUMBER_KWARGS, blank=True)

    floor_number = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="The floor number the user's apartment is on."
    )

    is_in_eviction = models.BooleanField(
        null=True, blank=True, help_text="Has the user received an eviction notice?"
    )

    needs_repairs = models.BooleanField(
        null=True, blank=True, help_text="Does the user need repairs in their apartment?"
    )

    has_no_services = models.BooleanField(
        null=True, blank=True, help_text="Is the user missing essential services like water?"
    )

    has_pests = models.BooleanField(
        null=True, blank=True, help_text="Does the user have pests like rodents or bed bugs?"
    )

    has_called_311 = models.BooleanField(
        null=True, blank=True, help_text="Has the user called 311 before?"
    )

    lease_type = models.CharField(
        max_length=30,
        choices=LEASE_CHOICES.choices,
        blank=True,
        help_text="The type of lease the user has on their dwelling (NYC only).",
    )

    receives_public_assistance = models.BooleanField(
        null=True, blank=True, help_text="Does the user receive public assistance, e.g. Section 8?"
    )

    can_we_sms = models.BooleanField(
        help_text="Whether we can contact the user via SMS to follow up."
    )

    can_rtc_sms = models.BooleanField(
        help_text="Whether the Right to Counsel NYC Coalition can contact the user via SMS.",
        default=False,
    )

    can_hj4a_sms = models.BooleanField(
        help_text="Whether Housing Justice for All can contact the user via SMS.",
        default=False,
    )

    agreed_to_justfix_terms = models.BooleanField(
        default=False,
        help_text=(
            "Whether the user has agreed to the JustFix.nyc terms " "of service and privacy policy."
        ),
    )

    agreed_to_norent_terms = models.BooleanField(
        default=False,
        help_text=(
            "Whether the user has agreed to the NoRent.org terms " "of service and privacy policy."
        ),
    )

    agreed_to_evictionfree_terms = models.BooleanField(
        default=False,
        help_text=(
            "Whether the user has agreed to the Eviction Free terms "
            "of service and privacy policy."
        ),
    )

    can_receive_rttc_comms = models.BooleanField(
        null=True,
        blank=True,
        help_text=(
            "Whether the user has opted-in to being contacted by "
            "the Right to the City Alliance (RTTC)."
        ),
    )

    can_receive_saje_comms = models.BooleanField(
        null=True,
        blank=True,
        help_text=(
            "Whether the user has opted-in to being contacted by "
            "Strategic Actions for a Just Economy (SAJE)."
        ),
    )

    @property
    def borough_label(self) -> str:
        if not self.borough:
            return ""
        return BOROUGH_CHOICES.get_label(self.borough)

    @property
    def city(self) -> str:
        """
        The city of the user. For NYC-based users, this will be the same as
        the borough name, except we use "New York" instead of "Manhattan".
        """

        if not self.borough:
            return self.non_nyc_city
        if self.borough == BOROUGH_CHOICES.MANHATTAN:
            return "New York"
        return self.borough_label

    @property
    def full_nyc_address(self) -> str:
        """Return the full address for purposes of geolocation, etc."""

        if not (self.borough and self.address):
            return ""
        return f"{self.address}, {self.borough_label}"

    @property
    def apartment_address_line(self) -> str:
        """The address line that specifies the user's apartment number."""

        if self.apt_number:
            return f"Apartment {self.apt_number}"
        return ""

    @property
    def address_lines_for_mailing(self) -> List[str]:
        """Return the full mailing address as a list of lines."""

        result: List[str] = []
        if self.address:
            result.append(self.address)
        if self.apt_number:
            result.append(self.apartment_address_line)
        if self.city:
            result.append(f"{self.city}, {self.state} {self.zipcode}".strip())

        return result

    @property
    def address_for_mailing(self) -> str:
        """Return the full mailing address as a string."""

        return "\n".join(self.address_lines_for_mailing)

    def lookup_county(self) -> Optional[str]:
        from findhelp.models import County

        if self.geocoded_point is not None:
            county = County.objects.filter(
                state=self.state, geom__contains=self.geocoded_point
            ).first()
            if county:
                return county.name
        return None

    def as_lob_params(self) -> Dict[str, str]:
        """
        Returns a dictionary representing the address that can be passed directly
        to Lob's verifications API: https://lob.com/docs#us_verifications_create
        """

        return dict(
            primary_line=self.address,
            # TODO: Technically this is the wrong way to use the secondary
            # line, according to the USPS. We should instead be putting the
            # apartment number in the primary line.
            secondary_line=self.apartment_address_line,
            state=self.state,
            city=self.city,
            zip_code=self.zipcode,
        )

    def __str__(self):
        if not (self.created_at and self.user and self.user.full_name):
            return super().__str__()
        return (
            f"{self.user.full_name}'s onboarding info from "
            f"{self.created_at.strftime('%A, %B %d %Y')}"
        )

    def __should_lookup_new_addr_metadata(
        self, addr: InstanceChangeTracker, addr_meta: InstanceChangeTracker
    ) -> bool:
        if addr.are_any_fields_blank():
            # We can't even look up address metadata without a
            # full address.
            return False

        if addr_meta.are_any_fields_blank():
            # We have full address information but no
            # address metadata, so let's look it up!
            return True

        if addr.has_changed() and not addr_meta.has_changed():
            # The address information has changed but our address
            # metadata has not, so let's look it up again.
            return True

        return False

    def lookup_nycaddr_metadata(self):
        features = geocoding.search(self.full_nyc_address)
        if features:
            feature = features[0]
            props = feature.properties
            self.geocoded_address = f"{props.label} (via NYC GeoSearch)"
            self.zipcode = props.postalcode
            self.pad_bbl = props.pad_bbl
            self.pad_bin = props.pad_bin
            self.geometry = feature.geometry.dict()
        elif self.__nycaddr.has_changed():
            # If the address has changed, we really don't want the existing
            # metadata to be there, because it will represent information
            # about their old address.
            self.geocoded_address = ""
            self.zipcode = ""
            self.pad_bbl = ""
            self.pad_bin = ""
            self.geometry = None
        self.__nycaddr.set_to_unchanged()
        self.__nycaddr_meta.set_to_unchanged()

    def lookup_nationaladdr_metadata(self):
        # Clear out any NYC-specific metadata.
        self.pad_bbl = ""
        self.pad_bin = ""

        city = self.non_nyc_city
        addrs = mapbox.find_address(
            address=self.address,
            city=city,
            state=self.state,
            zip_code=self.zipcode,
        )
        if addrs:
            addr = addrs[0]
            self.geometry = addr.geometry.dict()
            self.geocoded_address = f"{addr.place_name} (via Mapbox)"
        elif self.__nationaladdr.has_changed():
            self.geocoded_address = ""
            self.geometry = None
        self.__nationaladdr.set_to_unchanged()
        self.__nationaladdr_meta.set_to_unchanged()

    def maybe_lookup_new_addr_metadata(self) -> bool:
        if self.__should_lookup_new_addr_metadata(self.__nycaddr, self.__nycaddr_meta):
            self.lookup_nycaddr_metadata()
            return True
        if self.__should_lookup_new_addr_metadata(self.__nationaladdr, self.__nationaladdr_meta):
            self.lookup_nationaladdr_metadata()
            return True
        return False

    def update_geocoded_point_from_geometry(self):
        """
        Set the `geocoded_point` property based on the value of `geometry`. Done automatically
        on model save.
        """

        if self.geometry is None:
            self.geocoded_point = None
        else:
            self.geocoded_point = GEOSGeometry(json.dumps(self.geometry), srid=4326)

    def clean(self):
        if self.borough and self.non_nyc_city:
            raise ValidationError("One cannot be in an NYC borough and outside NYC simultaneously.")

    def save(self, *args, **kwargs):
        self.maybe_lookup_new_addr_metadata()
        self.update_geocoded_point_from_geometry()
        return super().save(*args, **kwargs)

    @property
    def building_links(self) -> List[Hyperlink]:
        links: List[Hyperlink] = []
        if self.pad_bbl:
            links.append(
                Hyperlink(
                    name="Who Owns What", url=f"https://whoownswhat.justfix.nyc/bbl/{self.pad_bbl}"
                )
            )
        if self.pad_bin:
            links.append(
                Hyperlink(
                    name="NYC DOB BIS",
                    url=(
                        f"http://a810-bisweb.nyc.gov/bisweb/PropertyProfileOverviewServlet?"
                        f"bin={self.pad_bin}&go4=+GO+&requestid=0"
                    ),
                )
            )
        return links

    @admin_field(short_description="Building links", allow_tags=True)
    def get_building_links_html(self) -> str:
        return Hyperlink.join_admin_buttons(self.building_links)

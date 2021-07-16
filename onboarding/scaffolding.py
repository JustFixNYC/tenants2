import json
from pathlib import Path
from project.util.rename_dict_keys import with_keys_renamed
from project.util.session_mutation import SessionFormMutation
from typing import Any, Dict, Optional, Tuple
from django.contrib.gis.geos import GEOSGeometry, Point
import graphene
from graphql import ResolveInfo
import pydantic

from findhelp.models import union_geometries


# This should change whenever our scaffolding model's fields change in a
# backwards incompatible way.
VERSION = "1"

# Note that this has the word 'norent' in it; this is b/c this structure
# started out as NoRent-specific data but evolved to be useful elsewhere.
# We're not renaming this session key b/c we don't want to break existing
# session data.
SCAFFOLDING_SESSION_KEY = f"norent_scaffolding_v{VERSION}"

NYC_CITIES = [
    "nyc",
    "new york city",
    "new york",
    "ny",
    "manhattan",
    "queens",
    "brooklyn",
    "staten island",
    "bronx",
    "the bronx",
]

BOROUGH_BOUNDS_PATH = Path("findhelp") / "data" / "Borough-Boundaries.geojson"

_nyc_bounds: Optional[GEOSGeometry] = None


def is_city_name_in_nyc(city: str) -> bool:
    parts = city.split("/")
    for part in parts:
        if part.strip().lower() in NYC_CITIES:
            return True
    return False


class OnboardingScaffolding(pydantic.BaseModel):
    """
    This is scaffolding we have in place of an actual
    Django Model (or collection of models), for use while
    a user is onboarding onto our platform without
    having had made an account yet.
    """

    first_name: str = ""

    last_name: str = ""

    preferred_first_name: str = ""

    # e.g. "666 FIFTH AVENUE"
    street: str = ""

    city: str = ""

    # e.g. "NY"
    state: str = ""

    # If in NYC, the borough code, e.g. "STATEN_ISLAND".
    borough: str = ""

    # Whether or not we verified that the user's address was verified
    # on the server-side.
    address_verified: bool = False

    lease_type: str = ""

    receives_public_assistance: Optional[bool] = None

    # e.g. (-73.9496, 40.6501)
    lnglat: Optional[Tuple[float, float]] = None

    zip_code: str = ""

    apt_number: Optional[str] = None

    email: str = ""

    phone_number: str = ""

    has_landlord_email_address: Optional[bool] = None

    has_landlord_mailing_address: Optional[bool] = None

    can_receive_rttc_comms: Optional[bool] = None

    can_receive_saje_comms: Optional[bool] = None

    def is_city_in_nyc(self) -> Optional[bool]:
        if not (self.state and self.city):
            return None
        if self.state == "NY":
            if is_city_name_in_nyc(self.city):
                return True
            if self.lnglat and is_lnglat_in_nyc(self.lnglat):
                return True
        return False

    def is_zip_code_in_la(self) -> Optional[bool]:
        from norent.la_zipcodes import is_zip_code_in_la

        if not self.zip_code:
            return None
        return is_zip_code_in_la(self.zip_code)


def is_lnglat_in_nyc(lnglat: Tuple[float, float]) -> bool:
    global _nyc_bounds

    if _nyc_bounds is None:
        # TODO: Now that findhelp is always enabled and we have access to PostGIS in
        # production, we should just delegate this to the database to figure out. It
        # will also save memory in our server process.
        bbounds = json.loads(BOROUGH_BOUNDS_PATH.read_text())
        _nyc_bounds = union_geometries(
            GEOSGeometry(json.dumps(feature["geometry"])) for feature in bbounds["features"]
        )
        assert _nyc_bounds is not None
    return _nyc_bounds.contains(Point(*lnglat))


class GraphQlOnboardingScaffolding(graphene.ObjectType):
    """
    Represents the public fields of our Onboarding scaffolding, as a GraphQL type.
    """

    first_name = graphene.String(required=True)

    last_name = graphene.String(required=True)

    preferred_first_name = graphene.String(required=True)

    street = graphene.String(required=True)

    city = graphene.String(required=True)

    is_city_in_nyc = graphene.Boolean()

    is_in_los_angeles = graphene.Boolean(
        description=(
            "Whether the onboarding user is in Los Angeles County. If "
            "we don't have enough information to tell, this will be null."
        )
    )

    state = graphene.String(required=True)

    borough = graphene.String(required=True)

    zip_code = graphene.String(required=True)

    apt_number = graphene.String()

    email = graphene.String(required=True)

    has_landlord_email_address = graphene.Boolean()

    has_landlord_mailing_address = graphene.Boolean()

    can_receive_rttc_comms = graphene.Boolean()

    can_receive_saje_comms = graphene.Boolean()

    def resolve_is_city_in_nyc(self, info: ResolveInfo) -> Optional[bool]:
        return self.is_city_in_nyc()

    def resolve_is_in_los_angeles(self, info: ResolveInfo) -> Optional[bool]:
        return self.is_zip_code_in_la()

    @classmethod
    def graphql_field(cls):
        def resolver(_, info: ResolveInfo):
            request = info.context
            kwargs = request.session.get(SCAFFOLDING_SESSION_KEY, {})
            if kwargs:
                return OnboardingScaffolding(**kwargs)
            return None

        return graphene.Field(cls, resolver=resolver)


def get_scaffolding_fields_from_form(form) -> Dict[str, Any]:
    """
    Returns the form's cleaned data in a format that is suitable
    for updating scaffolding data.

    Generally this is just the form's cleaned data. However, if the
    form has a `to_scaffolding_keys` property that maps its field
    names to scaffolding field names, that is used to rename fields
    as needed.
    """

    data = form.cleaned_data
    if hasattr(form, "to_scaffolding_keys"):
        data = with_keys_renamed(data, form.to_scaffolding_keys)
    return data


class OnboardingScaffoldingMutation(SessionFormMutation):
    """
    Base class for writing a form's `cleaned_data` into onboarding scaffolding.
    """

    class Meta:
        abstract = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        update_scaffolding(request, get_scaffolding_fields_from_form(form))
        return cls.mutation_success()


class OnboardingScaffoldingOrUserDataMutation(SessionFormMutation):
    """
    Base class for writing a form's `cleaned_data` into either onboarding
    scaffolding (if the user isn't logged in) or actual user data (if the
    user is logged in).

    Note that subclasses _must_ implement `perform_mutate_for_authenticated_user`.
    """

    class Meta:
        abstract = True

    @classmethod
    def perform_mutate_for_authenticated_user(cls, form, info: ResolveInfo):
        raise NotImplementedError()

    @classmethod
    def perform_mutate_for_anonymous_user(cls, form, info: ResolveInfo):
        update_scaffolding(info.context, get_scaffolding_fields_from_form(form))
        return cls.mutation_success()

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        if user.is_authenticated:
            return cls.perform_mutate_for_authenticated_user(form, info)
        return cls.perform_mutate_for_anonymous_user(form, info)


def _migrate_legacy_session_data_to_scaffolding(request):
    """
    This function takes any data we have stored elsewhere in
    the session by legacy endpoints and migrates it over to the
    onboarding scaffolding if possible.

    As each legacy endpoint is fully deprecated and removed, we'll
    remove the relevant migration code from this function. Eventually
    we'll have nothing left to migrate and we can get rid of this
    function.

    For more context around all this, see:

        https://github.com/JustFixNYC/tenants2/issues/2142
    """

    d = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    updated = False

    if not d.get("first_name") or not d.get("borough"):
        from .schema import OnboardingStep1V2Info

        legacy_step1 = OnboardingStep1V2Info.get_dict_from_request(request)
        if legacy_step1:
            if legacy_step1["first_name"] == legacy_step1["last_name"] == "ignore":
                # This is data submitted by code deprecated in
                # https://github.com/JustFixNYC/tenants2/pull/2143 which only set
                # useful address info, so remove the name info.
                del legacy_step1["first_name"]
                del legacy_step1["last_name"]
                if "preferred_first_name" in legacy_step1:
                    del legacy_step1["preferred_first_name"]

            d.update(
                with_keys_renamed(
                    legacy_step1, OnboardingStep1V2Info._meta.form_class.to_scaffolding_keys
                )
            )
            updated = True
            OnboardingStep1V2Info.clear_from_request(request)

    if not d.get("lease_type"):
        from .schema import OnboardingStep3Info

        legacy_step3 = OnboardingStep3Info.get_dict_from_request(request)
        if legacy_step3:
            from project.forms import YesNoRadiosField

            legacy_step3["receives_public_assistance"] = YesNoRadiosField.coerce(
                legacy_step3["receives_public_assistance"]
            )
            d.update(legacy_step3)
            updated = True
            OnboardingStep3Info.clear_from_request(request)

    if not d.get("phone_number"):
        from rh.schema import RhFormInfo

        legacy_rh = RhFormInfo.get_dict_from_request(request)
        if legacy_rh:
            d.update(with_keys_renamed(legacy_rh, RhFormInfo._meta.form_class.to_scaffolding_keys))
            updated = True
            RhFormInfo.clear_from_request(request)

    if updated:
        request.session[SCAFFOLDING_SESSION_KEY] = d


def get_scaffolding(request) -> OnboardingScaffolding:
    _migrate_legacy_session_data_to_scaffolding(request)
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    return OnboardingScaffolding(**scaffolding_dict)


def update_scaffolding(request, new_data):
    _migrate_legacy_session_data_to_scaffolding(request)
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    scaffolding_dict.update(new_data)

    # This ensures that whatever changes we're making are copacetic
    # with our Pydantic model.
    OnboardingScaffolding(**scaffolding_dict)

    request.session[SCAFFOLDING_SESSION_KEY] = scaffolding_dict


def purge_scaffolding(request):
    if SCAFFOLDING_SESSION_KEY in request.session:
        del request.session[SCAFFOLDING_SESSION_KEY]

import json
from project.util.django_graphql_session_forms import SessionStorage
from findhelp.models import union_geometries
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, Optional, Tuple
from django.contrib.gis.geos import GEOSGeometry, Point
from django.http import HttpRequest
import pydantic
import graphene
from graphql import ResolveInfo


# This should change whenever our scaffolding model's fields change in a
# backwards incompatible way.
VERSION = "1"

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

BBOUNDS_PATH = Path("findhelp") / "data" / "Borough-Boundaries.geojson"

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

    # e.g. (-73.9496, 40.6501)
    lnglat: Optional[Tuple[float, float]] = None

    zip_code: str = ""

    apt_number: Optional[str] = None

    email: str = ""

    phone_number: str = ""

    landlord_name: str = ""

    # e.g. "666 FIFTH AVENUE, APT 2"
    landlord_primary_line: str = ""

    landlord_city: str = ""

    landlord_state: str = ""

    landlord_zip_code: str = ""

    landlord_email: str = ""

    landlord_phone_number: str = ""

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
        bbounds = json.loads(BBOUNDS_PATH.read_text())
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


def get_scaffolding(request: HttpRequest) -> OnboardingScaffolding:
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    return OnboardingScaffolding(**scaffolding_dict)


def update_scaffolding(request: HttpRequest, new_data: Dict[str, Any]):
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    scaffolding_dict.update(new_data)

    # This ensures that whatever changes we're making are copacetic
    # with our Pydantic model.
    OnboardingScaffolding(**scaffolding_dict)

    request.session[SCAFFOLDING_SESSION_KEY] = scaffolding_dict


def purge_scaffolding_keys(request: HttpRequest, keys: Iterable[str]):
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    for key in keys:
        if key in scaffolding_dict:
            scaffolding_dict.pop(key)
    request.session[SCAFFOLDING_SESSION_KEY] = scaffolding_dict


def purge_scaffolding(request: HttpRequest):
    if SCAFFOLDING_SESSION_KEY in request.session:
        del request.session[SCAFFOLDING_SESSION_KEY]


class ScaffoldingFormConverter:
    def __init__(
        self,
        form_class,
        form_to_scaffolding_mapping: Dict[str, str] = {},
        exclude: Iterable[str] = (),
        fill_excluded: Callable[[Dict[str, Any]], Dict[str, Any]] = lambda x: x,
    ):
        self.form_class = form_class
        self.exclude = set(exclude)
        self.fill_excluded = fill_excluded
        self.form_field_names = list(
            name for name in form_class().fields.keys() if name not in self.exclude
        )
        self.to_scaffolding_mapping = {
            form_field: form_to_scaffolding_mapping.get(form_field, form_field)
            for form_field in self.form_field_names
        }
        self.to_form_mapping = {value: key for key, value in self.to_scaffolding_mapping.items()}
        scf = OnboardingScaffolding()
        self.scaffolding_field_names = list(self.to_form_mapping.keys())
        invalid_scf_keys = [
            scf_key for scf_key in self.scaffolding_field_names if not hasattr(scf, scf_key)
        ]
        if invalid_scf_keys:
            raise ValueError(f'Unknown scaffolding keys: {", ".join(invalid_scf_keys)}')

    def to_form(self, scf: OnboardingScaffolding):
        form = self.form_class()
        form_data = {
            form_field: getattr(scf, self.to_scaffolding_mapping[form_field])
            for form_field in form.fields.keys()
            if form_field not in self.exclude
        }
        form_data = self.fill_excluded(form_data)
        return self.form_class(data=form_data)

    def update_scaffolding_from_form_data(
        self, scf: OnboardingScaffolding, form_data: Dict[str, Any]
    ):
        form = self.form_class(data=self.fill_excluded(form_data))
        self.update_scaffolding_from_form(scf, form)

    def update_scaffolding_from_form(self, scf: OnboardingScaffolding, form):
        assert isinstance(form, self.form_class)
        assert form.is_valid()
        for form_field in self.form_field_names:
            setattr(scf, self.to_scaffolding_mapping[form_field], form.cleaned_data[form_field])


class OnboardingSessionStorage(SessionStorage):
    def __init__(self, converter: ScaffoldingFormConverter):
        self.converter = converter

    def load(self, request: HttpRequest) -> Optional[Dict[str, Any]]:
        scf = get_scaffolding(request)
        form = self.converter.to_form(scf)
        if form.is_valid():
            return form.cleaned_data
        return None

    def save(self, request: HttpRequest, data: Dict[str, Any]):
        scf = get_scaffolding(request)
        self.converter.update_scaffolding_from_form_data(scf, data)
        update_scaffolding(request, scf.dict())

    def clear(self, request: HttpRequest):
        purge_scaffolding_keys(request, self.converter.scaffolding_field_names)

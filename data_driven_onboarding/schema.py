from typing import Dict, Any, Optional
from pathlib import Path
import logging
from django.core.cache import caches
from django.db import connections
from django.conf import settings
import graphene

from project import schema_registry, geocoding
from nycha.models import is_nycha_bbl
from project.util.streaming_json import generate_json_rows
from project.util.address_form_fields import get_geocoding_search_text


MY_DIR = Path(__file__).parent.resolve()

DDO_SQL_CACHE = "default"

DDO_SQL_FILE = MY_DIR / "data-driven-onboarding.sql"

RTC_ZIPCODES = set(
    [
        # Brooklyn
        "11216",
        "11221",
        "11225",
        "11226",
        # Bronx
        "10457",
        "10467",
        "10468" "10462",
        # Manhattan
        "10026",
        "10027",
        "10025",
        "10031",
        # Queens
        "11433",
        "11434",
        "11373" "11385",
        # Staten Island
        "10302",
        "10303",
        "10314" "10310",
    ]
)

COMPLAINT_CATEGORY_ALIASES = {
    "DOOR/WINDOW": "DOORS/WINDOWS",
    "WATER LEAK": "WATER LEAKS",
    "ELECTRIC": "ELECTRICAL",
    "GENERAL": "GENERAL DISREPAIR",
    "APPLIANCE": "BROKEN APPLIANCES",
    "OUTSIDE BUILDING": "PUBLIC SPACES",
    "ELEVATOR": "THE ELEVATOR",
    "NONCONST": "NON-CONSTRUCTION",
    "CABINET": "CABINETS",
    "VENTILATION SYSTEM": "THE VENTILATION SYSTEM",
    "MAILBOX": "MAILBOXES",
    "JANITOR/SUPER": "JANITOR/SUPER SERVICES",
    "SIGNAGE MISSING": "MISSING SIGNAGE",
}

logger = logging.getLogger(__name__)


class DDOSuggestionsResult(graphene.ObjectType):
    # This information is obtained from geocoding.
    full_address = graphene.String(required=True, description="The full address of the location.")

    bbl = graphene.String(
        required=True, description="The 10-digit Borough-Block-Lot (BBL) of the location."
    )

    is_nycha_bbl = graphene.Boolean(
        required=True,
        description="Whether the location's BBL is a NYCHA property.",
    )

    is_rtc_eligible = graphene.Boolean(
        required=True,
        description="Whether the location is eligible for NYC's Right to Counsel program.",
    )

    # This information is obtained from our SQL query.
    zipcode = graphene.String(
        required=True, description="The zip code of the location. It may be blank."
    )

    year_built = graphene.Int(
        description="The year that any buildings on the BBL were built, if available."
    )

    building_class = graphene.String(
        description="The 2-character building class of the BBL, as defined by the "
        "Dept. of City Planning."
    )

    unit_count = graphene.Int(
        required=True, description="Number of residential units for the BBL, if available."
    )

    hpd_complaint_count = graphene.Int(
        description=(
            "Number of HPD complaints for the BBL. If there are no listed complaints, "
            "this will be null."
        )
    )

    hpd_open_violation_count = graphene.Int(
        required=True, description=("Number of open HPD violations for the BBL.")
    )

    hpd_open_class_c_violation_count = graphene.Int(
        description=(
            "The number of hpd violations associated with entered bbl that are "
            "class C violations (since 2010)."
        )
    )

    associated_building_count = graphene.Int(
        description=(
            "Number of associated buildings from the portfolio that the BBL is in. "
            "If the value is unknown, or if there are no associated buildings, this will be null. "
            "Also, if the value is unknown, or if there are no associated buildings, this means "
            "that the search BBL does not have any HPD registration on file."
        )
    )

    associated_zip_count = graphene.Int(
        description=(
            "Number of distinct zip codes of associated buildings from the portfolio that the BBL "
            "is in. "
            "If the value is unknown, or if there are no associated buildings, this will be null."
        )
    )

    portfolio_unit_count = graphene.Int(
        description=(
            "The number of residential units in the portfolio that the BBL belongs to. "
            "If the value is unknown, or if there are no associated buildings, this will be null."
        )
    )

    number_of_evictions_from_portfolio = graphene.Int(
        description=("The number of evictions from all associated buildings in portfolio.")
    )

    portfolio_top_borough = graphene.String(
        description=(
            "The most common borough for buildings in the portfolio that the BBL belongs to. "
            "If the value is unknown, or if there are no associated buildings, this will be null."
        )
    )

    number_of_bldgs_in_portfolio_top_borough = graphene.Int(
        description=(
            "The number of associated buildings in the portfolio's most common borough. "
            "If the value is unknown, or if there are no associated buildings, this will be null."
        )
    )

    stabilized_unit_count_2007 = graphene.Int(
        required=True,
        description=("The number of rent-stabilized residential units at the BBL in 2007."),
    )

    stabilized_unit_count_2017 = graphene.Int(
        description=("The number of rent-stabilized residential units at the BBL in 2017."),
        deprecation_reason=(
            "This field has been deprecated as we now use `stabilized_unit_count` "
            "to store the rs unit count for the most up-to-date-year we have available."
        ),
    )

    stabilized_unit_count = graphene.Int(
        required=True,
        description=(
            "The number of rent-stabilized residential units at the BBL "
            "for the most recent year we have data for."
        ),
    )

    stabilized_unit_count_year = graphene.Int(
        required=True,
        description=("The year that our data for most-recent stabilized unit count comes from."),
    )

    stabilized_unit_count_maximum = graphene.Int(
        required=True,
        description=(
            "The maximum number of stabilized units at the BBL on any year between 2007 "
            "and 2017."
        ),
    )

    average_wait_time_for_repairs_at_bbl = graphene.Int(
        description=(
            "The average wait time for repairs, in days, after a landlord has been notified "
            "of a violation, if known, for the property."
        )
    )

    average_wait_time_for_repairs_for_portfolio = graphene.Int(
        description=(
            "The average wait time for repairs, in days, after a landlord has been notified "
            "of a violation, if known, for the landlord's entire portfolio."
        )
    )

    most_common_category_of_hpd_complaint = graphene.String(
        description=(
            "The most common category of HPD complaint, or null if no complaints exist. "
            "The full list of categories can be found at: "
            "https://data.cityofnewyork.us/api/views/a2nx-4u46/files/516fa3f1-fff3-4ef4-9ec8-74da856d9cb8?download=true&filename=HPD%20Complaint%20Open%20Data.pdf"  # NOQA
        )
    )

    number_of_complaints_of_most_common_category = graphene.Int(
        description=(
            "The number of complaints of the most common category of "
            "HPD complaint, or null if no complaints exist."
        )
    )

    number_of_total_hpd_violations = graphene.Int(
        required=True,
        description=(
            "The total number of HPD violations since 2010 for the entered BBL."
            "This value will never be null. If no HPD violations are found, it will be 0."
        ),
    )


@schema_registry.register_queries
class DDOQuery:
    ddo_suggestions = graphene.Field(
        DDOSuggestionsResult,
        address=graphene.String(),
        borough=graphene.String(),
    )

    def resolve_ddo_suggestions(
        self, info, address: str, borough: str
    ) -> Optional[DDOSuggestionsResult]:
        if not address.strip():
            return None
        if not settings.WOW_DATABASE:
            logger.warning("Data-driven onboarding requires WoW integration.")
            return None
        features = geocoding.search(get_geocoding_search_text(address, borough))
        if not features:
            return None
        props = features[0].properties
        row = cached_run_ddo_sql_query(props.pad_bbl)
        if not row:
            return None
        row = normalize_complaint_category(row)
        return DDOSuggestionsResult(
            full_address=props.label,
            bbl=props.pad_bbl,
            is_rtc_eligible=row["zipcode"] in RTC_ZIPCODES,
            is_nycha_bbl=is_nycha_bbl(props.pad_bbl),
            **row,
        )


def normalize_complaint_category(ddo_query: Dict[str, Any]):
    key = "most_common_category_of_hpd_complaint"
    cat = ddo_query[key]
    if cat and cat in COMPLAINT_CATEGORY_ALIASES:
        return {**ddo_query, key: COMPLAINT_CATEGORY_ALIASES[cat]}
    return ddo_query


def cached_run_ddo_sql_query(bbl: str) -> Optional[Dict[str, Any]]:
    sql_query_mtime = DDO_SQL_FILE.stat().st_mtime
    cache_key = f"ddo-sql-{sql_query_mtime}-{bbl}"
    cache = caches[DDO_SQL_CACHE]
    result = run_ddo_sql_query(bbl)
    if not result:
        return None
    return cache.get_or_set(cache_key, result)


def run_ddo_sql_query(bbl: str) -> Optional[Dict[str, Any]]:
    sql_query = DDO_SQL_FILE.read_text()
    with connections[settings.WOW_DATABASE].cursor() as cursor:
        cursor.execute(sql_query, {"bbl": bbl})
        results = list(generate_json_rows(cursor))
        if results:
            return results[0]
        # No results are returned if a user goes directly to a query URL with an
        # address, but we can't find the requested bbl in our database.
        return None

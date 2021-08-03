from typing import List, Dict, Any, Optional
from django.conf import settings
from django.contrib.sites.models import Site
from django.utils import translation
from django.urls import reverse
from project.util.site_util import (
    get_site_from_request_or_default,
    get_site_type,
)

from .graphql import get_initial_session
from project import contentful

# This is changed by test suites to ensure that
# everything works okay when the server-side renderer fails
# (relatively) gracefully.
TEST_INTERNAL_SERVER_ERROR = False


def get_webpack_public_path_url() -> str:
    return f"{settings.STATIC_URL}frontend/"


def get_enabled_locales() -> List[str]:
    return [locale for locale, name in settings.LANGUAGES]


def create_initial_props_for_lambda(
    site: Site,
    url: str,
    locale: str,
    initial_session: Dict[str, Any],
    origin_url: str,
    legacy_form_submission: Optional[Dict[str, Any]] = None,
):
    webpack_public_path_url = get_webpack_public_path_url()
    site_type = get_site_type(site)

    # Currently, the schema for this structure needs to be mirrored
    # in the AppProps interface in frontend/lib/app.tsx. So if you
    # add or remove anything here, make sure to do the same over there!
    initial_props: Dict[str, Any] = {
        "initialURL": url,
        "initialSession": initial_session,
        "locale": locale,
        "server": {
            "originURL": origin_url,
            "siteName": site.name,
            "siteType": site_type,
            "staticURL": settings.STATIC_URL,
            "webpackPublicPathURL": webpack_public_path_url,
            "adminIndexURL": reverse("admin:index"),
            "batchGraphQLURL": reverse("batch-graphql"),
            "finishedLocPdfURL": reverse("finished_loc_pdf"),
            "enableSafeModeURL": reverse("safe_mode:enable"),
            "previewHardshipDeclarationURL": reverse("evictionfree:preview_declaration_pdf"),
            "submittedHardshipDeclarationURL": reverse("evictionfree:submitted_declaration_pdf"),
            "navbarLabel": settings.NAVBAR_LABEL,
            "wowOrigin": settings.WOW_ORIGIN,
            "efnycOrigin": settings.EFNYC_ORIGIN,
            "enableEmergencyHPAction": settings.ENABLE_EMERGENCY_HP_ACTION,
            "mapboxAccessToken": settings.MAPBOX_ACCESS_TOKEN,
            "isDemoDeployment": settings.IS_DEMO_DEPLOYMENT,
            "enabledLocales": get_enabled_locales(),
            "enableWipLocales": settings.ENABLE_WIP_LOCALES,
            "debug": settings.DEBUG,
            "facebookAppId": settings.FACEBOOK_APP_ID,
            "nycGeoSearchOrigin": settings.NYC_GEOSEARCH_ORIGIN,
            "contentfulCommonStrings": contentful.get_common_strings(),
            "extraDevLinks": [
                dict(
                    name="Mailchimp subscribe API documentation",
                    url=reverse("mailchimp:subscribe"),
                ),
                dict(
                    name="NYCx API documentation",
                    url=reverse("nycx:index"),
                ),
                dict(name="Example letter PDF", url=reverse("loc_example", args=("pdf",))),
                dict(
                    name="Example letter PDF (HTML preview)",
                    url=reverse("loc_example", args=("html",)),
                ),
            ],
        },
        "testInternalServerError": TEST_INTERNAL_SERVER_ERROR,
    }

    if legacy_form_submission is not None:
        initial_props["legacyFormSubmission"] = legacy_form_submission

    return initial_props


def create_initial_props_for_lambda_from_request(
    request,
    url: str,
    legacy_form_submission: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    locale = translation.get_language_from_request(request, check_path=True)

    return create_initial_props_for_lambda(
        site=get_site_from_request_or_default(request),
        url=url,
        locale=locale,
        initial_session=get_initial_session(request),
        origin_url=request.build_absolute_uri("/")[:-1],
        legacy_form_submission=legacy_form_submission,
    )

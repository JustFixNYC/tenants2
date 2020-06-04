import logging
from typing import Optional
from django.contrib.sites.models import Site
from django.utils import translation
from django.conf import settings

from users.models import JustfixUser
from project.util.site_util import get_site_origin
from project.graphql_static_request import GraphQLStaticRequest
from .lambda_response import LambdaResponse
from .graphql import get_initial_session
from .initial_props import create_initial_props_for_lambda
from .views import run_react_lambda_with_prefetching

logger = logging.getLogger(__name__)


def get_language_from_url_or_default(url: str) -> str:
    '''
    Attempt to retrieve the language code from the given URL.
    If the given URL has no locale prefix, return the
    default language.
    '''

    return translation.get_language_from_path(url) or settings.LANGUAGE_CODE


def render_raw_lambda_static_content(
    url: str,
    site: Site,
    user: Optional[JustfixUser] = None,
) -> Optional[LambdaResponse]:
    '''
    This function can be used by the server to render static content in the
    lambda service. Normally such content is delivered directly to a user's
    browser, but sometimes we want to access it in the server so we can
    do other things with it, e.g. generate a PDF to send to an API, or
    render an HTML email.
    '''

    request = GraphQLStaticRequest(user=user)
    initial_props = create_initial_props_for_lambda(
        site=site,
        url=url,
        locale=get_language_from_url_or_default(url),
        initial_session=get_initial_session(request),
        origin_url=get_site_origin(site),
    )
    lr = run_react_lambda_with_prefetching(initial_props, request)
    if not (lr.is_static_content and lr.status == 200):
        logger.error(
            "Expected (is_static_content=True, status=200) but got "
            f"(is_static_content={lr.is_static_content}, status={lr.status}) for "
            f"{url}"
        )
        return None
    return lr

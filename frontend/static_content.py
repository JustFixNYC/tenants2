import logging
from enum import Enum
from typing import Optional, NamedTuple, Dict, Any
from django.contrib.sites.models import Site
from django.utils import translation
from django.conf import settings
from django.urls import reverse

from users.models import JustfixUser
from project.util.site_util import get_site_origin, get_site_of_type
from project.util.html_to_text import html_to_text
from project.graphql_static_request import GraphQLStaticRequest
from .lambda_response import LambdaResponse
from .graphql import get_initial_session
from .initial_props import create_initial_props_for_lambda
from .views import run_react_lambda_with_prefetching

logger = logging.getLogger(__name__)


class ContentType(Enum):
    HTML = None
    PLAINTEXT = "text/plain; charset=utf-8"
    PDF = "application/pdf"


def get_language_from_url_or_default(url: str) -> str:
    '''
    Attempt to retrieve the language code from the given URL.
    If the given URL has no locale prefix, return the
    default language.
    '''

    return translation.get_language_from_path(url) or settings.LANGUAGE_CODE


def react_render(
    site_type: str,
    locale: str,
    url: str,
    expected_content_type: ContentType,
    user: Optional[JustfixUser] = None,
    session: Optional[Dict[str, Any]] = None,
    locale_prefix_url: bool = True,
) -> LambdaResponse:
    '''
    Renders the given front-end URL in a React lambda process,
    automatically prefixing it with the given locale if needed, and
    verifies that it was successful and of the expected
    content type.
    '''

    prefix = reverse('react') if locale_prefix_url else "/"

    with translation.override(locale):
        full_url = f"{prefix}{url}"
        lr = render_raw_lambda_static_content(
            url=full_url,
            site=get_site_of_type(site_type),
            user=user,
            session=session,
        )
    assert lr is not None, f"Rendering of {full_url} must succeed"
    content_type = lr.http_headers.get('Content-Type')
    assert content_type == expected_content_type.value, (
        f"Expected Content-Type of {full_url} to be "
        f"{expected_content_type}, but it is {content_type}"
    )
    return lr


class Email(NamedTuple):
    '''
    Data structure that encapsulates email content.
    '''

    subject: str
    body: str


def react_render_email(
    site_type: str,
    locale: str,
    url: str,
    user: Optional[JustfixUser] = None,
    session: Optional[Dict[str, Any]] = None,
) -> Email:
    '''
    Renders an email in the front-end, using the given locale,
    and returns it.
    '''

    lr = react_render(
        site_type,
        locale,
        url,
        ContentType.PLAINTEXT,
        user=user,
        session=session,
    )
    return Email(
        subject=lr.http_headers['X-JustFix-Email-Subject'],
        body=html_to_text(lr.html),
    )


def render_raw_lambda_static_content(
    url: str,
    site: Site,
    user: Optional[JustfixUser] = None,
    session: Optional[Dict[str, Any]] = None,
) -> Optional[LambdaResponse]:
    '''
    This function can be used by the server to render static content in the
    lambda service. Normally such content is delivered directly to a user's
    browser, but sometimes we want to access it in the server so we can
    do other things with it, e.g. generate a PDF to send to an API, or
    render an HTML email.
    '''

    request = GraphQLStaticRequest(user=user, session=session)
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

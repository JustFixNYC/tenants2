import time
import logging
from django.http import HttpResponseBadRequest, HttpResponse
from django.utils.safestring import SafeString
from django.shortcuts import render, redirect
from django.conf import settings
from project.justfix_environment import BASE_DIR
from project.util.lambda_service import LambdaService

from .graphql import execute_query
from .lambda_response import GraphQLQueryPrefetchInfo, LambdaResponse
from .legacy_forms import LegacyFormSubmissionError, get_legacy_form_submission
from .initial_props import create_initial_props_for_lambda_from_request

NS_PER_MS = 1e+6

LAMBDA_SCRIPT = BASE_DIR / 'lambda.js'

logger = logging.getLogger(__name__)

lambda_service: LambdaService

if settings.USE_LAMBDA_HTTP_SERVER:
    from project.util.lambda_http_client import LambdaHttpClient

    lambda_service = LambdaHttpClient(
        'ReactHttp',
        LAMBDA_SCRIPT,
        script_args=['--serve-http'],
        cwd=BASE_DIR,
        restart_on_script_change=settings.DEBUG
    )
else:
    from project.util.lambda_pool import LambdaPool

    lambda_service = LambdaPool(
        'React',
        LAMBDA_SCRIPT,
        cwd=BASE_DIR,
        restart_on_script_change=settings.DEBUG
    )


def run_react_lambda(initial_props, initial_render_time: int = 0) -> LambdaResponse:
    start_time = time.time_ns()
    response = lambda_service.run_handler(initial_props)
    render_time = initial_render_time + int((time.time_ns() - start_time) / NS_PER_MS)

    pf = response['graphQLQueryToPrefetch']
    if pf is not None:
        pf = GraphQLQueryPrefetchInfo(
            graphql=pf['graphQL'],
            input=pf['input']
        )

    lr = LambdaResponse(
        html=SafeString(response['html']),
        is_static_content=response['isStaticContent'],
        http_headers=response['httpHeaders'],
        modal_html=SafeString(response['modalHtml']),
        title_tag=SafeString(response['titleTag']),
        meta_tags=SafeString(response['metaTags']),
        script_tags=SafeString(response['scriptTags']),
        status=response['status'],
        location=response['location'],
        traceback=response['traceback'],
        graphql_query_to_prefetch=pf,
        render_time=render_time
    )

    if lr.status == 500:
        logger.error(lr.traceback)

    if lr.is_static_content:
        lr = lr._replace(html="<!DOCTYPE html>" + lr.html)

    return lr


def run_react_lambda_with_prefetching(initial_props, request) -> LambdaResponse:
    lambda_response = run_react_lambda(initial_props)

    if lambda_response.status == 200 and lambda_response.graphql_query_to_prefetch:
        # The page rendered, but it has a "loading..." message somewhere on it
        # that's waiting for a GraphQL request to complete. Let's pre-fetch that
        # request and re-render the page, so that the user receives it without
        # any such messages (and so the user can see all the content if their
        # JS isn't working).
        pfquery = lambda_response.graphql_query_to_prefetch
        initial_props['server']['prefetchedGraphQLQueryResponse'] = {
            'graphQL': pfquery.graphql,
            'input': pfquery.input,
            'output': execute_query(request, pfquery.graphql, pfquery.input)
        }
        lambda_response = run_react_lambda(
            initial_props,
            initial_render_time=lambda_response.render_time
        )

    return lambda_response


def render_lambda_static_content(lr: LambdaResponse):
    ctype = lr.http_headers.get('Content-Type')
    if ctype is None:
        res = HttpResponse(lr.html, status=lr.status)
    elif ctype == 'application/pdf':
        from loc.views import pdf_response
        res = pdf_response(lr.html)
    elif ctype == 'text/plain; charset=utf-8':
        from project.util.html_to_text import html_to_text
        res = HttpResponse(
            html_to_text(lr.html).encode("utf-8"),
            status=lr.status
        )
    else:
        raise ValueError(f'Invalid Content-Type from lambda response: {ctype}')

    for key, value in lr.http_headers.items():
        res[key] = value
    return res


def react_rendered_view(request):
    url = request.path
    querystring = request.GET.urlencode()
    if querystring:
        url += f'?{querystring}'

    legacy_form_submission = None

    if request.method == "POST":
        try:
            # It's important that we process the legacy form submission
            # *before* getting the initial session, so that when we
            # get the initial session, it reflects any state changes
            # made by the form submission. This will ensure the same
            # behavior between baseline (non-JS) and progressively
            # enhanced (JS) clients.
            legacy_form_submission = get_legacy_form_submission(request)
        except LegacyFormSubmissionError as e:
            return HttpResponseBadRequest(e.args[0])

    initial_props = create_initial_props_for_lambda_from_request(
        request,
        url=url,
        legacy_form_submission=legacy_form_submission,
    )

    lambda_response = run_react_lambda_with_prefetching(initial_props, request)

    script_tags = lambda_response.script_tags
    if lambda_response.status == 500:
        script_tags = ''
    elif lambda_response.status == 302 and lambda_response.location:
        return redirect(to=lambda_response.location)

    logger.debug(f"Rendering {url} in Node.js took {lambda_response.render_time} ms.")

    if lambda_response.is_static_content:
        return render_lambda_static_content(lambda_response)

    return render(request, 'frontend/index.html', {
        'initial_render': lambda_response.html,
        'locale': initial_props['locale'],
        'enable_analytics': not request.user.is_staff,
        'modal_html': lambda_response.modal_html,
        'title_tag': lambda_response.title_tag,
        'site_type': initial_props['server']['siteType'],
        'meta_tags': lambda_response.meta_tags,
        'script_tags': script_tags,
        'initial_props': initial_props,
    }, status=lambda_response.status)

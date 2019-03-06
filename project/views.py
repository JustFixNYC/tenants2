import time
import logging
from typing import NamedTuple, List, Dict, Any, Optional
from django.http import HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.utils.safestring import SafeString
from django.shortcuts import render, redirect
from django.urls import reverse
from django.conf import settings

from project.util import django_graphql_forms
from project.justfix_environment import BASE_DIR
from project.util.lambda_pool import LambdaPool
from project.schema import schema
import project.health

# This is changed by test suites to ensure that
# everything works okay when the server-side renderer fails
# (relatively) gracefully.
TEST_INTERNAL_SERVER_ERROR = False

FRONTEND_QUERY_DIR = BASE_DIR / 'frontend' / 'lib' / 'queries'

NS_PER_MS = 1e+6

logger = logging.getLogger(__name__)

lambda_pool = LambdaPool(
    'React',
    BASE_DIR / 'lambda.js',
    cwd=BASE_DIR,
    restart_on_script_change=settings.DEBUG
)


class LambdaResponse(NamedTuple):
    '''
    Encapsulates the result of the server-side renderer.

    This is more or less the same as the LambdaResponse
    interface defined in frontend/lambda/lambda.tsx.
    '''

    html: SafeString
    title_tag: SafeString
    meta_tags: SafeString
    status: int
    bundle_files: List[str]
    modal_html: SafeString
    location: Optional[str]
    traceback: Optional[str]

    # The amount of time rendering took, in milliseconds.
    render_time: int


def run_react_lambda(initial_props) -> LambdaResponse:
    start_time = time.time_ns()
    response = lambda_pool.run_handler(initial_props)
    render_time = int((time.time_ns() - start_time) / NS_PER_MS)

    return LambdaResponse(
        html=SafeString(response['html']),
        modal_html=SafeString(response['modalHtml']),
        title_tag=SafeString(response['titleTag']),
        meta_tags=SafeString(response['metaTags']),
        status=response['status'],
        bundle_files=response['bundleFiles'],
        location=response['location'],
        traceback=response['traceback'],
        render_time=render_time
    )


def execute_query(request, query: str, variables=None) -> Dict[str, Any]:
    result = schema.execute(query, context=request, variables=variables)
    if result.errors:
        raise Exception(result.errors)
    return result.data


def get_initial_session(request) -> Dict[str, Any]:
    data = execute_query(
        request,
        '''
        query GetInitialSession {
            session {
                ...AllSessionInfo
            }
        }
        %s
        ''' % (FRONTEND_QUERY_DIR / 'AllSessionInfo.graphql').read_text(),
    )
    return data['session']


class LegacyFormSubmissionError(Exception):
    pass


def fix_newlines(d: Dict[str, str]) -> Dict[str, str]:
    result = dict()
    result.update(d)
    for key in d:
        result[key] = result[key].replace('\r\n', '\n')
    return result


def get_legacy_form_submission(request):
    graphql = request.POST.get('graphql')

    if not graphql:
        raise LegacyFormSubmissionError('No GraphQL query found')

    input_type = django_graphql_forms.get_input_type_from_query(graphql)

    if not input_type:
        raise LegacyFormSubmissionError('Invalid GraphQL query')

    form_class = django_graphql_forms.get_form_class_for_input_type(input_type)

    if not form_class:
        raise LegacyFormSubmissionError('Invalid GraphQL input type')

    formset_classes = django_graphql_forms.get_formset_classes_for_input_type(input_type)

    input = django_graphql_forms.convert_post_data_to_input(
        form_class, request.POST, formset_classes)

    result = execute_query(request, graphql, variables={'input': input})

    return {
        'input': input,
        'result': result['output'],
        'POST': fix_newlines(request.POST.dict())
    }


def react_rendered_view(request, url: str):
    url = f'/{url}'
    querystring = request.GET.urlencode()
    if querystring:
        url += f'?{querystring}'
    webpack_public_path_url = f'{settings.STATIC_URL}frontend/'

    # Currently, the schema for this structure needs to be mirrored
    # in the AppProps interface in frontend/lib/app.tsx. So if you
    # add or remove anything here, make sure to do the same over there!
    initial_props = {
        'initialURL': url,
        'initialSession': get_initial_session(request),
        'locale': '',  # Disable localization for now.
        'server': {
            'originURL': request.build_absolute_uri('/')[:-1],
            'staticURL': settings.STATIC_URL,
            'webpackPublicPathURL': webpack_public_path_url,
            'adminIndexURL': reverse('admin:index'),
            'batchGraphQLURL': reverse('batch-graphql'),
            'locHtmlURL': reverse('loc', args=('html',)),
            'locPdfURL': reverse('loc', args=('pdf',)),
            'redirectToLegacyAppURL': reverse('redirect-to-legacy-app'),
            'debug': settings.DEBUG
        },
        'testInternalServerError': TEST_INTERNAL_SERVER_ERROR,
    }

    if request.method == "POST":
        try:
            legacy_form_submission = get_legacy_form_submission(request)
        except LegacyFormSubmissionError as e:
            return HttpResponseBadRequest(e.args[0])
        initial_props['legacyFormSubmission'] = legacy_form_submission

    lambda_response = run_react_lambda(initial_props)
    bundle_files = lambda_response.bundle_files
    bundle_urls = [
        f'{webpack_public_path_url}{bundle_file}'
        for bundle_file in bundle_files
    ]
    if lambda_response.status == 500:
        # It's a 500 error page, don't include any client-side JS.
        bundle_urls = []
        logger.error(lambda_response.traceback)
    elif lambda_response.status == 302 and lambda_response.location:
        return redirect(to=lambda_response.location)

    logger.debug(f"Rendering {url} in Node.js took {lambda_response.render_time} ms.")

    return render(request, 'index.html', {
        'initial_render': lambda_response.html,
        'modal_html': lambda_response.modal_html,
        'title_tag': lambda_response.title_tag,
        'meta_tags': lambda_response.meta_tags,
        'bundle_urls': bundle_urls,
        'initial_props': initial_props,
    }, status=lambda_response.status)


@csrf_exempt
@require_POST
def example_server_error(request, id: str):
    '''
    This endpoint can be used to test integration with whatever
    error reporting system is configured.
    '''

    logger.error(
        f"This is an example server error log message with id '{id}'. "
        f"If you can read this, it means errors from the logging system "
        f"are being reported properly."
    )
    raise Exception(
        f"This is an example server exception with id '{id}'. "
        f"If you can read this, it means unexpected internal server "
        f"errors are being reported properly."
    )


def redirect_favicon(request):
    return redirect(f'{settings.STATIC_URL}favicon.ico')


def health(request):
    return project.health.check().to_json_response()

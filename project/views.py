import time
import logging
from typing import NamedTuple, List, Dict, Any, Optional
from django.utils.safestring import SafeString
from django.shortcuts import render, redirect
from django.urls import reverse
from django.conf import settings

from project.justfix_environment import BASE_DIR
from project.util.lambda_pool import LambdaPool
from project.schema import schema

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
    interface defined in frontend/lambda/lambda.ts.
    '''

    html: SafeString
    title_tag: SafeString
    status: int
    bundle_files: List[str]
    modal_html: SafeString
    location: Optional[str]

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
        status=response['status'],
        bundle_files=response['bundleFiles'],
        location=response['location'],
        render_time=render_time
    )


def execute_query(request, query: str) -> Dict[str, Any]:
    result = schema.execute(query, context_value=request)
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


def react_rendered_view(request, url: str):
    url = f'/{url}'
    webpack_public_path_url = f'{settings.STATIC_URL}frontend/'

    # Currently, the schema for this structure needs to be mirrored
    # in the AppProps interface in frontend/lib/app.tsx. So if you
    # add or remove anything here, make sure to do the same over there!
    initial_props = {
        'initialURL': url,
        'initialSession': get_initial_session(request),
        'server': {
            'staticURL': settings.STATIC_URL,
            'webpackPublicPathURL': webpack_public_path_url,
            'adminIndexURL': reverse('admin:index'),
            'batchGraphQLURL': reverse('batch-graphql'),
            'debug': settings.DEBUG
        },
        'testInternalServerError': TEST_INTERNAL_SERVER_ERROR,
    }

    if request.method == "POST":
        # TODO: This is just example code to make a test pass. We
        # need to replace it with real code!
        assert 'graphql' in request.POST
        initial_props['legacyFormSubmission'] = {
            'input': {
                'exampleField': request.POST['exampleField']
            },
            'result': {
                'errors': [{
                    'field': 'exampleField',
                    'messages': ['This value is too long or something']
                }]
            }
        }

    lambda_response = run_react_lambda(initial_props)
    bundle_files = lambda_response.bundle_files + ['main.bundle.js']
    bundle_urls = [
        f'{webpack_public_path_url}{bundle_file}'
        for bundle_file in bundle_files
    ]
    if lambda_response.status == 500:
        # It's a 500 error page, don't include any client-side JS.
        bundle_urls = []
    elif lambda_response.status == 302 and lambda_response.location:
        return redirect(to=lambda_response.location)

    logger.info(f"Rendering {url} in Node.js took {lambda_response.render_time} ms.")

    return render(request, 'index.html', {
        'initial_render': lambda_response.html,
        'modal_html': lambda_response.modal_html,
        'title_tag': lambda_response.title_tag,
        'bundle_urls': bundle_urls,
        'initial_props': initial_props,
    }, status=lambda_response.status)

import json
import subprocess
import time
import logging
from typing import NamedTuple
from django.utils.safestring import SafeString
from django.shortcuts import render
from django.middleware import csrf
from django.urls import reverse
from django.conf import settings

from project.justfix_environment import BASE_DIR

NS_PER_MS = 1e+6

logger = logging.getLogger(__name__)


class LambdaResponse(NamedTuple):
    '''
    Encapsulates the result of the server-side renderer.

    This is more or less the same as the LambdaResponse
    interface defined in frontend/lambda/lambda.ts.
    '''

    html: SafeString
    status: int

    # The amount of time rendering took, in milliseconds.
    render_time: int


def run_react_lambda(initial_props) -> LambdaResponse:
    start_time = time.time_ns()
    result = subprocess.run(
        ['node', 'lambda.js'],
        input=json.dumps(initial_props).encode('utf-8'),
        stdout=subprocess.PIPE,
        check=True,
        cwd=BASE_DIR
    )
    render_time = int((time.time_ns() - start_time) / NS_PER_MS)

    response = json.loads(result.stdout.decode('utf-8'))

    return LambdaResponse(
        html=SafeString(response['html']),
        status=response['status'],
        render_time=render_time
    )


def react_rendered_view(request, url: str):
    if request.user.is_authenticated:
        username = request.user.username
    else:
        username = None

    url = f'/{url}'

    # Currently, the schema for this structure needs to be mirrored
    # in the AppProps interface in frontend/lib/app.tsx. So if you
    # add or remove anything here, make sure to do the same over there!
    initial_props = {
        'initialURL': url,
        'initialSession': {
            'csrfToken': csrf.get_token(request),
            'username': username,
        },
        'server': {
            'staticURL': settings.STATIC_URL,
            'adminIndexURL': reverse('admin:index'),
            'batchGraphQLURL': reverse('batch-graphql'),
            'debug': settings.DEBUG
        },
    }

    lambda_response = run_react_lambda(initial_props)

    logger.info(f"Rendering {url} in Node.js took {lambda_response.render_time} ms.")

    return render(request, 'index.html', {
        'initial_render': lambda_response.html,
        'initial_props': initial_props,
    }, status=lambda_response.status)

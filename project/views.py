import atexit
import json
import subprocess
import time
import logging
from threading import RLock
from typing import NamedTuple, List
from django.utils.safestring import SafeString
from django.shortcuts import render
from django.middleware import csrf
from django.urls import reverse
from django.conf import settings

from project.justfix_environment import BASE_DIR

LAMBDA_POOL_SIZE = 5

LAMBDA_TIMEOUT_SECS = 5

NS_PER_MS = 1e+6

LAMBDA_JS_PATH = BASE_DIR / 'lambda.js'

logger = logging.getLogger(__name__)

lambda_pool: List[subprocess.Popen] = []

lambda_pool_lock = RLock()

lambda_js_mtime = 0.0


class LambdaResponse(NamedTuple):
    '''
    Encapsulates the result of the server-side renderer.

    This is more or less the same as the LambdaResponse
    interface defined in frontend/lambda/lambda.ts.
    '''

    html: SafeString
    status: int
    bundle_files: List[str]

    # The amount of time rendering took, in milliseconds.
    render_time: int


def create_lambda_runner() -> subprocess.Popen:
    child = subprocess.Popen(
        ['node', str(LAMBDA_JS_PATH)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        cwd=BASE_DIR
    )
    logger.info(f"Created React lambda runner with pid {child.pid}.")
    return child


@atexit.register
def empty_lambda_pool():
    with lambda_pool_lock:
        while lambda_pool:
            child = lambda_pool.pop()
            child.kill()
            logger.info(f"Destroyed React lambda runner with pid {child.pid}.")


def get_lambda_runner_from_pool() -> subprocess.Popen:
    global lambda_js_mtime

    with lambda_pool_lock:
        if settings.DEBUG:
            mtime = LAMBDA_JS_PATH.stat().st_mtime
            if mtime != lambda_js_mtime:
                lambda_js_mtime = mtime
                logger.info(
                    f"Change detected in {LAMBDA_JS_PATH.name}, "
                    "restarting React lambda runners."
                )
                empty_lambda_pool()
        while len(lambda_pool) < LAMBDA_POOL_SIZE:
            lambda_pool.append(create_lambda_runner())
        return lambda_pool.pop(0)


def run_react_lambda(initial_props) -> LambdaResponse:
    start_time = time.time_ns()
    child = get_lambda_runner_from_pool()
    try:
        (stdout, _) = child.communicate(
            json.dumps(initial_props).encode('utf-8'),
            LAMBDA_TIMEOUT_SECS
        )
    except subprocess.TimeoutExpired as e:
        child.kill()
        logger.warn(f"Killed runaway React lambda runner with pid {child.pid}.")
        raise e

    if child.returncode != 0:
        raise Exception('React lambda runner failed')

    render_time = int((time.time_ns() - start_time) / NS_PER_MS)

    response = json.loads(stdout.decode('utf-8'))

    return LambdaResponse(
        html=SafeString(response['html']),
        status=response['status'],
        bundle_files=response['bundleFiles'],
        render_time=render_time
    )


def react_rendered_view(request, url: str):
    if request.user.is_authenticated:
        phone_number = request.user.phone_number
    else:
        phone_number = None

    url = f'/{url}'
    webpack_public_path_url = f'{settings.STATIC_URL}frontend/'

    # Currently, the schema for this structure needs to be mirrored
    # in the AppProps interface in frontend/lib/app.tsx. So if you
    # add or remove anything here, make sure to do the same over there!
    initial_props = {
        'initialURL': url,
        'initialSession': {
            'csrfToken': csrf.get_token(request),
            'phoneNumber': phone_number,
        },
        'server': {
            'staticURL': settings.STATIC_URL,
            'webpackPublicPathURL': webpack_public_path_url,
            'adminIndexURL': reverse('admin:index'),
            'batchGraphQLURL': reverse('batch-graphql'),
            'debug': settings.DEBUG
        },
    }

    lambda_response = run_react_lambda(initial_props)
    bundle_files = lambda_response.bundle_files + ['main.bundle.js']
    bundle_urls = [
        f'{webpack_public_path_url}{bundle_file}'
        for bundle_file in bundle_files
    ]

    logger.info(f"Rendering {url} in Node.js took {lambda_response.render_time} ms.")

    return render(request, 'index.html', {
        'initial_render': lambda_response.html,
        'bundle_urls': bundle_urls,
        'initial_props': initial_props,
    }, status=lambda_response.status)

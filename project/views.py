import json
import subprocess
from django.utils.safestring import SafeString
from django.shortcuts import render
from django.middleware import csrf
from django.urls import reverse
from django.conf import settings

from project.justfix_environment import BASE_DIR


def get_initial_render(initial_props) -> SafeString:
    result = subprocess.run(
        ['node', 'lambda.js'],
        input=json.dumps(initial_props).encode('utf-8'),
        stdout=subprocess.PIPE,
        check=True,
        cwd=BASE_DIR
    )
    return SafeString(result.stdout.decode('utf-8'))


def react_rendered_view(request, url):
    if request.user.is_authenticated:
        username = request.user.username
    else:
        username = None

    # Currently, the schema for this structure needs to be mirrored
    # in the AppProps interface in frontend/lib/app.tsx. So if you
    # add or remove anything here, make sure to do the same over there!
    initial_props = {
        'initialURL': f'/{url}',
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

    return render(request, 'index.html', {
        'initial_render': get_initial_render(initial_props),
        'initial_props': initial_props,
    })

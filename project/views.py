import json
import subprocess
from django.utils.safestring import SafeString
from django.shortcuts import render

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


def index(request):
    initial_props = {
        'loadingMessage': 'Please wait while I compute things.'
    }

    return render(request, 'index.html', {
        'initial_render': get_initial_render(initial_props),
        'initial_props': initial_props,
    })

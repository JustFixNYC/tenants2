import re
import pytest
from django.urls import path
from django.template import RequestContext
from django.template import Template
from django.http import HttpResponse

from project.context_processors import ga_snippet


def show_ga_snippet(request):
    template = Template('{{ GA_SNIPPET }}')
    return HttpResponse(template.render(RequestContext(request)))


urlpatterns = [
    path('ga', show_ga_snippet)
]


def test_ga_snippet_is_empty_when_tracking_id_is_not_set(settings):
    settings.GA_TRACKING_ID = ''
    assert ga_snippet(None) == ''


@pytest.mark.urls(__name__)
def test_ga_snippet_works(client, settings):
    settings.GA_TRACKING_ID = 'UA-1234'
    res = client.get('/ga')
    assert res.status_code == 200
    html = res.content.decode('utf-8')
    assert 'UA-1234' in html
    assert "window.GA_TRACKING_ID = 'UA-1234';" in html
    match = re.search(r'script nonce="([^"]+)"', html)
    nonce = match.group(1)
    assert f"nonce-{nonce}" in res['Content-Security-Policy']

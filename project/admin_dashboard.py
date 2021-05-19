import json
from typing import Dict, Any, List
from urllib.parse import urlparse
from pathlib import Path
from django.urls import path
from django.utils.text import slugify
from django.template.response import TemplateResponse
from django.conf import settings
from csp.decorators import csp_update

from .admin_download_data import strict_get_data_download


MY_DIR = Path(__file__).parent.resolve()

SPECS_DIR = MY_DIR / "admin_dashboard"


def get_django_admin_dashboard_urls(site):
    import django_sql_dashboard.urls
    from django.urls.resolvers import URLPattern

    urlpatterns = [
        URLPattern(
            pattern=pattern.pattern,
            callback=site.admin_view(pattern.callback),
            default_args=pattern.default_args,
            name=pattern.name,
        )
        for pattern in django_sql_dashboard.urls.urlpatterns
    ]

    return (urlpatterns, "", "")


class DashboardViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path(
                "vega-dashboard/",
                self.site.admin_view(
                    # Argh, it's really unfortunate that we have to break CSP
                    # in order to use Vega, which apparently uses eval(). :(
                    #
                    # But, since our datasets never contain arbitrary string data
                    # entered by untrusted users, this *should* be ok.
                    csp_update(SCRIPT_SRC="'unsafe-eval'")(self.dashboard_view)
                ),
                name="dashboard",
            ),
        ]

    def dashboard_view(self, request):
        vizs = [Visualization(spec) for spec in get_vega_lite_specs()]
        return TemplateResponse(
            request,
            "admin/justfix/dashboard.html",
            {
                **self.site.each_context(request),
                "GA_TRACKING_ID": settings.GA_TRACKING_ID,
                "vizs": vizs,
                "viz_data": {viz.id: viz.spec for viz in vizs},
                "title": "Dashboard",
            },
        )


class Visualization:
    spec: Dict[str, Any]
    id: str
    title: str

    def __init__(self, spec: Dict[str, Any]):
        self.spec = spec
        self.title = spec["title"]
        self.anchor_id = slugify(self.title)
        self.id = f"_{self.anchor_id}"

        # We're going to show the title in the HTML, so remove it from the spec
        # so it doesn't show twice.
        del spec["title"]


def get_dataset_url(dataset: str) -> str:
    return strict_get_data_download(dataset).json_url()


def convert_spec(raw_spec: Dict[str, Any]) -> Dict[str, Any]:
    url = raw_spec["data"]["url"]
    parsed = urlparse(url)
    assert parsed.scheme == "dataset"
    raw_spec["data"]["url"] = get_dataset_url(parsed.path)
    return raw_spec


def get_vega_lite_specs() -> List[Dict[str, Any]]:
    """
    Return a list of all Vega-Lite specifications to show on the dashboard.

    Documentation on Vega-Lite can be found here:

        https://vega.github.io/vega-lite/docs/
    """

    specfiles = sorted(list(SPECS_DIR.glob("*.json")), key=lambda path: path.name)
    specs = [convert_spec(json.loads(specfile.read_text())) for specfile in specfiles]
    return specs

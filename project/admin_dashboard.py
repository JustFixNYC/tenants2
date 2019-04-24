from typing import Dict, Any, List
from django.urls import path
from django.utils.text import slugify
from django.template.response import TemplateResponse
from csp.decorators import csp_update

from .admin_download_data import strict_get_data_download


class DashboardViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path(
                "dashboard/",
                self.site.admin_view(
                    # Argh, it's really unfortunate that we have to break CSP
                    # in order to use Vega, which apparently uses eval(). :(
                    #
                    # But, since our datasets never contain arbitrary string data
                    # entered by untrusted users, this *should* be ok.
                    csp_update(SCRIPT_SRC="'unsafe-eval'")(self.dashboard_view)
                ),
                name="dashboard"
            ),
        ]

    def dashboard_view(self, request):
        vizs = [
            Visualization(spec) for spec in get_vega_lite_specs()
        ]
        return TemplateResponse(request, "admin/justfix/dashboard.html", {
            **self.site.each_context(request),
            "vizs": vizs,
            "viz_data": {
                viz.id: viz.spec for viz in vizs
            },
            "title": "Dashboard"
        })


class Visualization:
    spec: Dict[str, Any]
    id: str
    title: str

    def __init__(self, spec: Dict[str, Any]):
        self.spec = spec
        self.title = spec['title']
        self.id = slugify(self.title)

        # We're going to show the title in the HTML, so remove it from the spec
        # so it doesn't show twice.
        del spec['title']


def get_dataset_url(dataset: str) -> str:
    return strict_get_data_download(dataset).json_url()


def get_vega_lite_specs() -> List[Dict[str, Any]]:
    '''
    Return a list of all Vega-Lite specifications to show on the dashboard.

    Documentation on Vega-Lite can be found here:

        https://vega.github.io/vega-lite/docs/
    '''

    return [{
        "$schema": "https://vega.github.io/schema/vega-lite/v2.0.json",
        "title": "Users faceted by lease type",
        "data": {
            "url": get_dataset_url('userstats'),
        },
        "facet": {
            "column": {
                "field": "lease_type",
                "type": "nominal",
            }
        },
        "spec": {
            "mark": "point",
            "encoding": {
                "x": {"field": "onboarding_date", "type": "temporal"},
                "y": {"field": "issue_count", "type": "quantitative"},
                "color": {
                    "field": "letter_mail_choice",
                    "type": "nominal",
                    "scale": {
                        "domain": ["null", "USER_WILL_MAIL", "WE_WILL_MAIL"],
                        "range": ["red", "orange", "green"],
                    }
                },
                "tooltip": [
                    {"field": "issue_count", "type": "quantitative"},
                    {"field": "onboarding_date", "type": "temporal"},
                    {"field": "borough", "type": "nominal"},
                    {"field": "is_in_eviction", "type": "nominal"},
                    {"field": "needs_repairs", "type": "nominal"},
                    {"field": "has_no_services", "type": "nominal"},
                    {"field": "has_pests", "type": "nominal"},
                    {"field": "has_called_311", "type": "nominal"},
                    {"field": "was_landlord_autofilled", "type": "nominal"},
                    {"field": "is_phone_number_valid", "type": "nominal"},
                    {"field": "phone_number_type", "type": "nominal"},
                    {"field": "rapidpro_contact_groups", "type": "nominal"},
                ],
                "href": {"field": "url", "type": "nominal"}
            }
        }
    }, {
        "$schema": "https://vega.github.io/schema/vega-lite/v2.0.json",
        "title": "Issues per area",
        "data": {
            "url": get_dataset_url('issuestats'),
        },
        "mark": "bar",
        "encoding": {
            "x": {"aggregate": "sum", "field": "count", "type": "quantitative"},
            "y": {"field": "area", "type": "nominal"}
        }
    }]

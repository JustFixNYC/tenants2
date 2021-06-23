from typing import Any, Dict, Optional
from pathlib import Path
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.shortcuts import render
from django.db import connections
from django.conf import settings

from project import geocoding


MY_DIR = Path(__file__).parent.resolve()

ADDRESS_HOUSINGTYPE_SQL_FILE = MY_DIR / "address_housingtype.sql"


def make_json_error(error_code: str, status: int) -> JsonResponse:
    response = JsonResponse(
        {
            "status": status,
            "errorCode": error_code,
        },
        status=status,
    )
    return response


@require_GET
def evaluate_address(request):
    if not (settings.NYCDB_DATABASE and settings.GEOCODING_SEARCH_URL):
        # https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501
        return make_json_error("NOT_IMPLEMENTED", 501)
    text = request.GET.get("text")
    if not text:
        return make_json_error("INVALID_TEXT", 400)
    result = geocoding.search(text)
    if result is None:
        # https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502
        return make_json_error("GEOCODING_UNAVAILABLE", 502)
    response: Dict[str, Any] = {
        "status": 200,
        "result": None,
    }
    if len(result) > 0:
        first = result[0].properties
        response["result"] = {
            **first.dict(),
            "predicted_housing_type": predict_housing_type(first.pad_bbl),
        }
    return JsonResponse(response, status=200)


def predict_housing_type(bbl: str) -> Optional[str]:
    sql_query = ADDRESS_HOUSINGTYPE_SQL_FILE.read_text()
    with connections[settings.NYCDB_DATABASE].cursor() as cursor:
        cursor.execute(sql_query, {"bbl": bbl})
        # It's possible in rare cases for this query to return
        # no rows, e.g. if we've been given a bbl that isn't in PLUTO.
        result = cursor.fetchone()
        return result and result[0]


def index(request):
    return render(request, "nycx/api-docs.html")

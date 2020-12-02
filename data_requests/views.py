from project.util.streaming_csv import streaming_csv_response
from . import db_queries


def download_multi_landlord_csv(request):
    rows = db_queries.get_csv_rows_for_multi_landlord_query(request.GET.get("q", ""))
    return streaming_csv_response(rows, "multi-landlord.csv")

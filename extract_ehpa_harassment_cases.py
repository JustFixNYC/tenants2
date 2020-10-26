# Run this via e.g.:
#
#     python manage.py shell < extract_ehpa_harassment_cases.py

from django.db import connection

from project.util.streaming_json import (
    generate_json_rows,
    generate_streaming_json,
)
from ehpa_harassment_cases_stats import DATAFILE


QUERY = """
SELECT DISTINCT
    har.*
FROM
    hpaction_harassmentdetails as har
LEFT JOIN
    hpaction_hpactiondocuments as docs
    ON har.user_id = docs.user_id
WHERE
    docs.created_at >= '2020-03-01'::date
"""


with connection.cursor() as cursor:
    cursor.execute(QUERY)
    rows = generate_json_rows(cursor)
    DATAFILE.write_text(''.join(generate_streaming_json(rows)))
    print(f"Wrote {DATAFILE}.")

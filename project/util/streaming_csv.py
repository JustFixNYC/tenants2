import csv
from typing import Any, Iterator, List
from django.http import StreamingHttpResponse


def transform_csv_row(row: Iterator[Any]) -> Iterator[Any]:
    for item in row:
        if isinstance(item, (list, tuple)):
            # Since CSVs can't contain heirarchial data, we'll
            # concatenate the list into a single comma-separated field,
            # which is similar to how Google Forms handles checkboxes.
            yield ", ".join([str(listitem) for listitem in item])
        else:
            yield item


def generate_csv_rows(cursor) -> Iterator[List[Any]]:
    yield [column.name for column in cursor.description]

    while True:
        row = cursor.fetchone()
        if row is None:
            break
        yield list(transform_csv_row(row))


# This is a variation on the Echo class from the Django docs:
# https://docs.djangoproject.com/en/2.1/howto/outputting-csv/#streaming-large-csv-files
#
# It seems, though, that the original class was using an undocumented feature
# of the csvwriter.writerow() method, which isn't actually supposed to return
# anything, so instead we'll just store the latest written data in an attribute.
#
# It is very odd that this is so complicated.
class Echo:
    value: str = ""

    def write(self, value: str):
        assert isinstance(value, str)
        self.value += value


def generate_streaming_csv(rows: Iterator[List[Any]]) -> Iterator[str]:
    pseudo_buffer = Echo()
    writer = csv.writer(pseudo_buffer)
    for row in rows:
        writer.writerow(row)
        yield pseudo_buffer.value
        pseudo_buffer.value = ""


def streaming_csv_response(rows: Iterator[List[Any]], filename: str) -> StreamingHttpResponse:
    response = StreamingHttpResponse(generate_streaming_csv(rows), content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response

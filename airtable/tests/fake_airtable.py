from ..record import Record, Fields
from .test_api import RECORD


class FakeAirtable:
    def __init__(self):
        self._records = []
        self._next_id = 1

    def list(self):
        for record in self._records:
            yield record.copy()

    def get(self, pk):
        records = [r for r in self._records if r.fields_.pk == pk]
        if records:
            return records[0].copy()
        return None

    def create(self, fields):
        record = Record(**{**RECORD, "id": str(self._next_id), "fields": fields.dict()})
        self._next_id += 1
        self._records.append(record.copy())
        return record

    def update(self, record, fields):
        our_record = [r for r in self._records if r.fields_.pk == record.fields_.pk][0]
        our_record.fields_ = Fields(**{**our_record.fields_.dict(), **fields.dict()})

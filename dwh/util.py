from typing import List, Any
from contextlib import contextmanager
from django.db import transaction


def uuid_from_url(url: str) -> str:
    """
    Given a RapidPro URL for editing a flow or filtering for a group, return the UUID of
    the flow or group.

    >>> uuid_from_url('https://textit.in/flow/editor/367fb415-29bd-4d98-8e42-40cba0dc8a97/')
    '367fb415-29bd-4d98-8e42-40cba0dc8a97'

    >>> uuid_from_url('https://textit.in/contact/filter/846c2eb8-45e8-48c5-b130-02c53be1aece/')
    '846c2eb8-45e8-48c5-b130-02c53be1aece'
    """

    return url.split("/")[-2]


def iter_cursor_dicts(cursor):
    """
    Return an iterator over the dict representations of the given cursor's rows.
    """

    columns = [column.name for column in cursor.description]

    for row in cursor.fetchall():
        yield dict(zip(columns, row))


class BatchWriter:
    """
    A context manager for writing out Django models in bulk batches, to
    speed up database writes.
    """

    def __init__(self, model_class, batch_size=1000, ignore_conflicts=False, silent=False):
        self.model_class = model_class
        self.models: List[Any] = []
        self.batch_size = batch_size
        self.ignore_conflicts = ignore_conflicts
        self.silent = silent

    @contextmanager
    def atomic_transaction(self, using=None, wipe=False):
        with transaction.atomic(using=using):
            if wipe:
                self.model_class.objects.all().delete()
            with self:
                yield self

    def write(self, model):
        assert isinstance(model, self.model_class)
        self.models.append(model)
        if len(self.models) >= self.batch_size:
            self.flush()

    def flush(self):
        if self.models:
            if not self.silent:
                print(f"Writing {len(self.models)} records.")
            self.model_class.objects.bulk_create(
                self.models,
                ignore_conflicts=self.ignore_conflicts,
            )
            self.models = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if exc_type is None:
            self.flush()

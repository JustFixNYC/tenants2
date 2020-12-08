from typing import List, Dict, Union, Any


class InstanceChangeTracker:
    """
    A utility class that can be used to help keep track of whether a model's
    fields have changed during its lifetime as a Python object.

    It is *not* useful for tracking a model's changes over time in a database.

    For example, given the following model:

        >>> from dataclasses import dataclass
        >>> @dataclass
        ... class Thing:
        ...    foo: str
        ...    bar: str
        >>> thing = Thing('hello', 'there')

    We can create a tracker on its "foo" property, which tells us its
    instance hasn't been changed:

        >>> tracker = InstanceChangeTracker(thing, ['foo'])
        >>> tracker.has_changed()
        False

    Once we change the "foo" property, it tells us it has been changed:

        >>> thing.foo = "zzz"
        >>> tracker.has_changed()
        True

    We can then tell it to consider the current state as being unchanged:

        >>> tracker.set_to_unchanged()
        >>> tracker.has_changed()
        False
    """

    # The types of fields we support.
    field_type = Union[str]

    # A dictionary that keeps track of the "original" values of a model's
    # fields.
    original_values: Dict[str, field_type]

    def __init__(self, instance: Any, field_names: List[str]) -> None:
        self.instance = instance
        self.field_names = field_names
        self.original_values = {}
        self.set_to_unchanged()

    def are_any_fields_blank(self) -> bool:
        """
        Returns whether or not the current value of any of our tracked fields
        are blank/empty.
        """

        for name in self.field_names:
            if not getattr(self.instance, name):
                return True
        return False

    def set_to_unchanged(self) -> None:
        """
        Remember the current values of the tracked fields as being the "original"
        values.
        """

        for name in self.field_names:
            value = getattr(self.instance, name)
            self.original_values[name] = value

    def has_changed(self) -> bool:
        """
        Return whether our tracked fields have changed since we were initialized,
        or since set_to_unchanged() was last called.
        """

        for name in self.field_names:
            value = getattr(self.instance, name)
            if value != self.original_values[name]:
                return True
        return False

from typing import NamedTuple, List
from django.contrib.auth.models import Permission


class ModelPermissions(NamedTuple):
    """
    A class that makes it a bit easier to do things with Django permissions, e.g.:

        >>> mp = ModelPermissions('myapp', 'mymodel')

        >>> mp.change
        'myapp.change_mymodel'

        >>> mp.only(add=True, delete=True)
        ['myapp.add_mymodel', 'myapp.delete_mymodel']

        >>> mp.all
        ['myapp.add_mymodel', 'myapp.change_mymodel', 'myapp.delete_mymodel']
    """

    app: str
    model: str

    def _prefix(self, prefix: str) -> str:
        return f"{self.app}.{prefix}_{self.model}"

    @property
    def add(self) -> str:
        return self._prefix("add")

    @property
    def change(self) -> str:
        return self._prefix("change")

    @property
    def delete(self) -> str:
        return self._prefix("delete")

    @property
    def view(self) -> str:
        return self._prefix("view")

    @property
    def all(self) -> List[str]:
        return [self.add, self.change, self.delete]

    def only(self, add: bool = False, change: bool = False, delete: bool = False) -> List[str]:
        result: List[str] = []
        if add:
            result.append(self.add)
        if change:
            result.append(self.change)
        if delete:
            result.append(self.delete)
        return result


def get_permissions_from_ns_codenames(ns_codenames):
    """
    Returns a list of Permission objects for the specified namespaced codenames
    """

    splitnames = [ns_codename.split(".") for ns_codename in ns_codenames]
    return [
        Permission.objects.get(codename=codename, content_type__app_label=app_label)
        for app_label, codename in splitnames
    ]

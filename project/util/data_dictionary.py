from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
from django.db.models import Field
from django.db.models.expressions import Col

from users.models import JustfixUser
from onboarding.models import NYCADDR_META_HELP


DataDictDocs = Dict[Union[str, Field], Union[str, "DataDictionaryEntry"]]


# "Hard-coded" documentation for fields that we've inherited from third-party
# code, or just want to override to make more sense in the context of a
# data dictionary.
DATA_DICTIONARY_DOCS: Dict[Field, str] = {
    JustfixUser._meta.get_field(
        "id"
    ): "The user's unique id. Can be useful in joining with other data sets.",
    JustfixUser._meta.get_field("date_joined"): "The date the user's account was created.",
    JustfixUser._meta.get_field("first_name"): "The user's first name.",
    JustfixUser._meta.get_field("last_name"): "The user's last name.",
    JustfixUser._meta.get_field("email"): "The user's email address.",
}


@dataclass
class DataDictionaryEntry:
    help_text: str
    field: Optional[Field] = None
    choices: Optional[List[Tuple[str, str]]] = None

    def __post_init__(self):
        if self.choices is None and self.field and hasattr(self.field, "choices"):
            self.choices = self.field.choices


class DataDictionary(Dict[str, DataDictionaryEntry]):
    """
    Represents a data dictionary; each key is a field, and each value is
    the field's documentation.
    """

    pass


def get_data_dictionary(queryset, extra_docs: Optional[DataDictDocs] = None) -> DataDictionary:
    """
    Return a data dictionary dict for the given Django queryset.
    """

    extra_docs = extra_docs or {}
    result = DataDictionary()

    for col in queryset.query.select:
        result[col.target.name] = get_col_docs(col, extra_docs)

    for name, value in queryset.query.annotations.items():
        result[name] = get_anno_docs(name, value, extra_docs)

    return result


def get_anno_docs(name: str, value, extra_docs: DataDictDocs) -> DataDictionaryEntry:
    """
    Get the documentation for a Django queryset annotation.
    """

    if isinstance(value, Col):
        return get_col_docs(value, extra_docs, field_name=name)
    docs = extra_docs.get(name, "")
    if isinstance(docs, DataDictionaryEntry):
        return docs
    return DataDictionaryEntry(help_text=docs)


def get_col_docs(col: Col, extra_docs: DataDictDocs, field_name: str = "") -> DataDictionaryEntry:
    """
    Get the documentation for a Django model field column.
    """

    field = col.target
    field_name = field_name or col.target.name
    docs = extra_docs.get(field, extra_docs.get(field_name, ""))

    if isinstance(docs, DataDictionaryEntry):
        return docs

    help_text: str = (
        docs
        or DATA_DICTIONARY_DOCS.get(field)
        or remove_confusing_language_from_docs(field.help_text)
    )
    return DataDictionaryEntry(
        help_text=help_text,
        field=field,
    )


def remove_confusing_language_from_docs(value: str) -> str:
    """
    Some help text was intended only to be read in the context of the
    Django admin UI, and would be confusing in a data dictionary.
    This function removes such text.
    """

    return value.replace(NYCADDR_META_HELP, "")

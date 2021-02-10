from typing import Dict, Optional, Union
from dataclasses import dataclass
from django.db.models import Field
from django.db.models.expressions import Col

from users.models import JustfixUser
from onboarding.models import NYCADDR_META_HELP


DataDictDocs = Dict[Union[str, Field], str]


# "Hard-coded" documentation for fields that we've inherited from third-party
# code, or just want to override to make more sense in the context of a
# data dictionary.
DATA_DICTIONARY_DOCS: DataDictDocs = {
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
        result[col.target.name] = DataDictionaryEntry(
            help_text=get_field_docs(col.target, extra_docs), field=col.target
        )

    for anno, col in queryset.query.annotations.items():
        if isinstance(col, Col):
            result[anno] = DataDictionaryEntry(
                help_text=get_field_docs(col.target, extra_docs, field_name=anno), field=col.target
            )
        else:
            result[anno] = DataDictionaryEntry(help_text=extra_docs.get(anno, ""))

    return result


def get_field_docs(field: Field, extra_docs: DataDictDocs, field_name: str = "") -> str:
    """
    Attempt to get HTML documentation for the given field, prioritizing
    the passed-in documentation over the field's built-in documentation.
    """

    field_name = field_name or field.name

    return remove_confusing_language_from_docs(
        extra_docs.get(field)
        or extra_docs.get(field_name)
        or DATA_DICTIONARY_DOCS.get(field)
        or field.help_text
    )


def remove_confusing_language_from_docs(value: str) -> str:
    """
    Some help text was intended only to be read in the context of the
    Django admin UI, and would be confusing in a data dictionary.
    This function removes such text.
    """

    return value.replace(NYCADDR_META_HELP, "")

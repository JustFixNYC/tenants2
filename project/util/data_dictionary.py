from typing import Dict, Optional, OrderedDict
from django.db.models.expressions import Col

from users.models import JustfixUser


DATA_DICTIONARY_DOCS = {
    JustfixUser._meta.get_field(
        "id"
    ): "The user's unique id. Can be useful in joining with other data sets.",
    JustfixUser._meta.get_field("date_joined"): "The date the user's account was created.",
    JustfixUser._meta.get_field("first_name"): "The user's first name.",
    JustfixUser._meta.get_field("last_name"): "The user's last name.",
    JustfixUser._meta.get_field("email"): "The user's email address.",
}


def get_data_dictionary(queryset, extra_docs: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    extra_docs = extra_docs or {}
    result = OrderedDict[str, str]()

    for col in queryset.query.select:
        result[col.target.name] = get_field_docs(col.target)

    for anno, col in queryset.query.annotations.items():
        if isinstance(col, Col):
            result[anno] = get_field_docs(col.target)
        else:
            result[anno] = extra_docs.get(anno, "")

    return result


def get_field_docs(field) -> str:
    return DATA_DICTIONARY_DOCS.get(field) or field.help_text

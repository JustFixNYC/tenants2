from typing import Dict, Any

from project.util import django_graphql_forms
from project import common_data
from .graphql import execute_query

FORMS_COMMON_DATA = common_data.load_json("forms.json")


class LegacyFormSubmissionError(Exception):
    pass


def fix_newlines(d: Dict[str, str]) -> Dict[str, str]:
    result = dict()
    result.update(d)
    for key in d:
        result[key] = result[key].replace('\r\n', '\n')
    return result


def get_legacy_form_submission_result(request, graphql, input):
    if request.POST.get(FORMS_COMMON_DATA["LEGACY_FORMSET_ADD_BUTTON_NAME"]):
        return None
    return execute_query(request, graphql, variables={'input': input})['output']


def get_legacy_form_submission(request) -> Dict[str, Any]:
    graphql = request.POST.get('graphql')

    if not graphql:
        raise LegacyFormSubmissionError('No GraphQL query found')

    input_type = django_graphql_forms.get_input_type_from_query(graphql)

    if not input_type:
        raise LegacyFormSubmissionError('Invalid GraphQL query')

    form_class = django_graphql_forms.get_form_class_for_input_type(input_type)

    if not form_class:
        raise LegacyFormSubmissionError('Invalid GraphQL input type')

    formset_classes = django_graphql_forms.get_formset_classes_for_input_type(input_type)
    exclude_fields = django_graphql_forms.get_exclude_fields_for_input_type(input_type)

    input = django_graphql_forms.convert_post_data_to_input(
        form_class, request.POST, formset_classes, exclude_fields)

    return {
        'input': input,
        'result': get_legacy_form_submission_result(request, graphql, input),
        'POST': fix_newlines(request.POST.dict())
    }

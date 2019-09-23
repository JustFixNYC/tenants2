from . import forms

from project.util.django_graphql_session_forms import (
    DjangoSessionFormObjectType,
    DjangoSessionFormMutation
)

from project import schema_registry

class RhFormInfo(DjangoSessionFormObjectType):
    class Meta: 
        form_class = forms.RhForm
        session_key = f'rh_v{forms.FIELD_SCHEMA_VERSION}'

@schema_registry.register_mutation
class RhForm(DjangoSessionFormMutation):
    class Meta:
        source = RhFormInfo
    
@schema_registry.register_session_info
class RhSessionInfo(object):
    rental_history_info = RhFormInfo.field()


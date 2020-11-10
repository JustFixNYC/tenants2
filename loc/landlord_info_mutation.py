from typing import List
from django import forms
from graphql import ResolveInfo

from users.models import JustfixUser
from .models import LandlordDetails
from .forms import LandlordDetailsFormV2
from project.util.model_form_util import (
    SingletonFormsetFormMutation,
    singletonformset_factory,
)
from project.util.django_graphql_forms import FormWithFormsets


class BaseLandlordExtraInfoForm(forms.Form):
    use_recommended = forms.BooleanField(
        required=False,
        help_text=(
            "Whether to use the recommended default landlord and/or management "
            "company as determined by the server. If false, we expect "
            "manual landlord and/or management company details to be "
            "provided."
        )
    )


class BaseLandlordFormWithFormsets(FormWithFormsets):
    def get_formset_names_to_clean(self) -> List[str]:
        if not self.base_form.cleaned_data.get('use_recommended'):
            return ['landlord']
        return []


class BaseLandlordInfoMutationMeta:
    form_class = BaseLandlordExtraInfoForm

    formset_classes = {
        'landlord': singletonformset_factory(
            JustfixUser,
            LandlordDetails,
            LandlordDetailsFormV2,
        )
    }


class BaseLandlordInfoMutation(SingletonFormsetFormMutation):
    class Meta:
        abstract = True

    @classmethod
    def get_form_with_formsets(cls, form, formsets):
        return BaseLandlordFormWithFormsets(form, formsets)

    @classmethod
    def __update_recommended_ll_info(cls, user):
        assert hasattr(user, 'onboarding_info')
        info = LandlordDetails.create_or_update_lookup_for_user(user)
        assert info is not None

    @classmethod
    def update_manual_details(cls, form: BaseLandlordFormWithFormsets, user: JustfixUser):
        ll_form = form.formsets['landlord'].forms[0]
        ld = ll_form.save(commit=False)
        ld.is_looked_up = False
        ld.save()

    @classmethod
    def perform_mutate(cls, form: BaseLandlordFormWithFormsets, info: ResolveInfo):
        if form.base_form.cleaned_data['use_recommended']:
            cls.__update_recommended_ll_info(info.context.user)
        else:
            cls.update_manual_details(form, info.context.user)
        return cls.mutation_success()

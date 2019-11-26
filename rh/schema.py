from . import models, forms, email_dhcr

from project.util.django_graphql_session_forms import (
    DjangoSessionFormObjectType,
    DjangoSessionFormMutation
)
from project.util.session_mutation import SessionFormMutation
from project import schema_registry
from project.util.address_form_fields import BOROUGH_CHOICES
from rapidpro.followup_campaigns import trigger_followup_campaign_async


class RhFormInfo(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.RhForm
        session_key = f'rh_v{forms.FIELD_SCHEMA_VERSION}'


@schema_registry.register_mutation
class RhForm(DjangoSessionFormMutation):
    class Meta:
        source = RhFormInfo


@schema_registry.register_mutation
class RhSendEmail(SessionFormMutation):
    class Meta:
        form_class = forms.RhSendEmail

    @classmethod
    def perform_mutate(cls, form, info):
        request = info.context
        form_data = RhFormInfo.get_dict_from_request(request)
        if form_data is None:
            cls.log(info, "User has not completed the rental history form, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")

        rhr = models.RentalHistoryRequest(**form_data)
        rhr.set_user(request.user)
        rhr.full_clean()
        rhr.save()

        first_name: str = form_data["first_name"]
        last_name: str = form_data["last_name"]
        email_dhcr.send_email_to_dhcr(
            first_name,
            last_name,
            form_data["address"],
            BOROUGH_CHOICES.get_label(form_data["borough"]),
            form_data["apartment_number"]
        )
        trigger_followup_campaign_async(
            f"{first_name} {last_name}",
            form_data["phone_number"],
            "RH"
        )
        RhFormInfo.clear_from_request(request)
        return cls.mutation_success()


@schema_registry.register_session_info
class RhSessionInfo(object):
    rental_history_info = RhFormInfo.field()

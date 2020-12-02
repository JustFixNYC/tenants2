from . import models, forms, email_dhcr
from django.utils import translation

from project import slack
from project.util.django_graphql_session_forms import (
    DjangoSessionFormObjectType,
    DjangoSessionFormMutation,
)
from project.util.session_mutation import SessionFormMutation
from project.util.site_util import absolute_reverse, SITE_CHOICES
from project import schema_registry
import project.locales
from frontend.static_content import react_render_email
from rapidpro.followup_campaigns import trigger_followup_campaign_async


def get_slack_notify_text(rhr: models.RentalHistoryRequest) -> str:
    rh_link = slack.hyperlink(
        text="rent history",
        href=absolute_reverse("admin:rh_rentalhistoryrequest_change", args=[rhr.pk]),
    )
    if rhr.user:
        user_text = slack.hyperlink(text=rhr.user.first_name, href=rhr.user.admin_url)
    else:
        user_text = slack.escape(rhr.first_name)
    return f"{user_text} has requested {rh_link}!"


class RhFormInfo(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.RhForm
        session_key = f"rh_v{forms.FIELD_SCHEMA_VERSION}"


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
        slack.sendmsg_async(get_slack_notify_text(rhr), is_safe=True)

        first_name: str = form_data["first_name"]
        last_name: str = form_data["last_name"]
        email = react_render_email(
            SITE_CHOICES.JUSTFIX,
            project.locales.DEFAULT,
            "rh/email-to-dhcr.txt",
            session={RhFormInfo._meta.session_key: form_data},
        )
        email_dhcr.send_email_to_dhcr(email.subject, email.body)
        trigger_followup_campaign_async(
            f"{first_name} {last_name}",
            form_data["phone_number"],
            "RH",
            locale=translation.get_language_from_request(request, check_path=True),
        )
        RhFormInfo.clear_from_request(request)
        return cls.mutation_success()


@schema_registry.register_session_info
class RhSessionInfo(object):
    rental_history_info = RhFormInfo.field()

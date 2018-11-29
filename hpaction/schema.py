from typing import Optional
import graphene
from graphql import ResolveInfo
from django.urls import reverse

from project.util.session_mutation import SessionFormMutation
from project.util.site_util import absolute_reverse
from project import slack
from .models import UploadToken, HPActionDocuments
from .forms import GeneratePDFForm
from .build_hpactionvars import user_to_hpactionvars
from . import lhiapi


class GeneratePDF(SessionFormMutation):
    class Meta:
        form_class = GeneratePDFForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form: GeneratePDFForm, info: ResolveInfo):
        user = info.context.user
        hdinfo = user_to_hpactionvars(user)
        token = UploadToken.objects.create_for_user(user)
        docs = lhiapi.get_answers_and_documents(token, hdinfo)
        if docs is None:
            return cls.make_error(
                "An error occurred when generating your HP Action documents. "
                "Please try again later."
            )
        else:
            user.send_sms(
                f"JustFix.nyc here! Follow this link to your completed "
                f"HP Action legal forms. You will need to print these "
                f"papers before bringing them to court! "
                f"{absolute_reverse('hpaction:latest_pdf')}",
                fail_silently=True
            )
            slack.sendmsg(
                f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
                f"has generated HP Action legal forms!",
                is_safe=True
            )

        return cls.mutation_success()


class HPActionMutations:
    generate_hp_action_pdf = GeneratePDF.Field(required=True)


class HPActionSessionInfo:
    latest_hp_action_pdf_url = graphene.String(
        description=(
            "The URL of the most recently-generated HP Action PDF "
            "for the current user."
        )
    )

    def resolve_latest_hp_action_pdf_url(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        if HPActionDocuments.objects.filter(user=request.user).exists():
            return reverse('hpaction:latest_pdf')
        return None

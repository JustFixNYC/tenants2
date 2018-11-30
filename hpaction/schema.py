from typing import Optional
from threading import Thread
import graphene
from graphql import ResolveInfo
from django.urls import reverse

from project.util.session_mutation import SessionFormMutation
from project.util.site_util import absolute_reverse
from project import slack
from .models import (
    UploadToken, HPActionDocuments, HPUploadStatus, get_upload_status_for_user)
from .forms import GeneratePDFForm
from .build_hpactionvars import user_to_hpactionvars
from .hpactionvars import HPActionVariables
from . import lhiapi


class GetAnswersAndDocumentsThread(Thread):
    '''
    A separate thread that attempts to generate the user's HP Action packet.
    Ideally this should be done in a worker queue but we don't have
    time to set one up right now, and this should take about a minute
    anyways, so it's unlikely that Heroku (or whatever else is running us)
    will kill us before we're done.
    '''

    def __init__(self, token_id: str, hdinfo: HPActionVariables) -> None:
        super().__init__()
        self.token_id = token_id
        self.hdinfo = hdinfo

    def run(self) -> None:
        token = UploadToken.objects.find_unexpired(self.token_id)
        assert token is not None
        user = token.user
        docs = lhiapi.get_answers_and_documents(token, self.hdinfo)
        if docs is not None:
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


GET_ANSWERS_AND_DOCUMENTS_ASYNC = True


class GeneratePDF(SessionFormMutation):
    class Meta:
        form_class = GeneratePDFForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form: GeneratePDFForm, info: ResolveInfo):
        user = info.context.user
        hdinfo = user_to_hpactionvars(user)
        token = UploadToken.objects.create_for_user(user)
        thread = GetAnswersAndDocumentsThread(token.id, hdinfo)
        if GET_ANSWERS_AND_DOCUMENTS_ASYNC:
            thread.start()
        else:
            thread.run()
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

    hp_action_upload_status = graphene.Field(graphene.Enum.from_enum(HPUploadStatus))

    def resolve_latest_hp_action_pdf_url(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        if HPActionDocuments.objects.filter(user=request.user).exists():
            return reverse('hpaction:latest_pdf')
        return None

    def resolve_hp_action_upload_status(self, info: ResolveInfo) -> Optional[HPUploadStatus]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        return get_upload_status_for_user(request.user)

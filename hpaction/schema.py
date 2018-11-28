from typing import Optional
import graphene
from graphql import ResolveInfo
from django.conf import settings
from django.urls import reverse
import zeep

from project.util.session_mutation import SessionFormMutation
from .models import UploadToken, HPActionDocuments
from .forms import GeneratePDFForm
from .build_hpactionvars import user_to_hpactionvars
from .views import SUCCESSFUL_UPLOAD_TEXT


class GeneratePDF(SessionFormMutation):
    class Meta:
        form_class = GeneratePDFForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form: GeneratePDFForm, info: ResolveInfo):
        user = info.context.user
        v = user_to_hpactionvars(user)
        hdinfo = str(v.to_answer_set())
        client = zeep.Client(f"{settings.HP_ACTION_API_ENDPOINT}?wsdl")
        token = UploadToken.objects.create_for_user(user)
        result = client.service.GetAnswersAndDocuments(
            CustomerKey=settings.HP_ACTION_CUSTOMER_KEY,
            TemplateId=settings.HP_ACTION_TEMPLATE_ID,
            HDInfo=hdinfo,
            DocID=token.id,
            PostBackUrl=token.get_upload_url()
        )
        if result != SUCCESSFUL_UPLOAD_TEXT:
            raise Exception(
                f"Received unexpected response from server: {result}")
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

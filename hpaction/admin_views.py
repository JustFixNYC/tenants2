from django.urls import path, reverse
from django.http import Http404, HttpResponseRedirect
from django.template.response import TemplateResponse
from django.contrib.auth.decorators import permission_required
from django.contrib.admin.helpers import AdminForm
from django.core.exceptions import ValidationError
from django.contrib import messages
from django import forms
from django.utils import timezone

from users.models import JustfixUser, ADD_SERVING_PAPERS_PERMISSION
from loc import lob_api
from . import models
from .normalize_serving_papers import convert_to_letter_pages


class ServingPapersForm(forms.ModelForm):
    class Meta:
        model = models.ServingPapers
        fields = [
            'name',
            'primary_line',
            'secondary_line',
            'urbanization',
            'city',
            'state',
            'zip_code',
            'pdf_file',
        ]

    is_definitely_deliverable = forms.BooleanField(
        required=False,
        help_text=(
            "This address is definitely deliverable "
            "(manually override Lob's address verification)"
        ),
    )

    @staticmethod
    def validate_address(cleaned_data):
        sp_data = {**cleaned_data}
        is_definitely_deliverable = sp_data.pop('is_definitely_deliverable')
        sp = models.ServingPapers(**sp_data)
        if (sp.is_address_populated() and
                (not is_definitely_deliverable) and
                lob_api.is_address_undeliverable(**sp.as_lob_params())):
            raise ValidationError(
                'Lob thinks the recipient\'s address is undeliverable. '
                'If you disagree, please check the "Is definitely deliverable" '
                'checkbox to continue.'
            )

    def clean(self):
        cleaned_data = super().clean()
        self.validate_address(cleaned_data)
        return cleaned_data


class HPActionAdminViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path(
                'serving-papers/create/<int:userid>/',
                self.view_with_perm(self.create_serving_papers,
                                    ADD_SERVING_PAPERS_PERMISSION),
                name='create-serving-papers'
            ),
        ]

    def view_with_perm(self, view_func, perm: str):
        return self.site.admin_view(permission_required(perm)(view_func))

    def _get_serving_papers_sender(self, userid: int) -> JustfixUser:
        sender = JustfixUser.objects.filter(pk=userid).first()
        if sender and models.ServingPapers.can_user_serve_papers(sender):
            return sender
        raise Http404("User not found and/or lacks required information")

    def _ensure_lob_integration(self):
        if not lob_api.is_lob_fully_enabled():
            raise Http404("Lob integration is disabled")

    def _send_papers(self, papers: models.ServingPapers):
        response = lob_api.mail_certified_letter(
            description="Serving papers",
            to_address={
                'name': papers.name,
                **lob_api.verification_to_inline_address(
                    lob_api.verify_address(**papers.as_lob_params())
                )
            },
            from_address={
                'name': papers.sender.full_name,
                **lob_api.verification_to_inline_address(
                    lob_api.verify_address(**papers.sender.onboarding_info.as_lob_params())
                )
            },
            file=convert_to_letter_pages(papers.pdf_file.open()),
            color=False,
            double_sided=False,
            request_return_receipt=True,
        )
        papers.lob_letter_object = response
        papers.tracking_number = response['tracking_number']
        papers.letter_sent_at = timezone.now()
        papers.save()

    def create_serving_papers(self, request, userid):
        self._ensure_lob_integration()
        sender = self._get_serving_papers_sender(userid)
        go_back_href = reverse('admin:hpaction_hpuser_change', args=(sender.pk,))
        ld = sender.landlord_details

        if request.method == "POST":
            form = ServingPapersForm(request.POST, request.FILES)
            if form.is_valid():
                papers = form.save(commit=False)
                papers.uploaded_by = request.user
                papers.sender = sender
                self._send_papers(papers)
                messages.success(
                    request,
                    'The recipient has been served! See below for more details.'
                )
                return HttpResponseRedirect(go_back_href)
        else:
            form = ServingPapersForm(initial={
                'name': ld.name,
                **ld.get_address_as_dict(),
            })

        # This makes it easier to manually test the form.
        form.use_required_attribute = False

        # http://www.dmertl.com/blog/?p=116
        fieldsets = [(None, {'fields': form.base_fields})]
        adminform = AdminForm(form, fieldsets, {})

        ctx = {
            **self.site.each_context(request),
            'sender': sender,
            'form': form,
            'adminform': adminform,
            'go_back_href': go_back_href,
        }

        return TemplateResponse(
            request,
            "hpaction/admin/create-serving-papers.html",
            ctx
        )

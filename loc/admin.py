from typing import Dict, Any
from django.contrib import admin
from django import forms
from django.http import HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import format_html
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.core import signing
import lob

from project.util.admin_util import admin_field, admin_action
from . import models

# https://lob.com/docs#us_verifications_object
DELIVERABILITY_DOCS = {
    'deliverable': 'The address is deliverable by the USPS.',
    'deliverable_unnecessary_unit': (
        'The address is deliverable, but the secondary unit '
        'information is unnecessary.'
    ),
    'deliverable_incorrect_unit': (
        "The address is deliverable to the building's default "
        "address but the secondary unit provided may not exist. "
        "There is a chance the mail will not reach the intended "
        "recipient."
    ),
    'deliverable_missing_unit': (
        "The address is deliverable to the building's default "
        "address but is missing secondary unit information. "
        "There is a chance the mail will not reach the intended "
        "recipient."
    ),
    'undeliverable': (
        "The address is not deliverable according to the USPS."
    )
}


@admin_action("Print letter of complaint envelopes")
def print_loc_envelopes(modeladmin, request, queryset):
    user_ids = [str(user.pk) for user in queryset]
    qs = '?user_ids=' + ','.join(user_ids)
    return HttpResponseRedirect(reverse('loc_envelopes') + qs)


class AccessDateInline(admin.TabularInline):
    model = models.AccessDate
    verbose_name = "Letter of complaint access date"
    verbose_name_plural = "Letter of complaint access dates"
    extra = 1


class LandlordDetailsForm(forms.ModelForm):
    class Meta:
        model = models.LandlordDetails
        widgets = {
            'address': forms.Textarea()
        }
        fields = '__all__'


class LandlordDetailsInline(admin.StackedInline):
    form = LandlordDetailsForm
    model = models.LandlordDetails
    verbose_name = "Landlord details"
    verbose_name_plural = verbose_name


class LetterRequestInline(admin.StackedInline):
    model = models.LetterRequest
    verbose_name = "Letter of complaint request"
    verbose_name_plural = verbose_name
    exclude = ['html_content', 'lob_letter_object']

    readonly_fields = ['loc_actions']

    @admin_field(
        short_description="Letter of complaint actions",
        allow_tags=True
    )
    def loc_actions(self, obj: models.LetterRequest):
        url = obj.admin_pdf_url
        if not url:
            return 'This user has not yet completed the letter of complaint process.'
        html = format_html(
            '<a class="button" target="_blank" href="{}">View letter of complaint PDF</a>',
            url
        )
        if can_mail_via_lob(obj):
            html += format_html(
                '<br><br><a class="button" href="{}">Mail letter of complaint via Lob</a>',
                reverse('admin:mail-via-lob', kwargs={'letterid': obj.id})
            )
        return html


class LocAdminViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path('lob/<int:letterid>/', self.site.admin_view(self.mail_via_lob),
                 name='mail-via-lob'),
        ]

    def _get_mail_confirmation_context(self, user):
        landlord_details = user.landlord_details
        onboarding_info = user.onboarding_info
        lob.api_key = settings.LOB_PUBLISHABLE_API_KEY

        landlord_verification = lob.USVerification.create(
            address=landlord_details.address
        )
        user_verification = lob.USVerification.create(
            primary_line=onboarding_info.address,
            secondary_line=onboarding_info.apartment_address_line,
            state=onboarding_info.state,
            city=onboarding_info.city,
            zip_code=onboarding_info.zipcode,
        )

        is_deliverable = (
            landlord_verification['deliverability'] != 'undeliverable' and
            user_verification['deliverability'] != 'undeliverable'
        )

        # For definite deliverability, we only really care about the
        # landlord.
        is_definitely_deliverable = landlord_verification['deliverability'] == 'deliverable'

        verifications = {
            'landlord_verification': landlord_verification,
            'landlord_verified_address': get_address_from_verification(landlord_verification),
            'landlord_deliverability_docs': get_deliverability_docs(landlord_verification),
            'user_verification': user_verification,
            'user_verified_address': get_address_from_verification(user_verification),
            'user_deliverability_docs': get_deliverability_docs(user_verification),
            'is_deliverable': is_deliverable,
            'is_definitely_deliverable': is_definitely_deliverable
        }

        return {
            'signed_verifications': signing.dumps(verifications),
            **verifications
        }

    def mail_via_lob(self, request, letterid):
        letter = get_object_or_404(models.LetterRequest, pk=letterid)
        user = letter.user
        can_mail = can_mail_via_lob(letter)
        is_post = request.method == "POST"
        ctx = {
            **self.site.each_context(request),
            'title': "Mail letter of complaint via Lob",
            'user': user,
            'letter': letter,
            'can_mail': can_mail,
            'is_post': is_post,
            'pdf_url': user.letter_request.admin_pdf_url,
            'go_back_href': reverse('admin:users_justfixuser_change', args=(user.pk,)),
        }

        if can_mail:
            if is_post:
                verifications = signing.loads(request.POST['signed_verifications'])
                print(verifications)
            else:
                ctx.update(self._get_mail_confirmation_context(user))

        return TemplateResponse(request, "loc/admin/lob.html", ctx)


def get_address_from_verification(v: Dict[str, Any]) -> str:
    return '\n'.join(filter(None, [
        v['primary_line'],
        v['secondary_line'],
        v['urbanization'],
        v['last_line']
    ]))


def get_deliverability_docs(v: Dict[str, Any]) -> str:
    return DELIVERABILITY_DOCS[v['deliverability']]


def can_mail_via_lob(letter: models.LetterRequest) -> bool:
    if not (settings.LOB_SECRET_API_KEY and settings.LOB_PUBLISHABLE_API_KEY):
        return False
    # TODO: Ensure letter is WE_WILL_MAIL.
    # TODO: Ensure LandlordDetails exist.
    # TODO: Ensure request user has proper permissions.
    # TODO: Ensure letter has not already been mailed via Lob.
    return True


user_inlines = (
    AccessDateInline,
    LandlordDetailsInline,
    LetterRequestInline
)

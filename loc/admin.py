from django.contrib import admin
from django import forms
from django.http import HttpResponseRedirect
from django.template.response import TemplateResponse
from django.urls import path
from django.urls import reverse
from django.utils.html import format_html
from django.conf import settings
from django.shortcuts import get_object_or_404
import lob

from project.util.admin_util import admin_field, admin_action
from . import models


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
    exclude = ['html_content']

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

    def mail_via_lob(self, request, letterid):
        letter = get_object_or_404(models.LetterRequest, pk=letterid)
        user = letter.user
        can_mail = can_mail_via_lob(letter)
        ctx = {
            **self.site.each_context(request),
            'title': "Mail letter of complaint via Lob",
            'user': user,
            'letter': letter,
            'can_mail': can_mail
        }

        if can_mail:
            landlord_details = user.landlord_details
            onboarding_info = user.onboarding_info
            lob.api_key = settings.LOB_SECRET_API_KEY

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

            ctx.update({
                'landlord_verification': landlord_verification,
                'user_verification': user_verification,
            })

        return TemplateResponse(request, "loc/admin/lob.html", ctx)


def can_mail_via_lob(letter: models.LetterRequest) -> bool:
    if not settings.LOB_SECRET_API_KEY:
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

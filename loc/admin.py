from typing import Optional
from django.contrib import admin
from django import forms
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html
from django.conf import settings
from project.util.admin_util import admin_field, admin_action, never_has_permission
from . import models


@admin_action("Print letter of complaint envelopes")
def print_loc_envelopes(modeladmin, request, queryset):
    user_ids = [str(user.pk) for user in queryset]
    qs = '?user_ids=' + ','.join(user_ids)
    return HttpResponseRedirect(reverse('loc_envelopes') + qs)


class AddressDetailsForm(forms.ModelForm):
    class Meta:
        model = models.AddressDetails
        widgets = {
            'address': forms.Textarea()
        }
        fields = '__all__'


@admin.register(models.AddressDetails)
class AddressDetailsAdmin(admin.ModelAdmin):
    # We want the address to be at the top, which is why we're listing
    # these fields explicitly.
    fields = [
        'address',
        'primary_line',
        'secondary_line',
        'urbanization',
        'city',
        'state',
        'zip_code',
    ]

    list_display = ['address', 'state', 'created_at', 'updated_at']
    readonly_fields = ['address']
    form = AddressDetailsForm
    has_add_permission = never_has_permission
    has_delete_permission = never_has_permission


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


class LetterRequestForm(forms.ModelForm):
    class Meta:
        model = models.LetterRequest
        exclude = ['html_content', 'lob_letter_object', 'user']

    def clean(self):
        super().clean()
        if self.instance.pk is None:
            self.instance.regenerate_html_content()


LOC_INCOMPLETE = 'This user has not yet completed the letter of complaint process.'


class LetterRequestInline(admin.StackedInline):
    form = LetterRequestForm
    model = models.LetterRequest
    verbose_name = "Letter of complaint request"
    verbose_name_plural = verbose_name

    readonly_fields = ['letter_snippet', 'loc_actions', 'lob_integration']

    @admin_field(short_description="Letter HTML snippet", allow_tags=True)
    def letter_snippet(self, obj: models.LetterRequest) -> str:
        if obj.pk is None:
            return LOC_INCOMPLETE
        if not obj.html_content:
            return "Letter has no cached HTML content!"
        return format_html("<code>{}\u2026</code>", obj.html_content[:150])

    @admin_field(
        short_description="Letter of complaint actions",
        allow_tags=True
    )
    def loc_actions(self, obj: models.LetterRequest):
        url = obj.admin_pdf_url
        if not url:
            return LOC_INCOMPLETE
        return format_html(
            '<a class="button" target="_blank" href="{}">View letter of complaint PDF</a>',
            url
        )

    @admin_field(
        short_description='Lob integration',
        allow_tags=True
    )
    def lob_integration(self, obj: models.LetterRequest):
        if obj.lob_letter_object:
            return obj.lob_letter_html_description
        nomail_reason = get_lob_nomail_reason(obj)
        if not nomail_reason:
            return format_html(
                '<a class="button" href="{}">Mail letter of complaint via Lob&hellip;</a>',
                reverse('admin:mail-via-lob', kwargs={'letterid': obj.id})
            )
        return format_html("Unable to send mail via Lob because {}.", nomail_reason)


def get_lob_nomail_reason(letter: models.LetterRequest) -> Optional[str]:
    '''
    If the given letter can't be mailed via Lob, return a human-readable
    English string explaining why. Otherwise, return None.
    '''

    result: Optional[str] = None

    if not (settings.LOB_SECRET_API_KEY and settings.LOB_PUBLISHABLE_API_KEY):
        result = 'Lob integration is disabled'
    elif not letter.id:
        result = 'the letter has not yet been created'
    elif letter.lob_letter_object:
        result = 'the letter has already been sent via Lob'
    elif letter.mail_choice != models.LOC_MAILING_CHOICES.WE_WILL_MAIL:
        result = 'the user wants to mail the letter themself'
    elif not hasattr(letter.user, 'landlord_details'):
        result = 'the user does not have landlord details'
    elif not hasattr(letter.user, 'onboarding_info'):
        result = 'the user does not have onboarding info'
    return result


user_inlines = (
    AccessDateInline,
    LandlordDetailsInline,
    LetterRequestInline
)

from django.contrib import admin
from django import forms
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html

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
        return format_html(
            '<a class="button" target="_blank" href="{}">View letter of complaint PDF</a>',
            url
        )


user_inlines = (
    AccessDateInline,
    LandlordDetailsInline,
    LetterRequestInline
)

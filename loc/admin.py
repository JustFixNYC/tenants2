from typing import Optional
from django.contrib import admin
from django import forms
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html
from django.db.models import Count

from users.models import JustfixUser
from users.action_progress import LOC_PROGRESS
from issues.admin import IssueInline, CustomIssueInline
from project.util.admin_util import admin_field, admin_action, never_has_permission
from project.util.lob_api import is_lob_fully_enabled
from users.admin_user_proxy import UserProxyAdmin
from . import models


@admin_action("Print letter of complaint envelopes")
def print_loc_envelopes(modeladmin, request, queryset):
    user_ids = [str(user.pk) for user in queryset]
    qs = "?user_ids=" + ",".join(user_ids)
    return HttpResponseRedirect(reverse("loc_envelopes") + qs)


class AddressDetailsForm(forms.ModelForm):
    class Meta:
        model = models.AddressDetails
        widgets = {"address": forms.Textarea()}
        fields = "__all__"


@admin.register(models.AddressDetails)
class AddressDetailsAdmin(admin.ModelAdmin):
    # We want the address to be at the top, which is why we're listing
    # these fields explicitly.
    fields = [
        "address",
        "primary_line",
        "secondary_line",
        "urbanization",
        "city",
        "state",
        "zip_code",
        "is_definitely_deliverable",
        "notes",
    ]

    list_display = ["address", "state", "created_at", "updated_at"]
    readonly_fields = ["address"]
    form = AddressDetailsForm
    has_add_permission = never_has_permission
    has_delete_permission = never_has_permission


class WorkOrderInline(admin.TabularInline):
    model = models.WorkOrder
    verbose_name = "Letter of complaint work order ticket"
    verbose_name_plural = "Letter of complaint work order tickets"
    extra = 1


class AccessDateInline(admin.TabularInline):
    model = models.AccessDate
    verbose_name = "Letter of complaint access date"
    verbose_name_plural = "Letter of complaint access dates"
    extra = 1


class LandlordDetailsForm(forms.ModelForm):
    class Meta:
        model = models.LandlordDetails
        widgets = {"address": forms.Textarea()}
        fields = [
            "name",
            "address",
            "primary_line",
            "secondary_line",
            "urbanization",
            "city",
            "state",
            "zip_code",
            "is_looked_up",
            "lookup_date",
            "email",
            "phone_number",
        ]


class LandlordDetailsInline(admin.StackedInline):
    fieldsets = (
        (
            None,
            {
                "fields": LandlordDetailsForm._meta.fields,
                "description": (
                    "<strong>Note:</strong> If you need to edit the name or mailing address, "
                    "you will probably also want to uncheck the 'is looked up' checkbox too. "
                    "If it is checked, the name and/or mailing address "
                    "may change at any time, depending on open data and usage context."
                ),
            },
        ),
    )

    form = LandlordDetailsForm
    model = models.LandlordDetails
    verbose_name = "Landlord details"
    verbose_name_plural = verbose_name


class LetterRequestForm(forms.ModelForm):
    class Meta:
        model = models.LetterRequest
        exclude = ["html_content", "lob_letter_object", "user", "rejection_reason"]

    def clean(self):
        super().clean()
        if self.instance.pk is None:
            self.instance.regenerate_html_content(author="a staff member")


LOC_INCOMPLETE = "This user has not yet completed the letter of complaint process."


class LetterRequestInline(admin.StackedInline):
    form = LetterRequestForm
    model = models.LetterRequest
    verbose_name = "Letter of complaint request"
    verbose_name_plural = verbose_name

    readonly_fields = [
        "letter_snippet",
        "loc_actions",
        "lob_integration",
        "reject_letter",
        "archive_letter",
    ]

    @admin_field(short_description="Letter HTML snippet", allow_tags=True)
    def letter_snippet(self, obj: models.LetterRequest) -> str:
        if obj.pk is None:
            return LOC_INCOMPLETE
        if not obj.html_content:
            return "Letter has no cached HTML content!"
        return format_html("<code>{}\u2026</code>", obj.html_content[:150])

    @admin_field(short_description="Letter of complaint actions", allow_tags=True)
    def loc_actions(self, obj: models.LetterRequest):
        url = obj.admin_pdf_url
        if not url:
            return LOC_INCOMPLETE
        return format_html(
            '<a class="button" target="_blank" href="{}">View letter of complaint PDF</a>', url
        )

    @admin_field(short_description="Lob integration", allow_tags=True)
    def lob_integration(self, obj: models.LetterRequest):
        if obj.lob_letter_object:
            return obj.lob_letter_html_description
        nomail_reason = get_lob_nomail_reason(obj)
        if not nomail_reason:
            return format_html(
                '<a class="button" href="{}">Mail letter of complaint via Lob&hellip;</a>',
                reverse("admin:mail-via-lob", kwargs={"letterid": obj.id}),
            )
        return format_html("Unable to send mail via Lob because {}.", nomail_reason)

    @admin_field(short_description="Reject letter", allow_tags=True)
    def reject_letter(self, obj: models.LetterRequest):
        noreject_reason = get_reason_for_not_rejecting_or_mailing(obj)
        if not noreject_reason:
            return format_html(
                '<a class="button" href="{}">Reject letter&hellip;</a>',
                reverse("admin:reject-letter", kwargs={"letterid": obj.id}),
            )
        return format_html("Unable to reject letter because {}.", noreject_reason)

    @admin_field(short_description="Archive letter", allow_tags=True)
    def archive_letter(self, obj: models.LetterRequest):
        noarchive_reason = get_reason_for_not_archiving(obj)
        if not noarchive_reason:
            return format_html(
                '<a class="button" href="{}">Archive letter&hellip;</a>',
                reverse("admin:archive-letter", kwargs={"letterid": obj.id}),
            )
        return format_html("Unable to archive letter because {}.", noarchive_reason)


def get_reason_for_not_archiving(letter: models.LetterRequest) -> Optional[str]:
    if not letter.id:
        return "the letter has not yet been created"
    return None


def get_reason_for_not_rejecting_or_mailing(letter: models.LetterRequest) -> Optional[str]:
    result = get_reason_for_not_archiving(letter)

    if result:
        pass
    elif letter.lob_letter_object:
        result = "the letter has already been sent via Lob"
    elif letter.tracking_number:
        result = "the letter has already been mailed manually"
    elif letter.rejection_reason:
        result = "we have rejected the letter"
    elif letter.mail_choice != models.LOC_MAILING_CHOICES.WE_WILL_MAIL:
        result = "the user wants to mail the letter themself"
    elif not hasattr(letter.user, "landlord_details"):
        result = "the user does not have landlord details"
    elif not hasattr(letter.user, "onboarding_info"):
        result = "the user does not have onboarding info"
    return result


def get_lob_nomail_reason(letter: models.LetterRequest) -> Optional[str]:
    """
    If the given letter can't be mailed via Lob, return a human-readable
    English string explaining why. Otherwise, return None.
    """

    if not is_lob_fully_enabled():
        return "Lob integration is disabled"

    return get_reason_for_not_rejecting_or_mailing(letter)


class ArchivedLetterRequestInline(admin.TabularInline):
    model = models.ArchivedLetterRequest
    fields = [
        "created_at",
        "mail_choice",
        "tracking_number",
        "archived_at",
        "rejection_reason",
        "notes",
    ]
    readonly_fields = fields
    has_add_permission = never_has_permission
    has_delete_permission = never_has_permission


class LOCUser(JustfixUser):
    class Meta:
        proxy = True

        verbose_name = "User with Letter of Complaint"

        verbose_name_plural = "Users with Letters of Complaint"


ISSUE_COUNT = "_issue_count"
MAILING_NEEDED = "_mailing_needed"


@admin.register(LOCUser)
class LOCUserAdmin(UserProxyAdmin):
    inlines = (
        IssueInline,
        CustomIssueInline,
        AccessDateInline,
        WorkOrderInline,
        LandlordDetailsInline,
        LetterRequestInline,
        ArchivedLetterRequestInline,
    )

    list_display = UserProxyAdmin.list_display + ["issue_count", "mailing_needed"]

    actions = UserProxyAdmin.actions + [print_loc_envelopes]

    list_filter = ["letter_request__mail_choice"]

    progress_annotation = LOC_PROGRESS

    @admin_field(short_description="Issues", admin_order_field=ISSUE_COUNT)
    def issue_count(self, obj):
        return getattr(obj, ISSUE_COUNT)

    @admin_field(short_description="Letter mailing needed?", admin_order_field=MAILING_NEEDED)
    def mailing_needed(self, obj) -> bool:
        return bool(getattr(obj, MAILING_NEEDED))

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            **{
                ISSUE_COUNT: (
                    Count("issues", distinct=True) + Count("custom_issues", distinct=True)
                ),
                MAILING_NEEDED: Count(
                    "letter_request",
                    distinct=True,
                    filter=models.USER_MAILING_NEEDED_Q,
                ),
            }
        )
        return queryset

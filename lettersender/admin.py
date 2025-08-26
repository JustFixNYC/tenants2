from django.contrib import admin
from django.db.models import Q, Count
from django.utils.safestring import mark_safe
from django.urls import reverse

from users.models import JustfixUser
from users.action_progress import LETTERSENDER_PROGRESS
from users.admin_user_proxy import UserProxyAdmin
from project.util.admin_util import admin_field, never_has_permission
from loc.admin import LandlordDetailsInline
from project.util.lob_django_util import SendableViaLobAdminMixin
from . import models


class LetterSenderIssueInline(admin.StackedInline):
    model = models.LetterSenderIssue
    fields = [
        "value",
        "created_at",
        "updated_at",
    ]
    readonly_fields = ("created_at", "updated_at")

    has_add_permission = never_has_permission

    ordering = ["-created_at"]


@admin.register(models.LetterSenderLetter)
class GCELetterAdmin(admin.ModelAdmin):
    fields = [
        "mail_choice",
        "email_to_landlord",
        "created_at",
        "letter_emailed_at",
        "letter_sent_at",
        "fully_processed_at",
    ]
    readonly_fields = ("created_at",)

    has_add_permission = never_has_permission

    ordering = ["-created_at"]

    inlines = (LetterSenderIssueInline,)


class GCELetterInline(admin.StackedInline, SendableViaLobAdminMixin):
    model = models.LetterSenderLetter
    fields = [
        "mail_choice",
        "email_to_landlord",
        "created_at",
        "letter_emailed_at",
        "letter_sent_at",
        "fully_processed_at",
        "lob_integration",
        "edit_link",
    ]
    readonly_fields = fields

    has_add_permission = never_has_permission

    ordering = ["-created_at"]

    def edit_link(self, obj=None):
        if obj.pk:
            url = reverse(
                "admin:%s_%s_change" % (obj._meta.app_label, obj._meta.model_name), args=[obj.pk]
            )
            return mark_safe(
                """<a href="{url}">{text}</a>""".format(
                    url=url,
                    text=("Edit %s") % obj._meta.verbose_name,
                )
            )
        return "(Save and continue editing to link)"


class LetterSenderUser(JustfixUser):
    class Meta:
        proxy = True

        verbose_name = "User with Letter Sender letter"

        verbose_name_plural = "Users with Letter Sender letters"

        permissions = [
            ("view_saje_users", "Can view/download user data on behalf of SAJE"),
            ("view_rttc_users", "Can view/download user data on behalf of RTTC"),
        ]


LETTERS_MAILED = "_letters_mailed"

LETTERS_EMAILED = "_letters_emailed"


@admin.register(LetterSenderUser)
class LetterSenderUserAdmin(UserProxyAdmin):
    inlines = (
        LandlordDetailsInline,
        GCELetterInline,
    )

    list_display = UserProxyAdmin.list_display + [
        "city",
        "letters_mailed",
        "letters_emailed",
    ]

    @admin_field(
        short_description="State",
        admin_order_field="onboarding_info__state",
    )
    def state(self, obj):
        if hasattr(obj, "onboarding_info"):
            return obj.onboarding_info.state

    @admin_field(
        short_description="City",
        admin_order_field="onboarding_info__city",
    )
    def city(self, obj) -> str:
        return obj.onboarding_info.city

    @admin_field(
        short_description="Letter mailed",
        admin_order_field=LETTERS_MAILED,
    )
    def letters_mailed(self, obj) -> bool:
        return bool(getattr(obj, LETTERS_MAILED))

    @admin_field(
        short_description="Letter emailed",
        admin_order_field=LETTERS_EMAILED,
    )
    def letters_emailed(self, obj) -> bool:
        return bool(getattr(obj, LETTERS_EMAILED))

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
                            **{
                    LETTERS_MAILED: (
                        Count(
                            "lettersender_letters",
                            distinct=True,
                            filter=(Q(lettersender_letters__letter_sent_at__isnull=False)),
                        )
                    ),
                    LETTERS_EMAILED: (
                        Count(
                            "lettersender_letters",
                            distinct=True,
                            filter=(Q(lettersender_letters__letter_emailed_at__isnull=False)),
                        )
                    ),
                }
        )
        return queryset

    progress_annotation = LETTERSENDER_PROGRESS

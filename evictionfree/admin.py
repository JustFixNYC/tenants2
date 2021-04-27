from django.contrib import admin
from django.db.models import Q, Count
from django.db.models.functions import Concat

from users.models import JustfixUser
from users.admin_user_proxy import UserProxyAdmin
from project.util.admin_util import admin_field, never_has_permission
from onboarding.models import SIGNUP_INTENT_CHOICES
from loc.admin import LandlordDetailsInline
from loc.lob_django_util import SendableViaLobAdminMixin
from . import models


class HardshipDeclarationDetailsInline(admin.StackedInline):
    model = models.HardshipDeclarationDetails
    fields = [
        "index_number",
        "has_financial_hardship",
        "has_health_risk",
    ]

    has_add_permission = never_has_permission

    verbose_name = "Hardship declaration details"

    verbose_name_plural = verbose_name


class SubmittedHardshipDeclarationInline(admin.StackedInline, SendableViaLobAdminMixin):
    model = models.SubmittedHardshipDeclaration
    fields = [
        "created_at",
        "emailed_to_housing_court_at",
        "emailed_at",
        "mailed_at",
        "lob_integration",
    ]
    readonly_fields = fields

    has_add_permission = never_has_permission


class EvictionFreeUser(JustfixUser):
    class Meta:
        proxy = True

        verbose_name = "User with EvictionFreeNY declaration"

        verbose_name_plural = "Users with EvictionFreeNY declarations"

        permissions = [
            (
                "view_evictionfree_rtc_users",
                "Can view/download EvictionFreeNY.org user data on behalf of RTC",
            ),
            (
                "view_evictionfree_hj4a_users",
                "Can view/download EvictionFreeNY.org user data on behalf of HJ4A",
            ),
        ]


LETTERS_MAILED = "_letters_mailed"

LETTERS_EMAILED = "_letters_emailed"

CITY = "_city"


@admin.register(EvictionFreeUser)
class EvictionFreeUserAdmin(UserProxyAdmin):
    inlines = (
        LandlordDetailsInline,
        HardshipDeclarationDetailsInline,
        SubmittedHardshipDeclarationInline,
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
        short_description="City/borough",
        admin_order_field=CITY,
    )
    def city(self, obj) -> str:
        return getattr(obj, CITY)

    @admin_field(
        short_description="Declaration mailed to LL",
        admin_order_field=LETTERS_MAILED,
    )
    def letters_mailed(self, obj) -> bool:
        return bool(getattr(obj, LETTERS_MAILED))

    @admin_field(
        short_description="Declaration emailed to LL",
        admin_order_field=LETTERS_EMAILED,
    )
    def letters_emailed(self, obj) -> bool:
        return bool(getattr(obj, LETTERS_EMAILED))

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.annotate(
            **{
                CITY: Concat("onboarding_info__borough", "onboarding_info__non_nyc_city"),
                LETTERS_MAILED: (
                    Count(
                        "submitted_hardship_declaration",
                        distinct=True,
                        filter=(Q(submitted_hardship_declaration__mailed_at__isnull=False)),
                    )
                ),
                LETTERS_EMAILED: (
                    Count(
                        "submitted_hardship_declaration",
                        distinct=True,
                        filter=(Q(submitted_hardship_declaration__emailed_at__isnull=False)),
                    )
                ),
            }
        )
        return queryset

    def filter_queryset_for_changelist_view(self, queryset):
        return queryset.annotate(
            letter_count=Count("submitted_hardship_declaration", distinct=True),
        ).filter(
            Q(letter_count__gt=0)
            | Q(onboarding_info__signup_intent__in=[SIGNUP_INTENT_CHOICES.EVICTIONFREE])
        )

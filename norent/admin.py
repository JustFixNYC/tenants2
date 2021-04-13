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


class LetterInline(admin.StackedInline, SendableViaLobAdminMixin):
    model = models.Letter
    fields = [
        "rent_periods",
        "created_at",
        "letter_emailed_at",
        "letter_sent_at",
        "lob_integration",
    ]
    readonly_fields = fields

    has_add_permission = never_has_permission

    ordering = ["-created_at"]


@admin.register(models.RentPeriod)
class RentPeriodAdmin(admin.ModelAdmin):
    list_display = ["payment_date"]


class NorentUser(JustfixUser):
    class Meta:
        proxy = True

        verbose_name = "User with NoRent letter"

        verbose_name_plural = "Users with NoRent letters"

        permissions = [
            ("view_saje_users", "Can view/download user data on behalf of SAJE"),
            ("view_rttc_users", "Can view/download user data on behalf of RTTC"),
        ]


LETTERS_MAILED = "_letters_mailed"

LETTERS_EMAILED = "_letters_emailed"

CITY = "_city"


@admin.register(NorentUser)
class NorentUserAdmin(UserProxyAdmin):
    inlines = (
        LandlordDetailsInline,
        LetterInline,
    )

    list_display = UserProxyAdmin.list_display + [
        "city",
        "state",
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
                CITY: Concat("onboarding_info__borough", "onboarding_info__non_nyc_city"),
                LETTERS_MAILED: (
                    Count(
                        "norent_letters",
                        distinct=True,
                        filter=(Q(norent_letters__letter_sent_at__isnull=False)),
                    )
                ),
                LETTERS_EMAILED: (
                    Count(
                        "norent_letters",
                        distinct=True,
                        filter=(Q(norent_letters__letter_emailed_at__isnull=False)),
                    )
                ),
            }
        )
        return queryset

    def filter_queryset_for_changelist_view(self, queryset):
        return queryset.annotate(letter_count=Count("norent_letters", distinct=True),).filter(
            Q(letter_count__gt=0)
            | Q(onboarding_info__signup_intent__in=[SIGNUP_INTENT_CHOICES.NORENT])
        )

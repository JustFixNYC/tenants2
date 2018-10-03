from django.contrib import admin

from .models import LegacyUserInfo


class LegacyUserInline(admin.StackedInline):
    model = LegacyUserInfo
    verbose_name = "Legacy tenant app info"
    verbose_name_plural = verbose_name

    readonly_fields = ['role']

from django.contrib import admin

from .models import TwofactorInfo


@admin.register(TwofactorInfo)
class TwofactorInfoAdmin(admin.ModelAdmin):
    list_display = ["user", "has_user_seen_secret_yet"]

    ordering = ["user"]

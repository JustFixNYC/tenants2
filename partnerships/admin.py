from django.contrib import admin

from . import models


@admin.register(models.PartnerOrg)
class PartnerOrgAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "website")

    filter_horizontal = ("users",)

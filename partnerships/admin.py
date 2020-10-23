from django.contrib import admin

from . import models


@admin.register(models.PartnerOrg)
class PartnerOrgAdmin(admin.ModelAdmin):
    filter_horizontal = ('users',)

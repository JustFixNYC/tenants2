from project.util.admin_util import admin_field
from django.contrib import admin

from project.util.site_util import absolute_reverse
from . import models


@admin.register(models.Link)
class LinkAdmin(admin.ModelAdmin):
    list_display = ["title", "slug", "short_link", "url"]

    fields = ["title", "url", "slug", "short_link", "description"]

    readonly_fields = ["short_link"]

    add_fields = ["title", "url", "slug", "description"]

    @admin_field(admin_order_field="slug")
    def short_link(self, obj):
        if obj is not None and obj.pk:
            return absolute_reverse("shortlinks:redirect", kwargs={"slug": obj.slug})

        return "(This will be set once you save the link.)"

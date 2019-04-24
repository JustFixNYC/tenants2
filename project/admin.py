from django.contrib import admin
from django.urls import path

from .views import react_rendered_view
from .admin_download_data import DownloadDataViews
from loc.admin_views import LocAdminViews


class JustfixAdminSite(admin.AdminSite):
    site_header = "JustFix.nyc Tenant App"
    site_title = "Tenant App admin"
    index_title = "Justfix.nyc Tenant App administration"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.loc_views = LocAdminViews(self)
        self.download_data_views = DownloadDataViews(self)

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('login/', react_rendered_view),
            *self.download_data_views.get_urls(),
            *self.loc_views.get_urls(),
        ]
        return my_urls + urls

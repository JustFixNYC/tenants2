from django.contrib import admin
from django.urls import path

from .views import react_rendered_view
from .admin_download_data import DownloadDataViews
from .admin_dashboard import DashboardViews
from project.util.site_util import get_site_name
from loc.admin_views import LocAdminViews


class JustfixAdminSite(admin.AdminSite):
    site_header = f"{get_site_name()} Tenant Platform"
    site_title = f"Tenant App admin"
    index_title = f"{get_site_name()} Tenant Platform administration"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.loc_views = LocAdminViews(self)
        self.download_data_views = DownloadDataViews(self)
        self.dashboard_views = DashboardViews(self)

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('login/', react_rendered_view),
            path('conversations/', react_rendered_view),
            *self.dashboard_views.get_urls(),
            *self.download_data_views.get_urls(),
            *self.loc_views.get_urls(),
        ]
        return my_urls + urls

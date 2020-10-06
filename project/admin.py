from django.contrib import admin
from django.urls import path

import frontend.views
from .frontapp import embeddable_in_frontapp
from .admin_download_data import DownloadDataViews
from .admin_dashboard import DashboardViews
from project.util.site_util import get_site_name
from loc.admin_views import LocAdminViews
from hpaction.admin_views import HPActionAdminViews


class JustfixAdminSite(admin.AdminSite):
    site_header = f"{get_site_name()} Tenant Platform"
    site_title = f"Tenant App admin"
    index_title = f"{get_site_name()} Tenant Platform administration"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.loc_views = LocAdminViews(self)
        self.download_data_views = DownloadDataViews(self)
        self.dashboard_views = DashboardViews(self)
        self.hpaction_views = HPActionAdminViews(self)

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('login/', embeddable_in_frontapp(frontend.views.react_rendered_view)),
            path('conversations/', frontend.views.react_rendered_view),
            path('frontapp/', embeddable_in_frontapp(frontend.views.react_rendered_view)),
            *self.dashboard_views.get_urls(),
            *self.download_data_views.get_urls(),
            *self.loc_views.get_urls(),
            *self.hpaction_views.get_urls(),
        ]
        return my_urls + urls

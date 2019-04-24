from django.contrib import admin
from django.urls import path
from django.template.response import TemplateResponse

from .views import react_rendered_view
from .admin_download_data import download_streaming_data, get_available_datasets
from loc.admin_views import LocAdminViews


class JustfixAdminSite(admin.AdminSite):
    site_header = "JustFix.nyc Tenant App"
    site_title = "Tenant App admin"
    index_title = "Justfix.nyc Tenant App administration"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.loc_views = LocAdminViews(self)

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('login/', react_rendered_view),
            path('download-data/', self.admin_view(self.download_data_page),
                 name='download-data-index'),
            path('download-data/<slug:dataset>.<slug:fmt>',
                 self.admin_view(download_streaming_data),
                 name='download-data'),
        ] + self.loc_views.get_urls()
        return my_urls + urls

    def download_data_page(self, request):
        return TemplateResponse(request, "admin/justfix/download_data.html", {
            **self.each_context(request),
            'datasets': get_available_datasets(request.user),
            'title': "Download data"
        })

from django.contrib import admin
from django.urls import path
from django.template.response import TemplateResponse

from .views import react_rendered_view


class JustfixAdminSite(admin.AdminSite):
    site_header = "JustFix.nyc Tenant App"
    site_title = "Tenant App admin"
    index_title = "Justfix.nyc Tenant App administration"

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('login/', react_rendered_view),
            path('download-data/', self.admin_view(self.download_data_page),
                 name='download-data')
        ]
        return my_urls + urls

    def download_data_page(self, request):
        return TemplateResponse(request, "admin/justfix/download_data.html", {
            **self.each_context(request),
            'title': "Download data"
        })

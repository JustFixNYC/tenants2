import datetime
from django.contrib import admin
from django.urls import path
from django.template.response import TemplateResponse
from django.contrib.auth.decorators import permission_required

from project.management.commands.userstats import get_user_stats_rows
from project.util.streaming_csv import streaming_csv_response
from users.models import CHANGE_USER_PERMISSION
from .views import react_rendered_view
from loc.admin_views import LocAdminViews


@permission_required(CHANGE_USER_PERMISSION)
def download_userstats(request):
    today = datetime.datetime.today().strftime('%Y-%m-%d')
    include_pad_bbl = request.GET.get('include_pad_bbl', '') == 'on'
    extra = '-with-bbls' if include_pad_bbl else ''
    return streaming_csv_response(get_user_stats_rows(
        include_pad_bbl=include_pad_bbl
    ), f'userstats{extra}-{today}.csv')


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
                 name='download-data'),
            path('download-data/userstats.csv', self.admin_view(download_userstats),
                 name='download-userstats'),
        ] + self.loc_views.get_urls()
        return my_urls + urls

    def download_data_page(self, request):
        return TemplateResponse(request, "admin/justfix/download_data.html", {
            **self.each_context(request),
            'title': "Download data"
        })

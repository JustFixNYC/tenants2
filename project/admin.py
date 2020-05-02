from django.contrib import admin
from django.urls import path

from .views import react_rendered_view
from .admin_download_data import DownloadDataViews
from .admin_dashboard import DashboardViews
from project.util.site_util import get_site_name
from project.util.admin_util import make_edit_link, admin_field
from loc.admin_views import LocAdminViews
import airtable.sync


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


@admin_field(admin_order_field='onboarding_info__signup_intent')
def user_signup_intent(self, obj):
    if hasattr(obj, 'onboarding_info'):
        return obj.onboarding_info.signup_intent


class UserProxyAdmin(airtable.sync.SyncUserOnSaveMixin, admin.ModelAdmin):
    list_display = [
        'phone_number', 'first_name', 'last_name', 'last_login', 'signup_intent'
    ]

    fields = [
        'first_name', 'last_name', 'phone_number', 'email',
        'signup_intent', 'address',
        'edit_user'
    ]

    readonly_fields = fields

    ordering = ('-last_login',)

    search_fields = ['phone_number', 'username', 'first_name', 'last_name', 'email']

    edit_user = make_edit_link("View/edit user details")

    signup_intent = user_signup_intent

    def address(self, obj):
        if hasattr(obj, 'onboarding_info'):
            return ', '.join(obj.onboarding_info.address_lines_for_mailing)

    def filter_queryset_for_changelist_view(self, queryset):
        return queryset

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        queryset = queryset.prefetch_related('onboarding_info')
        if request.resolver_match.func.__name__ == "changelist_view":
            queryset = self.filter_queryset_for_changelist_view(queryset)
        return queryset

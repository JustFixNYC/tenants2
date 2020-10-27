from django.urls import path

from . import views


app_name = 'partnerships'

urlpatterns = [
    path(r'<slug:partner_slug>', views.activate_referral, name='activate_referral'),
]

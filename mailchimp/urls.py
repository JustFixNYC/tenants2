from django.urls import path

from . import views


app_name = 'mailchimp'

urlpatterns = [
    path(r'subscribe', views.subscribe, name='subscribe'),
]

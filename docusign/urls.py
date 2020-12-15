from django.urls import path

from . import views

app_name = "docusign"

urlpatterns = [
    path("callback", views.callback, name="callback"),
    path("consent", views.consent, name="consent"),
]

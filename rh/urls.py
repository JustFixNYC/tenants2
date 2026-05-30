from django.urls import path

from . import views

app_name = "rh"

urlpatterns = [
    path("requests", views.requests, name="requests"),
    path("submit", views.submit, name="submit"),
]

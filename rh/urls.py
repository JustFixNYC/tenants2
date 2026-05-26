from django.urls import path

from rh import views


app_name = "rh"

urlpatterns = [
    path("", views.submit_rent_history_request, name="submit_rent_history_request"),
]

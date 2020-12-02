from django.urls import path

from . import views


app_name = "data_requests"

urlpatterns = [
    path("multi-landlord.csv", views.download_multi_landlord_csv, name="multi-landlord-csv"),
]

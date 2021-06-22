from django.urls import path

from . import views

app_name = "nycx"

urlpatterns = [
    path(r"address", views.evaluate_address),
]

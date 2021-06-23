from django.urls import path

from . import views

app_name = "nycx"

urlpatterns = [
    path(r"", views.index, name="index"),
    path(r"address", views.evaluate_address, name="address"),
]

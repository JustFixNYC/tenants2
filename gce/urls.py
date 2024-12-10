from django.urls import path

from . import views


app_name = "gce"

urlpatterns = [
    path("upload", views.upload, name="upload"),
]

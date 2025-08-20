from django.urls import path

from . import views


app_name = "gceletter"

urlpatterns = [
    path("upload", views.upload, name="upload"),
]

from django.urls import path

from . import views


app_name = "efnyc"

urlpatterns = [
    path("upload", views.upload, name="upload"),
] 
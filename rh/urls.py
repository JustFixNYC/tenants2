from django.urls import path

from . import views

app_name = "rh"

urlpatterns = [
    path("submit", views.submit, name="submit"),
    path("send-email", views.send_email, name="send_email"),
]

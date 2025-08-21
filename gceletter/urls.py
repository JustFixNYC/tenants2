from django.urls import path

from . import views


app_name = "gceletter"

urlpatterns = [
    path("upload", views.upload, name="upload"),
    path("<str:hash>/gce-letter.pdf", views.gce_letter_pdf, name="gce_letter_pdf"),
    path("letter-link", views.get_letter_link, name="get_letter_link"),
]

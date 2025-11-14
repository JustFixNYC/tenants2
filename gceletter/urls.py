from django.urls import path

from . import views


app_name = "gceletter"

urlpatterns = [
    path("send-letter", views.submit_letter, name="send-letter"),
    path("verify_address", views.lob_verify_address, name="lob_verify_address"),
    path("<str:hash>/gce-letter.pdf", views.gce_letter_pdf, name="gce_letter_pdf"),
    path("letter-link", views.get_letter_link, name="get_letter_link"),
    path("coming-soon-subscribe", views.coming_soon_subscribe, name="coming_soon_subscribe"),
]

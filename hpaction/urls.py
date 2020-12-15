from django.urls import path

from . import views, ehpa_affadavit


app_name = "hpaction"

urlpatterns = [
    path("upload/<str:token_str>", views.upload, name="upload"),
    path("<slug:kind>/latest.pdf", views.latest_pdf, name="latest_pdf"),
    path("latest.pdf", views.legacy_latest_pdf, name="legacy_latest_pdf"),
    path(
        "example-ehpa-affadavit.pdf", ehpa_affadavit.example_pdf, name="example_ehpa_affadavit_pdf"
    ),
]

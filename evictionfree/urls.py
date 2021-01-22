from django.urls import path

from . import views


app_name = "evictionfree"

urlpatterns = [
    path(
        "example-declaration.pdf",
        views.render_example_declaration_pdf,
        name="example_declaration_pdf",
    ),
    path(
        "preview-declaration.pdf",
        views.render_preview_declaration_pdf_for_user,
        name="preview_declaration_pdf",
    ),
]

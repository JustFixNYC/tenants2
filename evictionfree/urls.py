from django.urls import path

from . import views


app_name = "evictionfree"

urlpatterns = [
    path(
        "example-declaration.pdf",
        views.render_example_declaration_pdf,
        name="example_declaration_pdf",
    ),
]

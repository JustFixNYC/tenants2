from django.urls import re_path, path

from . import views


urlpatterns = [
    re_path(r'^letter\.(html|pdf)$', views.letter_of_complaint_doc, name='loc'),
    path(r'admin/<int:user_id>/letter.pdf', views.letter_of_complaint_pdf_for_user,
         name='loc_for_user'),
    re_path(r'^example\.(html|pdf)$', views.example_doc),
]

from django.urls import re_path, path

from . import views


urlpatterns = [
    path(r'finished-letter.pdf', views.finished_loc_pdf, name='finished_loc_pdf'),
    path(r'admin/envelopes.pdf', views.envelopes, name='loc_envelopes'),
    path(r'admin/<int:user_id>/letter.pdf',
         views.letter_of_complaint_pdf_for_user,
         name='loc_for_user'),
    re_path(r'^example\.(html|pdf)$', views.example_doc, name='loc_example'),
]

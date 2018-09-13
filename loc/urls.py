from django.urls import re_path

from . import views


urlpatterns = [
    re_path(r'letter\.(html|pdf)$', views.letter_of_complaint_doc, name='loc'),
    re_path(r'example\.(html|pdf)$', views.example_doc),
]

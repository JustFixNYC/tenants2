from django.urls import path

from . import views


app_name = 'hpaction'

urlpatterns = [
    path('upload/<str:token_str>', views.upload, name='upload'),
    path('<slug:kind>/latest.pdf', views.latest_pdf, name='latest_pdf'),
    path('latest.pdf', views.legacy_latest_pdf, name='legacy_latest_pdf'),
    path('ehpa-affadavit.pdf', views.ehpa_affadavit_pdf, name='ehpa_affadavit_pdf'),
]

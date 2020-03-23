from django.urls import path

from . import views


app_name = 'hpaction'

urlpatterns = [
    path('upload/<str:token_str>', views.upload, name='upload'),
    path('latest.pdf', views.latest_pdf, name='latest_pdf'),
    path('docusign/callback', views.docusign_callback, name='docusign_callback'),
    path('docusign/consent', views.docusign_consent, name='docusign_consent'),
]

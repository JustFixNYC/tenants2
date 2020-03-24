from django.urls import path

from . import views, docusign_views


app_name = 'hpaction'

urlpatterns = [
    path('upload/<str:token_str>', views.upload, name='upload'),
    path('latest.pdf', views.latest_pdf, name='latest_pdf'),
    path('docusign/', docusign_views.index, name='docusign_index'),
    path('docusign/sign-hpa', docusign_views.sign_hpa, name='docusign_sign_hpa'),
    path('docusign/callback', docusign_views.callback, name='docusign_callback'),
    path('docusign/consent', docusign_views.consent, name='docusign_consent'),
]

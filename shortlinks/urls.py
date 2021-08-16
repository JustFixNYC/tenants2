from django.urls import re_path

from . import views

app_name = "shortlinks"

urlpatterns = [
    re_path(r"(?P<slug>[A-Za-z0-9\-_]+)", views.redirect_to_link, name="redirect"),
]

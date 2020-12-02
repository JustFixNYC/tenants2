from django.http import HttpResponse
from django.urls import path

from twofactor import util
import project.urls


def autoverify(request):
    util.verify_request_user(request)
    return HttpResponse("you are now verified")


urlpatterns = [
    path("autoverify", autoverify),
] + project.urls.urlpatterns

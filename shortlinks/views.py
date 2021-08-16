from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404

from .models import Link


def redirect_to_link(request, slug):
    link = get_object_or_404(Link, slug=slug)
    return HttpResponseRedirect(link.url)

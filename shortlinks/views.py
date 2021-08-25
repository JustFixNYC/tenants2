from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404

from .models import Link


def redirect_to_link(request, slug):
    formatted_slug = slug.lower()
    link = get_object_or_404(Link, slug=formatted_slug)
    return HttpResponseRedirect(link.url)

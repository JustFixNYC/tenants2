"""project URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from graphene_django.views import GraphQLView

import loc.views
from .views import react_rendered_view


urlpatterns = [
    path('admin/', admin.site.urls),
    path('loc/letter.pdf', loc.views.letter_of_complaint_pdf),
    path('loc/example.pdf', loc.views.example_pdf),
    path('graphql', GraphQLView.as_view(batch=True), name='batch-graphql'),
]

if settings.DEBUG:
    # Graphene throws an assertion error if we attempt to enable *both* graphiql
    # *and* batch mode on the same endpoint, so we'll use a separate one for
    # graphiql.
    urlpatterns.append(
        path('graphiql', GraphQLView.as_view(graphiql=True)))

urlpatterns.append(re_path(r'^(?P<url>.*)$', react_rendered_view))

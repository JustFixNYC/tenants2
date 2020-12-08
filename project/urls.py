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
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from graphene_django.views import GraphQLView

from .views import example_server_error, redirect_favicon, health
from .frontapp import embeddable_in_frontapp
import frontend.views
from users.views import verify_email
import twofactor.views

dev_patterns = (
    [
        path("examples/server-error/<slug:id>", example_server_error),
        re_path(r"^.*$", frontend.views.react_rendered_view),
    ],
    "dev",
)

urlpatterns = [
    path("verify", embeddable_in_frontapp(twofactor.views.verify), name="verify"),
    path("verify-email", verify_email, name="verify_email"),
    path("health", health, name="health"),
    path("admin/", admin.site.urls),
    path("safe-mode/", include("frontend.safe_mode")),
    path("favicon.ico", redirect_favicon),
    path("dev/", include(dev_patterns, namespace="dev")),
    path("docusign/", include("docusign.urls")),
    path("data-requests/", include("data_requests.urls")),
    path("mailchimp/", include("mailchimp.urls")),
    path("p/", include("partnerships.urls")),
]

if settings.DEBUG:
    # Graphene throws an assertion error if we attempt to enable *both* graphiql
    # *and* batch mode on the same endpoint, so we'll use a separate one for
    # graphiql.
    urlpatterns.append(path("graphiql", GraphQLView.as_view(graphiql=True)))

urlpatterns += i18n_patterns(
    path("loc/", include("loc.urls")),
    path("hp/", include("hpaction.urls")),
    path("graphql", GraphQLView.as_view(batch=True), name="batch-graphql"),
    re_path(r".*$", frontend.views.react_rendered_view, name="react"),
)

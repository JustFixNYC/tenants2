import factory

from shortlinks.models import Link


class LinkFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Link

    title = "Housing Court Answers"

    url = "http://housingcourtanswers.org/"

    slug = "hca"

    description = "Our awesome partner's website."

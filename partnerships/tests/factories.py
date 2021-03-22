import factory

from partnerships.models import PartnerOrg


class PartnerOrgFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PartnerOrg

    name = "Justice for All Coalition"

    slug = "j4ac"

    website = "https://j4ac.us"

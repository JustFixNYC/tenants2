from django.db import models

from users.models import JustfixUser


class PartnerOrg(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
        help_text="The name of the partner organization."
    )

    slug = models.SlugField(
        max_length=20,
        unique=True,
        help_text="The short identifier for the partner organization.",
    )

    website = models.URLField(
        help_text="The primary website of the partner organization."
    )

    users = models.ManyToManyField(
        JustfixUser,
        blank=True,
        help_text="Users whose details the partner organization has access to.",
        related_name='partner_orgs',
    )

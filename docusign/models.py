from django.db import models


class Config(models.Model):
    """
    Contains configuration data for DocuSign integration.

    This model is a singleton.
    """

    # The private key for the DocuSign Service Integration.
    private_key = models.TextField(blank=True)

    # The consent code allowing us to impersonate a DocuSign user and perform
    # actions on their behalf.
    consent_code = models.TextField(blank=True)

    # When the consent was given to us.
    consent_code_updated_at = models.DateTimeField(blank=True, null=True)

    # The Base URI of the DocuSign API.
    base_uri = models.URLField(blank=True)

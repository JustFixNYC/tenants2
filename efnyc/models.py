from django.db import models

from project.util import phone_number as pn


class EfnycPhoneNumber(models.Model):
    """
    Model to store phone numbers for EFNYC upload endpoint.
    This mirrors the gce upload endpoint but only accepts phone numbers.
    """
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    phone_number = models.CharField(
        blank=True,
        **pn.get_model_field_kwargs(),
    )
    
    def __str__(self):
        return f"EFNYC Phone: {self.phone_number} ({self.created_at})"
    
    class Meta:
        verbose_name = "EFNYC Phone Number"
        verbose_name_plural = "EFNYC Phone Numbers" 
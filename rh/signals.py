from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

from .schema import RhFormInfo


@receiver(user_logged_in)
def remove_session_info(sender, request, **kwargs):
    RhFormInfo.clear_from_request(request)

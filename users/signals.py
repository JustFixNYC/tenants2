from django.dispatch import receiver
from django.db.models.signals import m2m_changed
from django.contrib.auth.models import Group

from .models import JustfixUser, logger


@receiver(m2m_changed, sender=JustfixUser.groups.through)
@receiver(m2m_changed, sender=JustfixUser.user_permissions.through)
@receiver(m2m_changed, sender=Group.permissions.through)
def log_m2m_change(sender, instance, action, reverse, model, pk_set, **kwargs):
    """Log changes for many-to-many fields, notably around permissions and
    groups"""

    model_name = model._meta.verbose_name_plural
    instance_model = instance._meta.verbose_name
    if action == 'post_add':
        objects_added = list(model.objects.filter(pk__in=pk_set))
        logger.info(f"{model_name} given to {instance_model} '{instance}': {objects_added}")
    elif action == 'post_remove':
        objects_added = list(model.objects.filter(pk__in=pk_set))
        logger.info(
            f"{model_name} removed from {instance_model} '{instance}': {objects_added}")
    elif action == 'post_clear':
        logger.info(f"All {model_name} removed from {instance_model} '{instance}'")

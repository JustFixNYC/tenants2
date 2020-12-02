from django.dispatch import receiver
from django.db.models.signals import m2m_changed, post_save
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.contrib.auth.models import Group
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE, DELETION

from .models import JustfixUser, logger


@receiver(user_logged_in)
def log_user_logged_in(sender, request, user, **kwargs):
    logger.info(f"{user} logged in.")


@receiver(user_logged_out)
def log_user_logged_out(sender, request, user, **kwargs):
    logger.info(f"{user} logged out.")


@receiver(user_login_failed)
def user_login_failed_callback(sender, credentials, **kwargs):
    phone_number = credentials.get("phone_number")
    if phone_number:
        user = JustfixUser.objects.filter(phone_number=phone_number).first()
        if user:
            logger.info(f"User login failed for {user.username}.")
            return
    logger.info(f"User login failed for unknown user.")


@receiver(m2m_changed, sender=JustfixUser.groups.through)
@receiver(m2m_changed, sender=JustfixUser.user_permissions.through)
@receiver(m2m_changed, sender=Group.permissions.through)
def log_m2m_change(sender, instance, action, reverse, model, pk_set, **kwargs):
    """
    Log changes for many-to-many fields, notably around permissions and
    groups.
    """

    model_name = model._meta.verbose_name_plural
    instance_model = instance._meta.verbose_name
    if action == "post_add":
        objects_added = list(model.objects.filter(pk__in=pk_set))
        logger.info(f"{model_name} given to {instance_model} '{instance}': {objects_added}.")
    elif action == "post_remove":
        objects_added = list(model.objects.filter(pk__in=pk_set))
        logger.info(f"{model_name} removed from {instance_model} '{instance}': {objects_added}.")
    elif action == "post_clear":
        logger.info(f"All {model_name} removed from {instance_model} '{instance}'.")


@receiver(post_save, sender=LogEntry)
def adminlog_post_save(sender, instance, **kwargs):
    """
    Django's admin already logs when edits are made. Pass that along to our
    logging system.
    """

    if instance.action_flag == ADDITION:
        logger.info(
            f"{instance.user.username} created {instance.content_type} '{instance.object_repr}'."
        )
    elif instance.action_flag == DELETION:
        logger.info(
            f"{instance.user.username} deleted {instance.content_type} '{instance.object_repr}'."
        )
    elif instance.action_flag == CHANGE:
        logger.info(
            f"{instance.user.username} changed {instance.content_type} '{instance.object_repr}': "
            f"{instance.change_message}."
        )

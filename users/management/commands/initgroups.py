from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from django.db import transaction

from users.permission_util import get_permissions_from_ns_codenames
from users.models import ROLES


class Command(BaseCommand):
    help = """\
    Initializes some helpful initial permission groups.
    """

    def set_perms(self, groupname, perms):
        self.stdout.write("Setting permissions for group '%s'." % groupname)
        if self.verbosity >= 2:
            self.stdout.write("  Permissions: %s" % ", ".join(perms))
        try:
            group = Group.objects.get(name=groupname)
        except Group.DoesNotExist:
            self.stdout.write("  Group does not exist, creating it.")
            group = Group(name=groupname)
            group.save()
        group.permissions.set(get_permissions_from_ns_codenames(perms))
        group.save()

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.verbosity = int(kwargs["verbosity"])
        for groupname, perms in ROLES.items():
            self.set_perms(groupname, perms)
        self.stdout.write("Done.")
        self.stdout.write(
            "Please do not manually change these " "groups; they may be updated in the future."
        )

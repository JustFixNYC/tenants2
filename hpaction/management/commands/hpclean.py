from django.core.management.base import BaseCommand

from hpaction.models import HPActionDocuments, UploadToken


class Command(BaseCommand):
    help = (
        "Purge all HP Action-related information and documents "
        "that have been scheduled for deletion."
    )

    def handle(self, *args, **options):
        self.stdout.write("Purging unneeded HP Action documents...\n")
        HPActionDocuments.objects.purge()
        self.stdout.write("Purging expired upload tokens...\n")
        UploadToken.objects.remove_expired()

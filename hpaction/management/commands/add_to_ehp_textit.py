from django.conf import settings
from django.core.management.base import CommandError, BaseCommand
from temba_client.v2 import TembaClient

from rapidpro.followup_campaigns import DjangoSettingsFollowupCampaigns
from hpaction.models import DocusignEnvelope, HP_DOCUSIGN_STATUS_CHOICES


class Command(BaseCommand):
    '''
    Command for retroactively adding all EHP signers to the EHP flow.

    Note that from TextIt's point of view, they will have filed for an
    EHP *today*.  This is basically the easiest way to put them on our
    campaign, which triggers a day after a user has filed an EHP.  (If
    we used the real date they filed an EHP, almost all of them would
    never actually be put on the flow.)
    '''

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', help="don't actually update records",
                            action='store_true')

    def handle(self, *args, **options):
        if not settings.RAPIDPRO_API_TOKEN:
            raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
        client = TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
        dry_run: bool = options['dry_run']
        cname = "EHP"
        campaign = DjangoSettingsFollowupCampaigns.get_campaign(cname)
        assert campaign is not None, f"campaign {cname} must be defined"

        envs = DocusignEnvelope.objects.filter(
            status=HP_DOCUSIGN_STATUS_CHOICES.SIGNED
        ).prefetch_related('docs__user')

        for env in envs:
            user = env.docs.user
            print(f"Putting user {user} / {user.phone_number} on {cname} campaign.")
            if not dry_run:
                campaign.add_contact(client, user.full_name, user.phone_number)

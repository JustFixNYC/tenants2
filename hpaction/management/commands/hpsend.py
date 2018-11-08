from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
import zeep

from users.models import JustfixUser
from hpaction.views import SUCCESSFUL_UPLOAD_TEXT
from hpaction.models import UploadToken


API_ENDPOINT = "https://lhiutilitystage.lawhelpinteractive.org/LHIIntegration/LHIIntegration.svc"

TEMPLATE_ID = "5395"

# TODO: We need to replace this with an actual answer file
# that has actual answers in it.
EMPTY_ANSWER_FILE = """\
<?xml version="1.0" encoding="utf-16" standalone="yes"?>
<AnswerSet title="New Answer File" version="1.1"></AnswerSet>
"""


class Command(BaseCommand):
    help = (
        'Send an HP Action document assembly request.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            help='The username to send an HP Action document assembly request for.'
        )

    def handle(self, *args, **options):
        if not settings.HP_ACTION_CUSTOMER_KEY:
            raise CommandError('HP_ACTION_CUSTOMER_KEY is not defined!')

        user = JustfixUser.objects.get(username=options['username'])
        token = UploadToken.objects.create_for_user(user)

        self.stdout.write('Created upload token. Sending SOAP request...\n')
        client = zeep.Client(f"{settings.HP_ACTION_API_ENDPOINT}?wsdl")

        hotdocs_xml = EMPTY_ANSWER_FILE

        result = client.service.GetAnswersAndDocuments(
            CustomerKey=settings.HP_ACTION_CUSTOMER_KEY,
            TemplateId=TEMPLATE_ID,
            HDInfo=hotdocs_xml,
            DocID=token.token,
            PostBackUrl=token.get_upload_url()
        )

        if result != SUCCESSFUL_UPLOAD_TEXT:
            raise CommandError(
                f"Received unexpected response from server: {result}")

        self.stdout.write("Successfully received HP Action documents.\n")

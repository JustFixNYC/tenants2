from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
import zeep

from users.models import JustfixUser
from hpaction.views import SUCCESSFUL_UPLOAD_TEXT
from hpaction.models import UploadToken, HPActionDocuments
from hpaction.hotdocs import AnswerSet


API_ENDPOINT = "https://lhiutilitystage.lawhelpinteractive.org/LHIIntegration/LHIIntegration.svc"

TEMPLATE_ID = "5395"

EXTRACT_XML = 'hp-action.xml'

EXTRACT_PDF = 'hp-action.pdf'


class Command(BaseCommand):
    help = (
        'Send an HP Action document assembly request.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            help='The username to send an HP Action document assembly request for.'
        )
        parser.add_argument(
            '--extract-files',
            action='store_true',
            help=(
                f'Also extract the assembled documents to {EXTRACT_XML} '
                f'and {EXTRACT_PDF} in the current working directory.'
            )
        )

    def extract_files(self, token_id):
        docs = HPActionDocuments.objects.get(id=token_id)
        with docs.xml_file.open() as f:
            self.stdout.write(f'Writing {EXTRACT_XML}.\n')
            Path(EXTRACT_XML).write_bytes(f.read())
        with docs.pdf_file.open() as f:
            self.stdout.write(f'Writing {EXTRACT_PDF}.\n')
            Path(EXTRACT_PDF).write_bytes(f.read())

    def handle(self, *args, **options):
        if not settings.HP_ACTION_CUSTOMER_KEY:
            raise CommandError('HP_ACTION_CUSTOMER_KEY is not defined!')

        user = JustfixUser.objects.get(username=options['username'])
        token = UploadToken.objects.create_for_user(user)
        token_id = token.id

        self.stdout.write('Created upload token. Sending SOAP request...\n')
        client = zeep.Client(f"{settings.HP_ACTION_API_ENDPOINT}?wsdl")

        answers = AnswerSet()
        answers.add('Server name full TE', user.full_name)

        result = client.service.GetAnswersAndDocuments(
            CustomerKey=settings.HP_ACTION_CUSTOMER_KEY,
            TemplateId=TEMPLATE_ID,
            HDInfo=str(answers),
            DocID=token_id,
            PostBackUrl=token.get_upload_url()
        )

        if result != SUCCESSFUL_UPLOAD_TEXT:
            raise CommandError(
                f"Received unexpected response from server: {result}")

        self.stdout.write("Successfully received HP Action documents.\n")

        if options['extract_files']:
            self.extract_files(token_id)

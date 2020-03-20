import os
import base64
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import docusign_esign as docusign

from users.models import JustfixUser
from hpaction.models import HPActionDocuments
from project.util.site_util import absolutify_url


ACCESS_TOKEN_ARG_VAR = 'access-token'

ACCESS_TOKEN_ARG = f"--{ACCESS_TOKEN_ARG_VAR}"

ACCESS_TOKEN_ENV = 'DOCUSIGN_ACCESS_TOKEN'

ACCESS_TOKEN_URL = 'https://developers.docusign.com/oauth-token-generator'

API_BASE_PATH = 'https://demo.docusign.net/restapi'


class Command(BaseCommand):
    help = (
        'Create a signing request for an HP Action document.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            help='The username to send an HP Action signing request for.'
        )
        parser.add_argument(
            ACCESS_TOKEN_ARG,
            help=(
                "The OAuth access token to use. To get one, visit "
                f"{ACCESS_TOKEN_URL}. Alternatively, set "
                f"the {ACCESS_TOKEN_ENV} environment variable."
            )
        )

    def handle(self, *args, **options) -> None:
        if not settings.DOCUSIGN_ACCOUNT_ID:
            raise CommandError('DocuSign is not configured!')

        access_token = options.get(ACCESS_TOKEN_ARG_VAR) or os.environ.get(ACCESS_TOKEN_ENV)
        if not access_token:
            raise CommandError(
                f'Please define your OAuth access token using the {ACCESS_TOKEN_ARG} argument '
                f'or set the {ACCESS_TOKEN_ENV} environment variable. You can get an access '
                f'token at {ACCESS_TOKEN_URL}.'
            )

        username = options['username']
        user = JustfixUser.objects.get(username=username)

        if not user.email:
            raise CommandError(f"user {username} has no email address!")

        docs = HPActionDocuments.objects.get_latest_for_user(user)

        if not docs:
            raise CommandError(f"user {username} has no HP Action documents to sign!")

        pdf_bytes = docs.pdf_file.open().read()
        base64_pdf = base64.b64encode(pdf_bytes).decode('ascii')
        client_user_id = str(user.pk)
        return_url = absolutify_url('/')

        document = docusign.Document(
            document_base64=base64_pdf,
            name=f"HP Action forms for {user.full_name}",
            file_extension="pdf",
            document_id=1,
        )

        signer = docusign.Signer(
            email=user.email,
            name=user.full_name,
            recipient_id="1",
            routing_order="1",
            client_user_id=client_user_id,
        )

        sign_here_petition = docusign.SignHere(
            document_id='1',
            page_number='4',
            recipient_id='1',
            tab_label='SignHereTab',
            x_position='419',
            y_position='556',
        )

        sign_here_verification = docusign.SignHere(
            document_id='1',
            page_number='4',
            recipient_id='1',
            tab_label='SignHereTab',
            x_position='419',
            y_position='667',
        )

        sign_here_hpd_inspection = docusign.SignHere(
            document_id='1',
            page_number='5',
            recipient_id='1',
            tab_label='SignHereTab',
            x_position='446',
            y_position='625',
        )

        signer.tabs = docusign.Tabs(
            sign_here_tabs=[
                sign_here_petition,
                sign_here_verification,
                sign_here_hpd_inspection
            ],
        )

        envelope_definition = docusign.EnvelopeDefinition(
            email_subject=f"{user.full_name}, please sign these HP Action forms",
            documents=[document],
            recipients=docusign.Recipients(signers=[signer]),
            status="sent",
        )

        api_client = docusign.ApiClient()
        api_client.host = API_BASE_PATH
        api_client.set_default_header('Authorization', f'Bearer {access_token}')

        envelope_api = docusign.EnvelopesApi(api_client)
        results = envelope_api.create_envelope(
            settings.DOCUSIGN_ACCOUNT_ID,
            envelope_definition=envelope_definition
        )

        envelope_id = results.envelope_id
        recipient_view_request = docusign.RecipientViewRequest(
            authentication_method='None',  # TODO: This should probably change?
            client_user_id=client_user_id,
            recipient_id='1',
            return_url=return_url,
            user_name=user.full_name,
            email=user.email,
        )

        results = envelope_api.create_recipient_view(
            settings.DOCUSIGN_ACCOUNT_ID,
            envelope_id,
            recipient_view_request=recipient_view_request,
        )

        print(f"To sign, visit this URL within 5 minutes: {results.url}")
        print(f"When done, you will be redirected to {return_url}.")

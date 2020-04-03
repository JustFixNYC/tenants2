from typing import List
import base64
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.conf import settings

from users.models import JustfixUser
from docusign.core import docusign_client_user_id
from docusign.views import create_callback_url, append_querystring_args
import docusign_esign as dse
from .models import HPActionDocuments, DocusignEnvelope, HP_DOCUSIGN_STATUS_CHOICES


# The recipient ID for the tenant in the signing flow. This appears to be a
# number local to a specific signing, rather than a globally unique identifier.
TENANT_RECIPIENT_ID = '1'

# The document ID for the HP Action packet in the signing flow. This appears
# to be a number local to a specific signing, rather than a globally unique
# identifier.
HPA_DOCUMENT_ID = '1'


def get_contact_info(user: JustfixUser) -> str:
    ll_email = "unknown"
    ll_phone_number = "unknown"

    if hasattr(user, 'landlord_details'):
        ld = user.landlord_details
        ll_email = ld.email or ll_email
        ll_phone_number = ld.formatted_phone_number() or ll_phone_number

    return '\n'.join([
        f"landlord phone: {ll_phone_number}",
        f"landlord email: {ll_email}",
        f"tenant phone: {user.formatted_phone_number()}",
        f"tenant email: {user.email}",
    ])


def create_stacked_lines(
    lines: List[str],
    start_y: int,
    line_spacing: int = 10,
    **kwargs
) -> List[dse.Text]:
    y = start_y
    result: List[dse.Text] = []

    # This is weird, originally it seemed like DocuSign respected
    # newlines, but then it didn't at some point, so we'll play it
    # safe and manually break up the lines for it.
    for line in lines:
        result.append(dse.Text(
            **kwargs,
            value=line,
            y_position=str(y),
        ))
        y += line_spacing

    return result


def create_envelope_definition_for_hpa(docs: HPActionDocuments) -> dse.EnvelopeDefinition:
    '''
    Create a DocuSign envelope definition for the given HP Action documents.
    '''

    user = docs.user
    pdf_file = docs.open_emergency_pdf_file()
    if not pdf_file:
        raise Exception(
            'Unable to open emergency HP Action packet (it may only consist '
            'of instructions)'
        )
    pdf_bytes = pdf_file.read()
    base64_pdf = base64.b64encode(pdf_bytes).decode('ascii')

    document = dse.Document(
        document_base64=base64_pdf,
        name=f"HP Action forms for {user.full_name}",
        file_extension="pdf",
        document_id=HPA_DOCUMENT_ID,
    )

    signer = dse.Signer(
        email=user.email,
        name=user.full_name,
        recipient_id=TENANT_RECIPIENT_ID,
        routing_order="1",
        client_user_id=docusign_client_user_id(user),
    )

    # These coordinates were found by manually creating a DocuSign template based on
    # generated HP Action forms, creating fields using the drag-and-drop UI,
    # and noting their locations.

    sign_here_petition = dse.SignHere(
        document_id=HPA_DOCUMENT_ID,
        page_number='2',
        recipient_id=TENANT_RECIPIENT_ID,
        tab_label='SignHereTab',
        x_position='419',
        y_position='556',
    )

    sign_here_verification = dse.SignHere(
        document_id=HPA_DOCUMENT_ID,
        page_number='2',
        recipient_id=TENANT_RECIPIENT_ID,
        tab_label='SignHereTab',
        x_position='419',
        y_position='667',
    )

    sign_here_hpd_inspection = dse.SignHere(
        document_id=HPA_DOCUMENT_ID,
        page_number='3',
        recipient_id=TENANT_RECIPIENT_ID,
        tab_label='SignHereTab',
        x_position='446',
        y_position='625',
    )

    contact_info_lines = create_stacked_lines(
        lines=get_contact_info(user).splitlines(),
        start_y=25,
        document_id=HPA_DOCUMENT_ID,
        page_number='2',
        tab_label="ReadOnlyDataField",
        locked="true",
        x_position="27",
    )

    inspection_req_note_lines = create_stacked_lines(
        lines=["These conditions are immediately hazardous to the",
               "health and safety of my household."],
        start_y=103,
        document_id=HPA_DOCUMENT_ID,
        page_number='3',
        tab_label="ReadOnlyDataField",
        locked="true",
        x_position="16",
    )

    signer.tabs = dse.Tabs(
        text_tabs=[
            *contact_info_lines,
            *inspection_req_note_lines,
        ],
        sign_here_tabs=[
            sign_here_petition,
            sign_here_verification,
            sign_here_hpd_inspection
        ],
    )

    user_cc = dse.CarbonCopy(
        email=user.email,
        name=user.full_name,
        recipient_id="2",
        routing_order="2",
    )

    envelope_definition = dse.EnvelopeDefinition(
        email_subject=f"HP Action forms for {user.full_name}",
        documents=[document],
        recipients=dse.Recipients(signers=[signer], carbon_copies=[user_cc]),
        status="sent",
    )

    assert isinstance(envelope_definition, dse.EnvelopeDefinition)

    return envelope_definition


def create_envelope_for_hpa(
    envelope_definition: dse.EnvelopeDefinition,
    api_client: dse.ApiClient,
) -> str:
    envelope_api = dse.EnvelopesApi(api_client)
    envelope = envelope_api.create_envelope(
        settings.DOCUSIGN_ACCOUNT_ID,
        envelope_definition=envelope_definition
    )

    assert isinstance(envelope, dse.EnvelopeSummary)

    envelope_id: str = envelope.envelope_id

    assert envelope_id and isinstance(envelope_id, str)

    return envelope_id


def create_recipient_view_for_hpa(
    user: JustfixUser,
    envelope_id: str,
    api_client: dse.ApiClient,
    return_url: str,
) -> str:
    envelope_api = dse.EnvelopesApi(api_client)
    recipient_view_request = dse.RecipientViewRequest(
        authentication_method='None',
        client_user_id=docusign_client_user_id(user),
        recipient_id=TENANT_RECIPIENT_ID,
        return_url=return_url,
        user_name=user.full_name,
        email=user.email,
    )

    results = envelope_api.create_recipient_view(
        settings.DOCUSIGN_ACCOUNT_ID,
        envelope_id,
        recipient_view_request=recipient_view_request,
    )

    return results.url


def create_callback_url_for_signing_flow(request, envelope_id: str, next_url: str) -> str:
    return create_callback_url(request, {
        'type': 'ehpa',
        'envelope': envelope_id,
        'next': next_url
    })


def update_envelope_status(de: DocusignEnvelope, event: str) -> None:
    '''
    Update the given DocuSign envelope model based on the given
    event that just occured.
    '''

    # The actual value of 'event' doesn't seem to be documented anywhere on
    # DocuSign's developer docs, except for the SOAP API documentation, which
    # looks semantically equivalent to the REST API but with camel-cased
    # event names instead of snake-cased ones, and with 'On' prepended to the
    # event names:
    #
    #   https://developers.docusign.com/esign-soap-api/reference/administrative-group/embedded-callback-event-codes
    #
    # Through experimentation this seems to be some of the options:
    #
    #   * 'signing_complete' - User completed signing flow successfully.
    #   * 'viewing_complete' - User viewed the forms. This can be the case if
    #     the user previously signed or declined the forms and now wants to
    #     look at them again.
    #   * 'cancel' - User decided to "finish later". We can create a new recipient
    #     view URL for the same envelope ID and they will be taken to the
    #     point at which they left off (e.g. if they signed in only one of 3
    #     places before clicking "finish later", then that will be the state
    #     they return to).
    #   * 'decline' - User chose "decline to sign".
    #   * 'ttl_expired' - Used if the recipient view URL is visited more than
    #     once.  This should only happen rarely, if ever, because DocuSign
    #     immediately redirects from the super-long recipient view URL to
    #     a shorter, reloadable URL immediately.

    if event == 'signing_complete':
        de.status = HP_DOCUSIGN_STATUS_CHOICES.SIGNED
        de.save()
    elif event == 'decline':
        de.status = HP_DOCUSIGN_STATUS_CHOICES.DECLINED
        de.save()


def callback_handler(request):
    event = request.GET.get('event')
    envelope_id = request.GET.get('envelope')
    next_url = request.GET.get('next')
    if event and next_url and envelope_id and request.GET.get('type') == 'ehpa':
        # TODO: Validate next_url?

        de = DocusignEnvelope.objects.filter(id=envelope_id).first()
        if not de:
            return HttpResponseBadRequest("Invalid envelope ID")

        # Note that because the callback ultimately passes through the
        # end-user's system, they technically have the ability to change
        # it, which means that we can't fully trust 'event' here. That
        # should be OK though, since it basically means that they're
        # just altering their experience on our site, *not* altering
        # the actual signing process. DocuSign knows if they have
        # definitively signed the document, and will send out the
        # signed document to relevant stakeholders as needed--the
        # user "hacking" this callback's event property will do nothing
        # to change that.
        update_envelope_status(de, event)

        next_url = append_querystring_args(next_url, {'event': event})
        return HttpResponseRedirect(next_url)
    return None

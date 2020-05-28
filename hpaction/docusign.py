from typing import List, Optional, NamedTuple, Union
from enum import Enum
from io import BytesIO
import xml.etree.ElementTree as ET
import base64
import logging
from django.http import (
    HttpResponse,
    HttpResponseRedirect,
    HttpResponseBadRequest,
    HttpResponseForbidden,
)
from django.conf import settings
import PyPDF2

from project import slack
from users.models import JustfixUser
from docusign.core import docusign_client_user_id
from docusign.views import create_callback_url, append_querystring_args
from onboarding.models import BOROUGH_CHOICES
import docusign_esign as dse
from .models import HPActionDocuments, DocusignEnvelope, HP_DOCUSIGN_STATUS_CHOICES, Config


# The recipient ID for the tenant in the signing flow. This appears to be a
# number local to a specific signing, rather than a globally unique identifier.
TENANT_RECIPIENT_ID = '1'

# The document ID for the HP Action packet in the signing flow. This appears
# to be a number local to a specific signing, rather than a globally unique
# identifier.
HPA_DOCUMENT_ID = '1'

# Number of pages at beginning of EHPA PDFs that represent cover sheet pages
# that aren't part of the official forms
NUM_COVER_SHEET_PAGES = 1


logger = logging.getLogger(__name__)


def get_answers_xml_tf(root: ET.Element, name: str) -> Optional[bool]:
    nodes = root.findall(f".//Answer[@name='{name}']/TFValue")
    if nodes:
        return nodes[0].text == 'true'
    return None


class HPAType(Enum):
    REPAIRS = 1
    HARASSMENT = 2
    BOTH = 3

    @staticmethod
    def get_from_answers_xml(xml_value: Union[str, bytes]) -> 'HPAType':
        # Interestingly, ET is in charge of decoding this if it's bytes:
        # https://stackoverflow.com/a/21698118
        root = ET.fromstring(xml_value)

        harassment = get_answers_xml_tf(root, 'Sue for harassment TF')
        repairs = get_answers_xml_tf(root, 'Sue for repairs TF')

        if harassment and repairs:
            return HPAType.BOTH
        elif harassment:
            return HPAType.HARASSMENT
        elif repairs:
            return HPAType.REPAIRS

        raise ValueError('XML is suing for neither harassment nor repairs!')


class PageCoords(NamedTuple):
    page: int
    x: int
    y: int

    def to_docusign(self):
        return dict(
            page_number=str(self.page),
            x_position=str(self.x),
            y_position=str(self.y),
        )


class FormsConfig(NamedTuple):
    case_type: HPAType
    expected_pages: int
    hpd_inspection_page: Optional[int]
    affadavit_page: int
    sign_here_petition_coords: PageCoords
    sign_here_verification_coords: PageCoords
    contact_info_coords: PageCoords
    date_signed_coords: List[PageCoords]

    def ensure_expected_pages(self, num_pages: int):
        if num_pages != self.expected_pages:
            # Creating a DocuSign envelope costs money, and if our "sign here"
            # tabs aren't in the exact spots we expect them to be in, we're
            # confusing the user and wasting money, so let's raise an error
            # instead of potentially creating a bad envelope.
            raise ValueError(
                f"Expected {self.case_type} PDF to have {self.expected_pages} pages "
                f"but it has {num_pages}"
            )

    def to_docusign_tabs(self, contact_info: str) -> dse.Tabs:
        text_tabs: List[dse.Text] = []
        sign_here_tabs: List[dse.SignHere] = []

        sign_kwargs = dict(
            document_id=HPA_DOCUMENT_ID,
            recipient_id=TENANT_RECIPIENT_ID,
            tab_label='SignHereTab',
        )

        sign_here_tabs.extend([
            dse.SignHere(**sign_kwargs, **self.sign_here_petition_coords.to_docusign()),
            dse.SignHere(**sign_kwargs, **self.sign_here_verification_coords.to_docusign()),
        ])

        if self.hpd_inspection_page:
            sign_here_tabs.append(dse.SignHere(
                document_id=HPA_DOCUMENT_ID,
                page_number=str(self.hpd_inspection_page),
                recipient_id=TENANT_RECIPIENT_ID,
                tab_label='SignHereTab',
                x_position='446',
                y_position='625',
            ))
            text_tabs.extend(create_stacked_lines(
                lines=["These conditions are immediately hazardous to the",
                       "health and safety of my household."],
                start_y=103,
                document_id=HPA_DOCUMENT_ID,
                page_number=str(self.hpd_inspection_page),
                tab_label="ReadOnlyDataField",
                locked="true",
                x_position="16",
            ))

        contact_info_lines = create_stacked_lines(
            lines=contact_info.splitlines(),
            start_y=self.contact_info_coords.y,
            document_id=HPA_DOCUMENT_ID,
            page_number=str(self.contact_info_coords.page),
            tab_label="ReadOnlyDataField",
            locked="true",
            x_position=str(self.contact_info_coords.x),
        )

        sign_here_tabs.append(dse.SignHere(
            **sign_kwargs,
            **PageCoords(page=self.affadavit_page, x=356, y=240).to_docusign(),
        ))
        affadavit_date_coords = PageCoords(page=self.affadavit_page, x=64, y=256)

        return dse.Tabs(
            date_signed_tabs=[
                dse.DateSigned(
                    tab_label="todaysDate",
                    document_id=HPA_DOCUMENT_ID,
                    recipient_id=TENANT_RECIPIENT_ID,
                    x_position=str(coord.x),
                    y_position=str(coord.y),
                    page_number=str(coord.page),
                )
                for coord in [*self.date_signed_coords, affadavit_date_coords]
            ],
            text_tabs=[
                *contact_info_lines,
                *text_tabs,
            ],
            sign_here_tabs=sign_here_tabs,
        )

    @staticmethod
    def from_case_type(case_type: HPAType) -> 'FormsConfig':
        # The "start page" where the official forms start.
        s = NUM_COVER_SHEET_PAGES

        if case_type == HPAType.REPAIRS:
            return FormsConfig(
                case_type=case_type,
                expected_pages=s + 4,
                affadavit_page=s + 4,
                hpd_inspection_page=s + 3,
                sign_here_petition_coords=PageCoords(page=s + 2, x=419, y=556),
                sign_here_verification_coords=PageCoords(page=s + 2, x=419, y=667),
                contact_info_coords=PageCoords(page=s + 2, x=350, y=730),
                date_signed_coords=[
                    PageCoords(page=s + 2, x=100, y=580),
                    PageCoords(page=s + 2, x=220, y=670),
                    PageCoords(page=s + 3, x=100, y=650),
                ],
            )
        elif case_type == HPAType.HARASSMENT:
            return FormsConfig(
                case_type=case_type,
                expected_pages=s + 4,
                affadavit_page=s + 4,
                hpd_inspection_page=None,
                sign_here_petition_coords=PageCoords(page=s + 3, x=419, y=456),
                sign_here_verification_coords=PageCoords(page=s + 3, x=419, y=656),
                contact_info_coords=PageCoords(page=s + 3, x=350, y=730),
                date_signed_coords=[
                    PageCoords(page=s + 3, x=100, y=475),
                    PageCoords(page=s + 3, x=210, y=650),
                ],
            )

        assert case_type == HPAType.BOTH
        return FormsConfig(
            case_type=case_type,
            expected_pages=s + 6,
            affadavit_page=s + 6,
            hpd_inspection_page=s + 5,
            sign_here_petition_coords=PageCoords(page=s + 4, x=419, y=315),
            sign_here_verification_coords=PageCoords(page=s + 4, x=419, y=500),
            contact_info_coords=PageCoords(page=s + 4, x=350, y=730),
            date_signed_coords=[
                PageCoords(page=s + 4, x=100, y=340),
                PageCoords(page=s + 4, x=210, y=500),
                PageCoords(page=s + 5, x=100, y=650),
            ],
        )


class HousingCourt(NamedTuple):
    name: str
    email: str


def get_housing_court_for_borough(borough: str) -> Optional[HousingCourt]:
    config = Config.objects.get()
    hc: Optional[HousingCourt] = None
    email = getattr(config, f'{borough.lower()}_court_email')
    if email:
        hc = HousingCourt(f"{BOROUGH_CHOICES.get_label(borough)} Housing Court", email)
    return hc


def get_housing_court_for_user(user: JustfixUser) -> Optional[HousingCourt]:
    if hasattr(user, 'onboarding_info'):
        return get_housing_court_for_borough(user.onboarding_info.borough)
    return None


def get_contact_info(user: JustfixUser) -> str:
    ll_email = "unknown"
    ll_phone_number = "unknown"

    if hasattr(user, 'landlord_details'):
        ld = user.landlord_details
        ll_email = ld.email or ll_email
        ll_phone_number = ld.formatted_phone_number() or ll_phone_number

    # Note that we used to include the tenant email here, but removed it
    # because the LL could use the email address in e-filing in the other direction
    # and we could see landlords serving now to tee up cases for court reopening.
    return '\n'.join([
        f"landlord phone: {ll_phone_number}",
        f"landlord email: {ll_email}",
        f"tenant phone: {user.formatted_phone_number()}",
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

    xml_bytes = docs.xml_file.open().read()
    case_type = HPAType.get_from_answers_xml(xml_bytes)

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

    cfg = FormsConfig.from_case_type(case_type)
    cfg.ensure_expected_pages(PyPDF2.PdfFileReader(BytesIO(pdf_bytes)).numPages)
    signer.tabs = cfg.to_docusign_tabs(contact_info=get_contact_info(user))

    carbon_copies: List[dse.CarbonCopy] = [
        dse.CarbonCopy(
            email=user.email,
            name=user.full_name,
            recipient_id="2",
            routing_order="2",
        )
    ]

    housing_court = get_housing_court_for_user(user)
    if housing_court:
        carbon_copies.append(dse.CarbonCopy(
            email=housing_court.email,
            name=housing_court.name,
            recipient_id="3",
            routing_order="2",
        ))
    else:
        # This is bad, but we can always manually forward the signed document
        # to the proper court, so just log an error instead of raising
        # an exception.
        logger.error(f"No housing court found for user '{user.username}'!")

    envelope_definition = dse.EnvelopeDefinition(
        email_subject=f"HP Action forms for {user.full_name}",
        documents=[document],
        recipients=dse.Recipients(signers=[signer], carbon_copies=carbon_copies),
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
        user = de.docs.user
        slack.sendmsg_async(
            f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
            f"has signed their Emergency HP Action documents!",
            is_safe=True
        )
        user.trigger_followup_campaign_async("EHP")
        de.save()
    elif event == 'decline':
        de.status = HP_DOCUSIGN_STATUS_CHOICES.DECLINED
        de.save()


def handle_callback_event(request, event: str, next_url: str, envelope_id: str) -> HttpResponse:
    # TODO: Validate next_url? It shouldn't really matter much, since
    # there's no way to forge the request and the user could do it
    # to themselves, but that doesn't matter much. But it might be
    # useful to just in case there's something we're not considering.

    de = DocusignEnvelope.objects.filter(id=envelope_id).first()
    if not de:
        return HttpResponseBadRequest("Invalid envelope ID")

    if not (de.docs.user and de.docs.user == request.user):
        return HttpResponseForbidden("Docs do not belong to user")

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


def callback_handler(request):
    event = request.GET.get('event')
    envelope_id = request.GET.get('envelope')
    next_url = request.GET.get('next')
    if event and next_url and envelope_id and request.GET.get('type') == 'ehpa':
        return handle_callback_event(
            request, event=event, next_url=next_url, envelope_id=envelope_id)
    return None

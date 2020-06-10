from typing import Dict, Any, List, Optional
import datetime
from pathlib import Path, PurePosixPath
from io import BytesIO
from django.http import FileResponse, HttpResponse, HttpRequest, Http404
from django.contrib.auth.decorators import login_required, permission_required
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.safestring import SafeString
from django.views.decorators.clickjacking import xframe_options_sameorigin

from twofactor.decorators import twofactor_required
from users.models import JustfixUser, VIEW_LETTER_REQUEST_PERMISSION
from loc.models import LandlordDetails
from onboarding.models import OnboardingInfo
from issues.models import ISSUE_AREA_CHOICES, ISSUE_CHOICES


MY_DIR = Path(__file__).parent.resolve()

MY_STATIC_DIR = MY_DIR / 'static'

PDF_STYLES_PATH_PARTS = ['loc', 'pdf-styles.css']

PDF_STYLES_CSS = MY_STATIC_DIR.joinpath(*PDF_STYLES_PATH_PARTS)

LOC_FONTS_PATH_PARTS = ['loc', 'loc-fonts.css']

LOC_FONTS_CSS = MY_STATIC_DIR.joinpath(*LOC_FONTS_PATH_PARTS)

LOC_PREVIEW_STYLES_PATH_PARTS = ['loc', 'loc-preview-styles.css']


def can_we_render_pdfs():
    try:
        import weasyprint  # noqa
    except Exception:      # pragma: nocover
        return False
    return True


def render_pdf_bytes(html: str) -> bytes:
    import weasyprint
    from weasyprint.fonts import FontConfiguration

    font_config = FontConfiguration()
    font_css_str = LOC_FONTS_CSS.read_text().replace(
        'url(./', f'url({LOC_FONTS_CSS.parent.as_uri()}/')
    font_css = weasyprint.CSS(string=font_css_str, font_config=font_config)
    return weasyprint.HTML(string=html).write_pdf(
        stylesheets=[font_css],
        font_config=font_config)


def pdf_response(html: str, filename: str = ''):
    return FileResponse(BytesIO(render_pdf_bytes(html)), filename=filename)


def example_doc(request, format):
    return render_document(request, 'loc/example.html', {
        'now': str(datetime.datetime.now())
    }, format)


def get_onboarding_info(user) -> OnboardingInfo:
    if hasattr(user, 'onboarding_info'):
        return user.onboarding_info
    return OnboardingInfo()


def get_landlord_details(user) -> LandlordDetails:
    if hasattr(user, 'landlord_details'):
        return user.landlord_details
    return LandlordDetails()


def get_issues(user):
    issue_areas: Dict[str, List[str]] = {}

    def append_to_area(area, value):
        area = ISSUE_AREA_CHOICES.get_label(area)
        if area not in issue_areas:
            issue_areas[area] = []
        issue_areas[area].append(value)

    for issue in user.issues.all():
        append_to_area(issue.area, ISSUE_CHOICES.get_label(issue.value))

    for issue in user.custom_issues.all():
        append_to_area(issue.area, issue.description)

    return [
        (area, issue_areas[area]) for area in issue_areas
    ]


def parse_comma_separated_ints(val: str) -> List[int]:
    result: List[int] = []
    for item in val.split(','):
        try:
            result.append(int(item))
        except ValueError:
            pass
    return result


@permission_required(VIEW_LETTER_REQUEST_PERMISSION)
@twofactor_required
def envelopes(request):
    user_ids = parse_comma_separated_ints(request.GET.get('user_ids', ''))
    users = [
        user
        for user in JustfixUser.objects.filter(pk__in=user_ids)
        if (user.full_name and
            hasattr(user, 'onboarding_info') and
            hasattr(user, 'landlord_details') and
            user.landlord_details.name and
            user.landlord_details.address_lines_for_mailing)
    ]
    return render_document(request, 'loc/envelopes.html', {
        'users': users
    }, 'pdf')


def get_letter_context(user: JustfixUser) -> Dict[str, Any]:
    return {
        'today': datetime.date.today(),
        'landlord_details': get_landlord_details(user),
        'onboarding_info': get_onboarding_info(user),
        'issues': get_issues(user),
        'has_heat_issues': any(s in str(get_issues(user)).upper() for s in ('HEAT', 'HOT WATER')),
        'access_dates': [date.date for date in user.access_dates.all()],
        'user': user
    }


def render_letter_body(user: JustfixUser) -> str:
    ctx = get_letter_context(user)
    html = render_english_to_string(None, 'loc/letter-content.html', ctx)
    return html


def render_letter_of_complaint(
    request,
    user: JustfixUser,
    format: str,
    force_live_preview: bool = False
):
    if (not force_live_preview and
            hasattr(user, 'letter_request') and
            user.letter_request.html_content):
        html = SafeString(user.letter_request.html_content)
        ctx: Dict[str, Any] = {'prerendered_letter_content': html}
    else:
        ctx = get_letter_context(user)
    return render_document(request, 'loc/letter-of-complaint.html', ctx, format)


@login_required
@xframe_options_sameorigin
def letter_of_complaint_doc(request, format):
    live_preview = request.GET.get('live_preview', '')
    return render_letter_of_complaint(
        request,
        request.user,
        format,
        force_live_preview=live_preview == 'on'
    )


@permission_required(VIEW_LETTER_REQUEST_PERMISSION)
@twofactor_required
@xframe_options_sameorigin
def letter_of_complaint_pdf_for_user(request, user_id: int):
    user = get_object_or_404(JustfixUser, pk=user_id)
    return render_letter_of_complaint(request, user, 'pdf')


def template_name_to_pdf_filename(template_name: str) -> str:
    '''
    Convert the given template name into a suitable filename for
    its PDF rendering:

        >>> template_name_to_pdf_filename('blah/foo-thing.html')
        'foo-thing.pdf'
    '''

    filename = PurePosixPath(template_name)
    return f'{filename.stem}.pdf'


def render_english_to_string(
    request: Optional[HttpRequest],
    template_name: str,
    context: Dict[str, Any]
):
    # For now, we always want to localize the letter of complaint in English.
    # Even if we don't translate the letter itself to other languages, some
    # templating functionality provided by Django (such as date formatting) will
    # take the current locale into account, and we don't want e.g. a letter to
    # have English paragraphs but Spanish dates. So we'll explicitly set
    # the locale here.
    with translation.override('en'):
        return render_to_string(template_name, context=context, request=request)


@login_required
def finished_loc_pdf(request):
    user = request.user
    if not (hasattr(user, 'letter_request') and
            user.letter_request.html_content):
        raise Http404("User does not have a finished letter")
    html = SafeString(user.letter_request.html_content)
    if html.startswith('<!DOCTYPE'):
        # This is the full HTML of the letter, just render it directly.
        raise NotImplementedError()
    ctx: Dict[str, Any] = {'prerendered_letter_content': html}
    return render_document(request, 'loc/letter-of-complaint.html', ctx, "pdf")


def render_pdf_html(
    request: Optional[HttpRequest],
    template_name: str,
    context: Dict[str, Any],
    pdf_styles_path: Path,
) -> str:
    return render_english_to_string(request, template_name, {
        **context,
        'is_pdf': True,
        'pdf_styles_css': SafeString(pdf_styles_path.read_text())
    })


def render_document(
    request: Optional[HttpRequest],
    template_name: str,
    context: Dict[str, Any],
    format: str,
    pdf_styles_path: Path = PDF_STYLES_CSS,
):
    if format not in ['html', 'pdf']:
        raise ValueError(f'unknown format "{format}"')

    if format == 'html':
        html = render_english_to_string(request, template_name, {
            **context,
            'is_pdf': False,
            'stylesheet_path': '/'.join(PDF_STYLES_PATH_PARTS),
            'fonts_stylesheet_path': '/'.join(LOC_FONTS_PATH_PARTS),
            'preview_stylesheet_path': '/'.join(LOC_PREVIEW_STYLES_PATH_PARTS),
        })
        return HttpResponse(html)

    html = render_pdf_html(request, template_name, context, pdf_styles_path)

    return pdf_response(html, template_name_to_pdf_filename(template_name))

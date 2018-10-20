from typing import Dict, Any, List
import datetime
from pathlib import Path, PurePosixPath
from io import BytesIO
from django.http import FileResponse, HttpResponse
from django.contrib.auth.decorators import login_required, permission_required
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404

from users.models import JustfixUser
from loc.models import LandlordDetails
from issues.models import ISSUE_AREA_CHOICES, ISSUE_CHOICES


MY_DIR = Path(__file__).parent.resolve()

MY_STATIC_DIR = MY_DIR / 'static'

PDF_STYLES_PATH_PARTS = ['loc', 'pdf-styles.css']

PDF_STYLES_CSS = MY_STATIC_DIR.joinpath(*PDF_STYLES_PATH_PARTS)


def can_we_render_pdfs():
    try:
        import weasyprint  # noqa
    except Exception:      # pragma: nocover
        return False
    return True


def pdf_response(html: str, filename: str):
    import weasyprint

    pdf_bytes = weasyprint.HTML(string=html).write_pdf()
    return FileResponse(BytesIO(pdf_bytes), filename=filename)


def example_doc(request, format):
    return render_document(request, 'loc/example.html', {
        'now': str(datetime.datetime.now())
    }, format)


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


def render_letter_of_complaint(request, user: JustfixUser, format: str):
    return render_document(request, 'loc/letter-of-complaint.html', {
        'today': datetime.date.today(),
        'landlord_details': get_landlord_details(user),
        'issues': get_issues(user),
        'access_dates': [date.date for date in user.access_dates.all()],
        'user': user
    }, format)


@login_required
def letter_of_complaint_doc(request, format):
    return render_letter_of_complaint(request, request.user, format)


@permission_required('loc.view_letter_request')
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


def render_document(request, template_name: str, context: Dict[str, Any], format: str):
    if format not in ['html', 'pdf']:
        raise ValueError(f'unknown format "{format}"')

    if format == 'html':
        html = render_to_string(template_name, context={
            **context,
            'is_pdf': False,
            'stylesheet_path': '/'.join(PDF_STYLES_PATH_PARTS)
        }, request=request)
        return HttpResponse(html)

    html = render_to_string(template_name, context={
        **context,
        'is_pdf': True,
        'pdf_styles_css': PDF_STYLES_CSS.read_text()
    }, request=request)

    return pdf_response(html, template_name_to_pdf_filename(template_name))

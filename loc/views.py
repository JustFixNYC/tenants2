from typing import Dict, Any
import datetime
from pathlib import Path, PurePosixPath
from io import BytesIO
from django.http import FileResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string


MY_DIR = Path(__file__).parent.resolve()

MY_STATIC_DIR = MY_DIR / 'static' / 'loc'

PDF_STYLES_CSS = MY_STATIC_DIR / 'pdf-styles.css'


def can_we_render_pdfs():
    try:
        import weasyprint  # noqa
    except Exception:
        return False
    return True


def pdf_response(html: str, filename: str):
    import weasyprint

    css = f"<style>{PDF_STYLES_CSS.read_text()}</style>"
    pdf_bytes = weasyprint.HTML(string=css + html).write_pdf()
    return FileResponse(BytesIO(pdf_bytes), filename=filename)


def example_doc(request, format):
    return render_document(request, 'loc/example.html', {
        'now': str(datetime.datetime.now())
    }, format)


@login_required
def letter_of_complaint_doc(request, format):
    return render_document(request, 'loc/letter-of-complaint.html', {
        'user': request.user
    }, format)


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
    html = render_to_string(template_name, context=context, request=request)
    if format == 'html':
        return HttpResponse(html)
    return pdf_response(html, template_name_to_pdf_filename(template_name))

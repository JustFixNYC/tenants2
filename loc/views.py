import datetime
from pathlib import Path
from io import BytesIO
from django.http import FileResponse
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


def example_pdf(request):
    return pdf_response(render_to_string('loc/example.html', {
        'now': str(datetime.datetime.now())
    }), 'example.pdf')


def letter_of_complaint_pdf(request):
    html = render_to_string('loc/letter-of-complaint.html', {
        'user': request.user
    })
    return pdf_response(html, 'letter-of-complaint.pdf')

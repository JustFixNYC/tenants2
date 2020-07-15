from io import BytesIO
import weasyprint
from PyPDF2.pdf import PageObject


CSS = """\
@page {
    size: letter;
    margin-top: 1in;
    margin-bottom: 1in;

    @top-right {
        content: counter(page);
        font-size: 12pt;
    }
}
"""

BASE_HTML = """
<!DOCTYPE html>
<meta charset="utf-8">
<title>Page numbers</title>
"""


def render_pdf(count: int) -> BytesIO:
    css = weasyprint.CSS(string=CSS)
    html_content = "".join([
        BASE_HTML,
        "<div style=\"page-break-after: always;\"></div>" * count
    ])
    html = weasyprint.HTML(string=html_content)
    pdf = BytesIO(html.write_pdf(
        stylesheets=[css]
    ))
    return pdf


def merge_page_with_possible_rotation(page: PageObject, numbers_page: PageObject):
    ur_x = page.artBox.getUpperRight_x()
    ur_y = page.artBox.getUpperRight_y()
    if ur_x > ur_y:
        # This page is oriented in a very odd way
        # and we need to rotate our overlay on top of it.
        # https://stackoverflow.com/a/23633769
        page.mergeRotatedTranslatedPage(
            numbers_page,
            270,
            numbers_page.mediaBox.getWidth() / 2,
            numbers_page.mediaBox.getWidth() / 2
        )
    else:
        page.mergePage(numbers_page)

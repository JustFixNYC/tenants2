from pathlib import Path
from io import BytesIO
from django.core.management import BaseCommand
from django.utils.html import escape
import weasyprint
import PyPDF2


def text(value: str, x: int, y: int) -> str:
    style = "; ".join([
        "position: absolute",
        f"top: {y}pt",
        f"left: {x}pt",
        f"white-space: pre-wrap",
        f"font-size: 10pt",
    ])
    return (f'<div style="{style}">{escape(value)}</div>')


def page(*texts: str):
    lines = "\n".join(texts)
    return f'<div style="page-break-after: always">{lines}</div>'


def make_overlay() -> BytesIO:
    css = weasyprint.CSS(
        string="@page { margin: 0; size: letter; }"
    )
    pages = "\n".join([
        page(
            text("Queens", 110, 50)
        ),
        page(
            text('\n'.join([
                "landlord phone: (555) 123-4567",
                "landlord email: landlordo@calrissian.net",
                "tenant phone: (555) 100-2000",
                "tenant email: boop@jones.net",
            ]), 27, 25),
        ),
        page(
            text("These conditions are immediately hazardous to the\n"
                 "health and safety of my household.", 16, 103),
        ),
    ])
    html = weasyprint.HTML(
        string=f"""<!DOCTYPE html>
        <meta charset="utf-8">
        <title>overlay</title>
        {pages}
        """
    )
    overlay_file = BytesIO(html.write_pdf(
        stylesheets=[css]
    ))
    return overlay_file


class Command(BaseCommand):
    def handle(self, *args, **options) -> None:
        overlay_pdf = PyPDF2.PdfFileReader(make_overlay())

        print("Generated overlay pdf.")

        pdf_writer = PyPDF2.PdfFileWriter()

        blank_path = Path("blank-hp-forms.pdf")
        with blank_path.open('rb') as blank_file:
            blank_pdf = PyPDF2.PdfFileReader(blank_file)
            for i in range(blank_pdf.numPages):
                page = blank_pdf.getPage(i)
                if i < overlay_pdf.numPages:
                    print(f"Overlaying page {i}.")
                    overlay_page = overlay_pdf.getPage(i)
                    if i == 0:
                        # The first page is oriented in a very odd way
                        # and we need to rotate our overlay on top of it.
                        # https://stackoverflow.com/a/23633769
                        page.mergeRotatedTranslatedPage(
                            overlay_page,
                            270,
                            overlay_page.mediaBox.getWidth() / 2,
                            overlay_page.mediaBox.getWidth() / 2
                        )
                    else:
                        page.mergePage(overlay_page)
                else:
                    print(f"Copying page {i}.")
                pdf_writer.addPage(page)

            out_path = Path("overlay-fun.pdf")

            with out_path.open('wb') as out_pdf:
                pdf_writer.write(out_pdf)

            print(f'Wrote {out_path}.')

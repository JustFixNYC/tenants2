from pathlib import Path
from io import BytesIO
from django.core.management import BaseCommand
from django.utils.html import escape
import weasyprint
import PyPDF2


def text(value: str, x: int, y: int):
    return (
        f'<div style="position: absolute; top: {y}px; left: {x}px">'
        f'{escape(value)}'
        f'</div>'
    )


class Command(BaseCommand):
    def handle(self, *args, **options) -> None:
        css = weasyprint.CSS(
            string="@page { margin: 0; size: letter; }"
        )
        html = weasyprint.HTML(
            string=f"""<!DOCTYPE html>
            <meta charset="utf-8">
            <title>overlay</title>
            {text("queens", 140, 65)}
            """
        )
        overlay_file = BytesIO(html.write_pdf(
            stylesheets=[css]
        ))
        overlay_pdf = PyPDF2.PdfFileReader(overlay_file)

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
                    # https://stackoverflow.com/a/23633769
                    page.mergeRotatedTranslatedPage(
                        overlay_page,
                        270,
                        overlay_page.mediaBox.getWidth() / 2,
                        overlay_page.mediaBox.getWidth() / 2
                    )
                else:
                    print(f"Copying page {i}.")
                pdf_writer.addPage(page)

            out_path = Path("overlay-fun.pdf")

            with out_path.open('wb') as out_pdf:
                pdf_writer.write(out_pdf)

            print(f'Wrote {out_path}.')

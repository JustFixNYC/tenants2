from typing import List, NamedTuple, Union
from pathlib import Path
from io import BytesIO
from django.utils.html import escape
import weasyprint
import PyPDF2


DEFAULT_SIZE = 12


def _text(value: str, x: int, y: int, size: int) -> str:
    style = "; ".join(
        [
            "position: absolute",
            f"top: {y}pt",
            f"left: {x}pt",
            f"white-space: pre-wrap",
            f"font-size: {size}pt",
        ]
    )
    return f'<div style="{style}">{escape(value)}</div>'


class Text(NamedTuple):
    value: str
    x: int
    y: int
    size: int = DEFAULT_SIZE

    def __str__(self) -> str:
        return _text(self.value, self.x, self.y, self.size)


class Checkbox(NamedTuple):
    value: bool
    x: int
    y: int
    size: int = DEFAULT_SIZE

    def __str__(self) -> str:
        return _text("X" if self.value else "", self.x, self.y, self.size)


PageItem = Union[Text, Checkbox]


class Page(NamedTuple):
    items: List[PageItem]

    def __str__(self) -> str:
        lines = "\n".join(str(item) for item in self.items)
        return f'<div style="page-break-after: always">{lines}</div>'


class Document(NamedTuple):
    pages: List[Page]

    def __str__(self) -> str:
        pages_html = "\n".join(str(page) for page in self.pages)
        return "\n".join(
            ["<!DOCTYPE html>", '<meta charset="utf-8">', "<title>overlay</title>", pages_html]
        )

    def render_pdf_bytes(self) -> BytesIO:
        css = weasyprint.CSS(string="@page { margin: 0; size: letter; }")
        html = weasyprint.HTML(string=str(self))
        return BytesIO(html.write_pdf(stylesheets=[css]))

    def overlay_atop(self, pdf: Path) -> BytesIO:
        overlay_pdf = PyPDF2.PdfFileReader(self.render_pdf_bytes())
        pdf_writer = PyPDF2.PdfFileWriter()
        with pdf.open("rb") as blank_file:
            blank_pdf = PyPDF2.PdfFileReader(blank_file)
            for i in range(blank_pdf.numPages):
                page = blank_pdf.getPage(i)
                if i < overlay_pdf.numPages:
                    overlay_page = overlay_pdf.getPage(i)
                    page.mergePage(overlay_page)
                pdf_writer.addPage(page)

            outfile = BytesIO()
            pdf_writer.write(outfile)
            return outfile

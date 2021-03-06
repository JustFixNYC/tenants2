from typing import Dict, List, NamedTuple, Optional, Union
from threading import Lock
from pathlib import Path
from io import BytesIO
from PyPDF2.generic import NameObject, NumberObject
from django.utils.html import escape
import weasyprint
import PyPDF2

from . import merge_pdf


DEFAULT_SIZE = 12


def _text(value: Optional[str], x: int, y: int, size: int) -> str:
    if not value:
        return ""
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
    value: Optional[str]
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
        return _text("\u2714" if self.value else None, self.x, self.y, self.size)


PageItem = Union[Text, Checkbox]


class Page(NamedTuple):
    items: List[PageItem]

    def __str__(self) -> str:
        lines = "\n".join(str(item) for item in self.items)
        return f'<div style="page-break-after: always">{lines}</div>'

    def is_blank(self) -> bool:
        return len(self.items) == 0


_lock = Lock()
blank_pdfs: Dict[str, PyPDF2.PdfFileReader] = {}


def get_blank_pdf(path: Path) -> PyPDF2.PdfFileReader:
    p = str(path)
    if p not in blank_pdfs:
        f = path.open("rb")
        blank_pdfs[p] = PyPDF2.PdfFileReader(f)
    return blank_pdfs[p]


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
        # No idea how threadsafe using the same PdfFileReader is, so let's play it
        # safe...
        with _lock:
            overlay_pdf = PyPDF2.PdfFileReader(self.render_pdf_bytes())
            pdf_writer = PyPDF2.PdfFileWriter()
            blank_pdf = get_blank_pdf(pdf)
            for i in range(blank_pdf.numPages):
                if i < overlay_pdf.numPages and not self.pages[i].is_blank():
                    overlay_page = overlay_pdf.getPage(i)
                    page = merge_pdf.merge_page(blank_pdf, i, overlay_page)
                else:
                    page = blank_pdf.getPage(i)
                make_page_fields_readonly(page)
                pdf_writer.addPage(page)

            outfile = BytesIO()
            pdf_writer.write(outfile)
            return outfile


def make_page_fields_readonly(page):
    for j in range(0, len(page["/Annots"])):
        writer_annot = page["/Annots"][j].getObject()
        existing_flags = writer_annot.get("/Ff")
        if isinstance(existing_flags, NumberObject):
            writer_annot.update({NameObject("/Ff"): NumberObject(existing_flags | 1)})

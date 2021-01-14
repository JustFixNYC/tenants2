from typing import List, NamedTuple
from io import BytesIO
from django.utils.html import escape
import weasyprint


class Text(NamedTuple):
    value: str
    x: int
    y: int
    size: int = 10

    def __str__(self) -> str:
        style = "; ".join(
            [
                "position: absolute",
                f"top: {self.y}pt",
                f"left: {self.x}pt",
                f"white-space: pre-wrap",
                f"font-size: {self.size}pt",
            ]
        )
        return f'<div style="{style}">{escape(self.value)}</div>'


class Page(NamedTuple):
    items: List[Text]

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

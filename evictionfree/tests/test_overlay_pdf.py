from evictionfree.overlay_pdf import Text, Page, Document


DOC = Document(
    pages=[
        Page(
            items=[
                Text("boop<", 5, 10),
            ]
        )
    ]
)


def test_it_renders_html():
    html = str(DOC)
    assert "top: 10pt" in html
    assert "left: 5pt" in html
    assert "boop&lt;" in html
    assert "<!DOCTYPE html" in html


def test_it_renders_pdf():
    result = DOC.render_pdf_bytes()
    b = result.getvalue()
    assert isinstance(b, bytes)
    assert len(b) > 0


def test_empty_html_is_empty_str():
    assert str(Text("", 5, 10)) == ""

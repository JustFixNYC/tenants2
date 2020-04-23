from project.util.html_to_text import html_to_text


def test_it_ignores_title_tags():
    assert html_to_text('<title>boop</title>') == ''


def test_it_works():
    assert html_to_text('<p>paragraph one</p><p>paragraph two</p>') == (
        'paragraph one\n\n'
        'paragraph two'
    )

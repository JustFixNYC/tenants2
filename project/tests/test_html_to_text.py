from project.util.html_to_text import html_to_text


def test_it_ignores_title_tags():
    assert html_to_text('<title>boop</title>') == ''


def test_it_works():
    assert html_to_text('<p>paragraph one</p><p>paragraph two</p>') == (
        'paragraph one\n\n'
        'paragraph two'
    )


def test_it_ignores_class_name():
    assert html_to_text('<p class="blah">a</p>') == 'a'


def test_it_supports_br():
    assert html_to_text('<p>paragraph<br/>one</p>') == (
        'paragraph\none'
    )

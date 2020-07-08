import pytest

from project.util.html_to_text import html_to_text


def test_it_ignores_title_tags():
    assert html_to_text('<title>boop</title>') == ''


def test_it_ignores_style_tags():
    assert html_to_text('<style>html { color: pink; }</style>') == ''


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


def test_it_ignores_empty_blocks():
    assert html_to_text('<p>bop</p><p></p><p>bop</p>') == (
        'bop\n\nbop'
    )


def test_it_adds_anchor_hrefs():
    assert html_to_text('<p><a href="https://boop">visit it</a></p>') == (
        'visit it: https://boop'
    )


@pytest.mark.parametrize('href,text', [
    ['mailto:a@b.com', 'a@b.com'],
    ['tel:+15551234567', '(555) 123-4567'],
])
def test_it_ignores_useless_hrefs(href, text):
    assert html_to_text(f'<p><a href="{href}">{text}</a></p>') == text


def test_it_ignores_anchors_without_hrefs():
    assert html_to_text('<p><a>visit it</a></p>') == (
        'visit it'
    )


def test_it_supports_unordered_lists():
    assert html_to_text('<ul><li>boop</li><li>bap</li></ul>') == (
        '* boop\n\n'
        '* bap'
    )


def test_it_supports_lists_with_blocks():
    assert html_to_text('<ul><li><p>boop</p><p>hi</p></li><li>bap</li></ul>') == (
        '* boop\n\n'
        'hi\n\n'
        '* bap'
    )


def test_it_supports_nested_unordered_lists():
    assert html_to_text(
        '<ul>'
        '<li>boop<ul><li>oof</li></ul></li>'
        '<li>bap</li>'
        '</ul>'
    ) == (
        '* boop\n\n'
        '- oof\n\n'
        '* bap'
    )


def test_it_supports_ordered_lists():
    assert html_to_text('<ol><li>boop</li><li>bap</li></ol>') == (
        '1. boop\n\n'
        '2. bap'
    )


def test_it_supports_nested_ordered_lists():
    assert html_to_text(
        '<ol>'
        '<li>boop<ol type="a"><li>hi</li><li>bye</li></ol></li>'
        '<li>bap</li>'
        '</ol>'
    ) == (
        '1. boop\n\n'
        'a. hi\n\n'
        'b. bye\n\n'
        '2. bap'
    )


def test_it_supports_nested_mixed_lists():
    assert html_to_text(
        '<ol>'
        '<li>boop<ul><li>oof</li></ul></li>'
        '<li>bap</li>'
        '</ol>'
    ) == (
        '1. boop\n\n'
        '* oof\n\n'
        '2. bap'
    )


def test_it_does_not_currently_support_roman_numerals():
    with pytest.raises(NotImplementedError, match="Roman numerals in <ol> are unsupported"):
        html_to_text('<ol type="i"></ol>')


def test_it_raises_value_error_on_unsupported_type():
    with pytest.raises(ValueError, match="Unknown <ol> type \"z\""):
        html_to_text('<ol type="z"></ol>')


def test_it_replaces_non_decorative_images_with_urls():
    assert html_to_text('<img src="blah.jpg" alt="Blah" />') == 'blah.jpg'


def test_it_ignores_decorative_images():
    assert html_to_text('<img src="blah.jpg" alt="" />') == ''


@pytest.mark.parametrize('html,text', [
    ['<h1>Hi</h1>', 'Hi\n**'],
    ['<h2>Hi</h2>', 'Hi\n=='],
    ['<h3>Hi</h3>', 'Hi\n--'],
    ['<h4>Hi</h4>', 'Hi\n..'],
])
def test_it_embellishes_headings(html, text):
    assert html_to_text(html) == text

from project.util.hyperlink import Hyperlink


def test_admin_button_url_works():
    h = Hyperlink("boop", "http://blarg")
    assert h.admin_button_html == (
        '<a href="http://blarg" class="button" target="blank" rel="nofollow noopener">boop</a>'
    )


def test_join_admin_buttons_returns_nothing_on_empty_list():
    assert Hyperlink.join_admin_buttons([]) == ""


def test_join_admin_buttons_works():
    html = Hyperlink.join_admin_buttons(
        [
            Hyperlink("bop", "https://thing"),
            Hyperlink("glop<", "https://blarg"),
        ]
    )
    assert ">bop<" in html
    assert ">glop&lt;<" in html

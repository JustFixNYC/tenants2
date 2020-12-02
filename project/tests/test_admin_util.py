import pytest
from django.contrib.sites.models import Site

from project.util.testing_util import Blob
from project.util.admin_util import admin_field, make_edit_link, get_admin_url_for_class


@pytest.mark.parametrize(
    "param,value",
    [
        ("short_description", "blargy"),
        ("allow_tags", True),
        ("admin_order_field", "_thing"),
    ],
)
def test_params_are_set_on_func(param, value):
    thing = admin_field(**{param: value})(lambda: None)
    assert getattr(thing, param) == value


class TestMakeEditLink:
    def test_it_returns_empty_string_when_given_none(self):
        edit_link = make_edit_link("edit")
        assert edit_link(None, None) == ""

    def test_it_returns_empty_string_when_given_obj_without_pk(self):
        site = Site()
        edit_link = make_edit_link("edit")
        assert edit_link(None, site) == ""

    def test_it_returns_edit_link_for_obj(self):
        site = Site(pk=1)
        edit_link = make_edit_link("edit")
        assert (
            edit_link(None, site) == '<a class="button" href="/admin/sites/site/1/change/">edit</a>'
        )

    def test_it_returns_edit_link_for_field(self):
        obj = Blob(related_thing=Blob(admin_url="/blah", pk=1))
        edit_link = make_edit_link("edit", field="related_thing")
        assert edit_link(None, obj) == '<a class="button" href="/blah">edit</a>'


def test_get_admin_url_for_class_works():
    assert get_admin_url_for_class(Site, 1) == "/admin/sites/site/1/change/"

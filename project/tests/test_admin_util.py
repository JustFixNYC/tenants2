import pytest

from project.util.admin_util import admin_field


@pytest.mark.parametrize("param,value", [
    ("short_description", "blargy"),
    ("allow_tags", True),
    ("admin_order_field", "_thing"),
])
def test_params_are_set_on_func(param, value):
    thing = admin_field(**{param: value})(lambda: None)
    assert getattr(thing, param) == value

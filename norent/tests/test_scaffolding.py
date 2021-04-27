import pytest

from norent.scaffolding import NorentScaffolding


@pytest.mark.parametrize(
    "scaffolding,expected",
    [
        (NorentScaffolding(), None),
        (NorentScaffolding(city="brooklyn", state="NY"), True),
        (NorentScaffolding(city="brooklyn heights", state="NY"), False),
        (NorentScaffolding(city="New York/ Brooklyn", state="NY"), True),
        (NorentScaffolding(city="Jackson Heights/New York/Queens", state="NY"), True),
        (NorentScaffolding(city="College Point/Queens", state="NY"), True),
        (NorentScaffolding(city="Jackson Heights/New York/QUEENS", state="NY"), True),
        (NorentScaffolding(city="New York City/Manhattan", state="NY"), True),
        (NorentScaffolding(city="New York City / Manhattan", state="NY"), True),
        (NorentScaffolding(city="South ozone park./Queens", state="NY"), True),
        (NorentScaffolding(city="blarg / flarg", state="NY"), False),
        (NorentScaffolding(city="brooklyn heights", state="NY", lnglat=(-73.9943, 40.6977)), True),
        (NorentScaffolding(city="Albany", state="NY", lnglat=(-73.755, 42.6512)), False),
        (NorentScaffolding(city="Yonkers", state="NY", lnglat=(-73.8987, 40.9312)), False),
    ],
)
def test_is_city_in_nyc_works(scaffolding, expected):
    assert scaffolding.is_city_in_nyc() is expected

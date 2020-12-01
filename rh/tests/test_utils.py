from rh.schema import get_rent_stab_info_from_bbl

# 654 Park Place, had rent stab units in 2019
EXAMPLE_RENT_STAB_BBL = '3012380016'

# 69 Montrose Avenue, had rent stab units in 2008 but not after
EXAMPLE_OLD_RENT_STAB_BBL = '3030500031'

# 75 Horatio St, no record in rent stab data
EXAMPLE_NON_RENT_STAB_BBL = '1006437501'

# 93 Knickerbocker Ave, has record in rent stab data
# but lists 0 units each year
EXAMPLE_ZERO_RENT_STAB_BBL = '3030090004'


def test_get_rent_stab_info_from_bbl_works():
    assert get_rent_stab_info_from_bbl(EXAMPLE_RENT_STAB_BBL) == {
        "latest_year": 2019,
        "latest_unit_count": 12
    }
    assert get_rent_stab_info_from_bbl(EXAMPLE_OLD_RENT_STAB_BBL) == {
        "latest_year": 2008,
        "latest_unit_count": 6
    }
    assert get_rent_stab_info_from_bbl(EXAMPLE_NON_RENT_STAB_BBL) is None
    assert get_rent_stab_info_from_bbl(EXAMPLE_ZERO_RENT_STAB_BBL) is None

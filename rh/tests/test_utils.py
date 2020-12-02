from rh.schema import process_rent_stab_data

# Data for 654 Park Place, had rent stab units in 2019
EXAMPLE_RENT_STAB_DATA = {
    "uc2007": 11,
    "uc2008": 11,
    "uc2009": 11,
    "uc2010": 11,
    "uc2011": 11,
    "uc2012": 12,
    "uc2013": 12,
    "uc2014": 12,
    "uc2015": 12,
    "uc2016": 12,
    "uc2017": 12,
    "uc2018": 12,
    "uc2019": 12,
}

# Data for 69 Montrose Avenue, had rent stab units in 2008 but not after
EXAMPLE_OLD_RENT_STAB_DATA = {
    "uc2007": 6,
    "uc2008": 6,
    "uc2009": None,
    "uc2010": None,
    "uc2011": None,
    "uc2012": None,
    "uc2013": None,
    "uc2014": None,
    "uc2015": None,
    "uc2016": None,
    "uc2017": None,
    "uc2018": None,
    "uc2019": None,
}

# Data for 93 Knickerbocker Ave, has record in rent stab data but lists 0 units each year
EXAMPLE_ZERO_RENT_STAB_DATA = {
    "uc2007": None,
    "uc2008": None,
    "uc2009": None,
    "uc2010": None,
    "uc2011": None,
    "uc2012": None,
    "uc2013": None,
    "uc2014": None,
    "uc2015": None,
    "uc2016": None,
    "uc2017": None,
    "uc2018": None,
    "uc2019": None,
}


def test_process_rent_stab_data_works_when_data_is_given():
    assert process_rent_stab_data(EXAMPLE_RENT_STAB_DATA) == {
        "latest_year": "2019",
        "latest_unit_count": 12,
    }
    assert process_rent_stab_data(EXAMPLE_OLD_RENT_STAB_DATA) == {
        "latest_year": "2008",
        "latest_unit_count": 6,
    }
    assert process_rent_stab_data(EXAMPLE_ZERO_RENT_STAB_DATA) is None


def test_process_rent_stab_data_works_when_no_data_is_given():
    assert process_rent_stab_data(None) is None

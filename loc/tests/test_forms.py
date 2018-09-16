from datetime import date

from loc.forms import AccessDatesForm


def test_form_raises_error_if_dates_are_same():
    form = AccessDatesForm(data={
        'date1': '2018-01-01',
        'date2': '2018-01-01'
    })
    form.full_clean()
    assert form.errors == {
        '__all__': ['Please ensure all the dates are different.']
    }


def test_get_cleaned_dates_works():
    form = AccessDatesForm(data={
        'date1': '2018-01-01',
        'date2': '2019-02-02'
    })
    form.full_clean()
    assert form.errors == {}
    assert form.get_cleaned_dates() == [date(2018, 1, 1), date(2019, 2, 2)]

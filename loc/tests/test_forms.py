from datetime import date, timedelta
from freezegun import freeze_time

from loc.forms import AccessDatesForm, LetterRequestForm
from loc.models import LetterRequest, LOC_CHANGE_LEEWAY
from .factories import create_user_with_all_info


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


def test_letter_request_works(db):
    with freeze_time('2018-01-02') as time:
        user = create_user_with_all_info()
        data = {'mail_choice': 'WE_WILL_MAIL'}
        lr = LetterRequest(user=user)
        form = LetterRequestForm(data=data, instance=lr)
        form.full_clean()
        assert form.is_valid() is True
        form.save()

        assert 'NYC Admin Code' in lr.html_content
        assert 'using git revision' in lr.html_content

        time.tick(delta=timedelta(seconds=1) + LOC_CHANGE_LEEWAY)

        form = LetterRequestForm(data=data, instance=lr)
        form.full_clean()
        assert form.is_valid() is False
        assert 'Your letter is already being mailed!' in form.errors['__all__']

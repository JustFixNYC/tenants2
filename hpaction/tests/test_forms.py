from typing import List
import pytest

from ..forms import PreviousAttemptsForm


class TestPreviousAttemptsForm:
    @pytest.mark.parametrize('data,expected_required_fields', [
        ({}, ['filed_with_311']),
        (dict(filed_with_311='False'), []),
        (dict(filed_with_311='True'), ['hpd_issued_violations']),
        (dict(filed_with_311='True', hpd_issued_violations='False'), ['thirty_days_since_311']),
        (dict(filed_with_311='True', hpd_issued_violations='False', thirty_days_since_311='True'),
         []),
        (dict(filed_with_311='True', hpd_issued_violations='True'),
         ['thirty_days_since_violations']),
        (dict(filed_with_311='True', hpd_issued_violations='True',
              thirty_days_since_violations='True'), []),
    ])
    def test_required_fields_work(self, data, expected_required_fields):
        f = PreviousAttemptsForm(data=data)
        f.is_valid()
        required_fields: List[str] = []
        for field, errors in f.errors.as_data().items():
            required_errors = [e for e in errors if e.code == 'required']
            if required_errors:
                required_fields.append(field)
        assert set(required_fields) == set(expected_required_fields)

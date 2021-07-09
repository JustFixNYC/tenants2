import pytest
from django import forms

from onboarding.scaffolding import OnboardingScaffolding, ScaffoldingFormConverter


@pytest.mark.parametrize(
    "scaffolding,expected",
    [
        (OnboardingScaffolding(), None),
        (OnboardingScaffolding(city="brooklyn", state="NY"), True),
        (OnboardingScaffolding(city="brooklyn heights", state="NY"), False),
        (OnboardingScaffolding(city="New York/ Brooklyn", state="NY"), True),
        (OnboardingScaffolding(city="Jackson Heights/New York/Queens", state="NY"), True),
        (OnboardingScaffolding(city="College Point/Queens", state="NY"), True),
        (OnboardingScaffolding(city="Jackson Heights/New York/QUEENS", state="NY"), True),
        (OnboardingScaffolding(city="New York City/Manhattan", state="NY"), True),
        (OnboardingScaffolding(city="New York City / Manhattan", state="NY"), True),
        (OnboardingScaffolding(city="South ozone park./Queens", state="NY"), True),
        (OnboardingScaffolding(city="blarg / flarg", state="NY"), False),
        (
            OnboardingScaffolding(city="brooklyn heights", state="NY", lnglat=(-73.9943, 40.6977)),
            True,
        ),
        (OnboardingScaffolding(city="Albany", state="NY", lnglat=(-73.755, 42.6512)), False),
        (OnboardingScaffolding(city="Yonkers", state="NY", lnglat=(-73.8987, 40.9312)), False),
    ],
)
def test_is_city_in_nyc_works(scaffolding, expected):
    assert scaffolding.is_city_in_nyc() is expected


class TestScaffoldingFormConverter:
    class MyForm(forms.Form):
        first_name = forms.CharField()
        surname = forms.CharField()

    myform_conv = ScaffoldingFormConverter(MyForm, {"surname": "last_name"})

    def test_it_raises_error_on_unknown_scaffolding_keys(self):
        class MyForm(forms.Form):
            blarg = forms.BooleanField()

        with pytest.raises(ValueError, match="Unknown scaffolding keys: blarg"):
            ScaffoldingFormConverter(MyForm)

    def test_update_scaffolding_from_form_works(self):
        scf = OnboardingScaffolding()
        self.myform_conv.update_scaffolding_from_form(
            scf, self.MyForm(data={"first_name": "boop", "surname": "jones"})
        )
        assert scf.first_name == "boop"
        assert scf.last_name == "jones"

    def test_to_form_works(self):
        scf = OnboardingScaffolding(first_name="boop", last_name="jones")
        form = self.myform_conv.to_form(scf)
        assert form.is_valid()
        assert form.cleaned_data == {"first_name": "boop", "surname": "jones"}

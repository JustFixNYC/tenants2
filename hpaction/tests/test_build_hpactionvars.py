from decimal import Decimal
import pytest

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LandlordDetailsFactory
from issues.models import Issue, CustomIssue, ISSUE_AREA_CHOICES, ISSUE_CHOICES
from hpaction.models import FeeWaiverDetails
from hpaction.build_hpactionvars import (
    user_to_hpactionvars, justfix_issue_area_to_hp_room, fill_fee_waiver_details,
    fill_nycha_info, fill_tenant_children, get_tenant_repairs_allegations_mc,
    fill_hp_action_details, fill_harassment_details)
from .factories import TenantChildFactory, HPActionDetailsFactory, HarassmentDetailsFactory
import hpaction.hpactionvars as hp


def test_justfix_issue_to_hp_room_works():
    assert justfix_issue_area_to_hp_room('HOME') is hp.WhichRoomMC.ALL_ROOMS
    assert justfix_issue_area_to_hp_room('BEDROOMS').value == "Bedrooms"


def test_user_to_hpactionvars_populates_basic_info(db):
    user = UserFactory(full_name="Boop Jones")
    v = user_to_hpactionvars(user)
    assert v.tenant_name_first_te == "Boop"
    assert v.tenant_name_last_te == "Jones"
    v.to_answer_set()


def test_user_to_hpactionvars_populates_onboarding_info(db):
    oi = OnboardingInfoFactory.create(apt_number='2B', borough='BROOKLYN')
    v = user_to_hpactionvars(oi.user)
    assert v.tenant_address_apt_no_te == '2B'
    assert v.court_county_mc == hp.CourtCountyMC.KINGS
    assert v.court_location_mc == hp.CourtLocationMC.KINGS_COUNTY
    v.to_answer_set()


def test_user_to_hpactionvars_populates_issues(db):
    user = UserFactory()
    Issue.objects.set_area_issues_for_user(
        user,
        ISSUE_AREA_CHOICES.KITCHEN,
        [ISSUE_CHOICES.KITCHEN__MOLD]
    )
    CustomIssue.objects.set_for_user(
        user,
        ISSUE_AREA_CHOICES.PUBLIC_AREAS,
        'Lobby is consumed by darkness'
    )
    v = user_to_hpactionvars(user)
    assert len(v.tenant_complaints_list) == 2
    first, second = v.tenant_complaints_list

    assert first.area_complained_of_mc == hp.AreaComplainedOfMC.MY_APARTMENT
    assert first.which_room_mc.value == "Kitchen"  # type: ignore
    assert first.conditions_complained_of_te == "Mold on walls"

    assert second.area_complained_of_mc == hp.AreaComplainedOfMC.PUBLIC_AREA
    assert second.which_room_mc.value == "Public areas"  # type: ignore
    assert second.conditions_complained_of_te == "Lobby is consumed by darkness"
    v.to_answer_set()


def test_user_to_hpactionvars_populates_basic_landlord_info(db):
    ld = LandlordDetailsFactory(name="Landlordo Calrissian")
    v = user_to_hpactionvars(ld.user)
    assert v.landlord_entity_name_te == "Landlordo Calrissian"
    v.to_answer_set()


def test_user_to_hpactionvars_populates_med_ll_info_from_nycdb(db, nycdb):
    med = nycdb.load_hpd_registration('medium-landlord.json')
    oinfo = OnboardingInfoFactory(pad_bbl=med.pad_bbl)
    v = user_to_hpactionvars(oinfo.user)
    assert v.landlord_entity_name_te == "LANDLORDO CALRISSIAN"
    assert v.landlord_entity_or_individual_mc == hp.LandlordEntityOrIndividualMC.COMPANY
    assert v.landlord_address_street_te == "9 BEAN CENTER DRIVE #40"
    llstate = v.landlord_address_state_mc
    assert llstate and llstate.value == "NJ"
    assert v.management_company_name_te == "FUNKY APARTMENT MANAGEMENT"
    assert v.management_company_address_street_te == "900 EAST 25TH STREET #2"
    v.to_answer_set()


def test_fill_nycha_info_works(db, loaded_nycha_csv_data):
    oinfo = OnboardingInfoFactory(pad_bbl='')
    v = hp.HPActionVariables()
    fill_nycha_info(v, oinfo.user)
    assert v.user_is_nycha_tf is None

    oinfo.pad_bbl = '1234567890'
    fill_nycha_info(v, oinfo.user)
    assert v.user_is_nycha_tf is False

    oinfo.pad_bbl = '2022150116'
    fill_nycha_info(v, oinfo.user)
    assert v.user_is_nycha_tf is True


def test_user_to_hpactionvars_populates_tiny_ll_info_from_nycdb(db, nycdb):
    med = nycdb.load_hpd_registration('tiny-landlord.json')
    oinfo = OnboardingInfoFactory(pad_bbl=med.pad_bbl)
    v = user_to_hpactionvars(oinfo.user)
    assert v.landlord_entity_name_te == "BOOP JONES"
    assert v.landlord_entity_or_individual_mc == hp.LandlordEntityOrIndividualMC.INDIVIDUAL
    v.to_answer_set()


def test_fill_fee_waiver_details_works():
    v = hp.HPActionVariables()
    fwd = FeeWaiverDetails(
        receives_public_assistance=True,
        rent_amount=Decimal('5.00'),
        income_amount_monthly=Decimal('11.50'),
        income_src_employment=True,
        income_src_hra=True,
        expense_utilities=Decimal('1.50'),
        expense_cable=Decimal('2.50'),
        expense_phone=Decimal('0.25'),
        asked_before=False,
    )
    fill_fee_waiver_details(v, fwd)

    assert v.tenant_receives_public_assistance_tf is True
    assert v.tenant_income_nu == 11.50
    assert v.tenant_income_source_te == 'Employment, HRA'
    assert v.tenant_monthly_rent_nu == 5
    assert v.tenant_monthly_exp_utilities_nu == 1.50
    assert v.tenant_monthly_exp_other_nu == 2.75
    assert v.previous_application_tf is False
    assert v.reason_for_further_application_te is None

    fwd.asked_before = True
    v = hp.HPActionVariables()
    fill_fee_waiver_details(v, fwd)

    assert v.previous_application_tf is True
    assert v.reason_for_further_application_te == "economic hardship"


def test_fill_tenant_children_works_when_there_are_no_children():
    v = hp.HPActionVariables()
    fill_tenant_children(v, [])

    assert v.tenant_children_under_6_nu == 0
    assert v.tenant_child_list == []


def test_fill_tenant_children_works_when_there_are_children():
    v = hp.HPActionVariables()
    child = TenantChildFactory.build()

    fill_tenant_children(v, [child])

    assert v.tenant_children_under_6_nu == 1
    assert len(v.tenant_child_list) == 1
    hp_child = v.tenant_child_list[0]
    assert hp_child.tenant_child_name_te == child.name
    assert hp_child.tenant_child_dob == child.dob


COMPLAINED_30_DAYS_AGO = dict(filed_with_311=True, thirty_days_since_311=True)


@pytest.mark.parametrize('hp_action_details_kwargs,expected', [
    (dict(), None),
    (dict(filed_with_311=True), None),
    (dict(filed_with_311=True, thirty_days_since_311=True, hpd_issued_violations=False),
     hp.TenantRepairsAllegationsMC.NO_NOTICE_ISSUED),
    (dict(filed_with_311=True, thirty_days_since_311=False, hpd_issued_violations=False),
     None),
    (dict(filed_with_311=True, hpd_issued_violations=True, thirty_days_since_violations=True),
     hp.TenantRepairsAllegationsMC.NOTICE_ISSUED),
    (dict(filed_with_311=True, hpd_issued_violations=True, thirty_days_since_violations=False),
     None),
])
def test_get_tenant_repairs_allegations_mc_works(hp_action_details_kwargs, expected):
    h = HPActionDetailsFactory.build(**hp_action_details_kwargs)
    assert get_tenant_repairs_allegations_mc(h) == expected


def test_problem_is_urgent_tf_works():
    h = HPActionDetailsFactory.build(urgent_and_dangerous=True)
    v = hp.HPActionVariables()
    fill_hp_action_details(v, h)
    assert v.problem_is_urgent_tf is True

    h.urgent_and_dangerous = False
    fill_hp_action_details(v, h)
    assert v.problem_is_urgent_tf is False


def test_sue_for_harassment_works():
    h = HPActionDetailsFactory.build(sue_for_harassment=True)
    v = hp.HPActionVariables()
    fill_hp_action_details(v, h)
    assert v.sue_for_harassment_tf is True
    assert v.action_type_ms == [hp.ActionTypeMS.HARASSMENT]

    h.sue_for_harassment = None
    v = hp.HPActionVariables()
    fill_hp_action_details(v, h)
    assert v.problem_is_urgent_tf is None
    assert v.action_type_ms is None


def test_fill_harassment_details_works():
    h = HarassmentDetailsFactory.build(
        more_than_two_apartments_in_building=True,
        more_than_one_family_per_apartment=False,
        harassment_details="Blarg"
    )
    v = hp.HPActionVariables()
    fill_harassment_details(v, h)
    assert v.more_than_2_apartments_in_building_tf is True
    assert v.more_than_one_family_per_apartment_tf is False
    assert v.harassment_details_te == 'Blarg'
    assert v.prior_harassment_case_mc == hp.PriorHarassmentCaseMC.NO
    assert v.prior_relief_sought_case_numbers_and_dates_te is None

    h.prior_relief_sought_case_numbers_and_dates = "123412"
    fill_harassment_details(v, h)
    assert v.prior_harassment_case_mc == hp.PriorHarassmentCaseMC.YES
    assert v.prior_relief_sought_case_numbers_and_dates_te == "123412"


def test_user_to_hpactionvars_populates_harassment_only_if_user_wants_it(db):
    har = HarassmentDetailsFactory(more_than_two_apartments_in_building=True)
    v = user_to_hpactionvars(har.user)
    assert v.sue_for_harassment_tf is False
    assert v.more_than_2_apartments_in_building_tf is None

    HPActionDetailsFactory(sue_for_harassment=True, user=har.user)
    v = user_to_hpactionvars(har.user)
    assert v.sue_for_harassment_tf is True
    assert v.more_than_2_apartments_in_building_tf is True

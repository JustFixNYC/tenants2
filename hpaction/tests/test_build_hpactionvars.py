from decimal import Decimal
import pytest

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LandlordDetailsV2Factory
from issues.models import Issue, CustomIssue, ISSUE_AREA_CHOICES, ISSUE_CHOICES
from hpaction.models import FeeWaiverDetails, HP_ACTION_CHOICES
from hpaction.build_hpactionvars import (
    user_to_hpactionvars, justfix_issue_area_to_hp_room, fill_fee_waiver_details,
    fill_tenant_children, get_tenant_repairs_allegations_mc,
    fill_hp_action_details, fill_harassment_details, get_hpactionvars_attr_for_harassment_alleg,
    fill_prior_cases, fill_prior_repairs_and_harassment_mcs,
    fill_landlord_info, reduce_number_of_lines)
from .factories import (
    TenantChildFactory, HPActionDetailsFactory, HarassmentDetailsFactory, PriorCaseFactory)
import hpaction.hpactionvars as hp


NORMAL = HP_ACTION_CHOICES.NORMAL
EMERGENCY = HP_ACTION_CHOICES.EMERGENCY


class TestReduceNumberOfLines:
    def test_it_does_nothing_if_lines_are_not_greater_than_limit(self):
        assert reduce_number_of_lines('a\nb\nc', 3, 10) == 'a\nb\nc'

    def test_it_removes_lines_if_lines_are_greater_than_limit(self):
        assert reduce_number_of_lines('a\n\nb\n\nc', 3, 10) == 'a / b / c'


def test_justfix_issue_to_hp_room_works():
    assert justfix_issue_area_to_hp_room('HOME') is hp.WhichRoomMC.ALL_ROOMS
    assert justfix_issue_area_to_hp_room('BEDROOMS').value == "Bedrooms"


def test_user_to_hpactionvars_requests_fee_waiver_only_if_model_exists(db):
    user = UserFactory(full_name="Boop Jones")
    v = user_to_hpactionvars(user, NORMAL)
    assert v.request_fee_waiver_tf is None

    FeeWaiverDetails(user=user)
    v = user_to_hpactionvars(user, NORMAL)
    assert v.request_fee_waiver_tf is True

    # If it's an emergency HPA, though, never include it.
    v = user_to_hpactionvars(user, EMERGENCY)
    assert v.request_fee_waiver_tf is None


def test_user_to_hpactionvars_sues_only_if_user_wants_to(db):
    user = UserFactory(full_name="Boop Jones")
    v = user_to_hpactionvars(user, NORMAL)
    assert v.sue_for_harassment_tf is None
    assert v.sue_for_repairs_tf is None

    hpd = HPActionDetailsFactory(
        user=user, sue_for_harassment=True, sue_for_repairs=False)
    v = user_to_hpactionvars(user, NORMAL)
    assert v.sue_for_harassment_tf is True
    assert v.sue_for_repairs_tf is False

    hpd.sue_for_repairs = True
    hpd.save()
    v = user_to_hpactionvars(user, NORMAL)
    assert v.sue_for_repairs_tf is True


def test_user_to_hpactionvars_populates_basic_info(db):
    user = UserFactory(full_name="Boop Jones")
    v = user_to_hpactionvars(user, NORMAL)
    assert v.tenant_name_first_te == "Boop"
    assert v.tenant_name_last_te == "Jones"
    v.to_answer_set()


def test_user_to_hpactionvars_populates_onboarding_info(db):
    oi = OnboardingInfoFactory.create(apt_number='2B', borough='BROOKLYN', floor_number=5)
    v = user_to_hpactionvars(oi.user, NORMAL)
    assert v.tenant_address_apt_no_te == '2B'
    assert v.court_county_mc == hp.CourtCountyMC.KINGS
    assert v.court_location_mc == hp.CourtLocationMC.KINGS_COUNTY
    assert v.tenant_address_floor_nu == 5
    v.to_answer_set()


def test_emergency_hpa_filters_out_non_emergency_issues(db):
    user = UserFactory()
    Issue.objects.set_area_issues_for_user(
        user,
        ISSUE_AREA_CHOICES.HOME,
        [ISSUE_CHOICES.HOME__NO_HEAT, ISSUE_CHOICES.HOME__MICE]
    )
    user.custom_issues.add(CustomIssue(
        area=ISSUE_AREA_CHOICES.HOME,
        description='SUPERMOLD'
    ), CustomIssue(
        area=ISSUE_AREA_CHOICES.PUBLIC_AREAS,
        description='Lobby is consumed by darkness'
    ), bulk=False)
    v = user_to_hpactionvars(user, EMERGENCY)
    assert len(v.tenant_complaints_list) == 2
    first, second = v.tenant_complaints_list

    assert first.area_complained_of_mc == hp.AreaComplainedOfMC.MY_APARTMENT
    assert first.which_room_mc.value == "All Rooms"  # type: ignore
    assert first.conditions_complained_of_te == "No Heat"

    assert second.area_complained_of_mc == hp.AreaComplainedOfMC.MY_APARTMENT
    assert second.which_room_mc.value == "All Rooms"  # type: ignore
    assert second.conditions_complained_of_te == "supermold"
    v.to_answer_set()


def test_user_to_hpactionvars_populates_issues(db):
    user = UserFactory()
    Issue.objects.set_area_issues_for_user(
        user,
        ISSUE_AREA_CHOICES.KITCHEN,
        [ISSUE_CHOICES.KITCHEN__MOLD]
    )
    user.custom_issues.add(CustomIssue(
        area=ISSUE_AREA_CHOICES.PUBLIC_AREAS,
        description='Lobby is consumed by darkness'
    ), bulk=False)
    v = user_to_hpactionvars(user, NORMAL)
    assert len(v.tenant_complaints_list) == 2
    first, second = v.tenant_complaints_list

    assert first.area_complained_of_mc == hp.AreaComplainedOfMC.MY_APARTMENT
    assert first.which_room_mc.value == "Kitchen"  # type: ignore
    assert first.conditions_complained_of_te == "Mold on walls"

    assert second.area_complained_of_mc == hp.AreaComplainedOfMC.PUBLIC_AREA
    assert second.which_room_mc.value == "Public areas"  # type: ignore
    assert second.conditions_complained_of_te == "lobby is consumed by darkness"
    v.to_answer_set()


@pytest.mark.parametrize('use_bin', [True, False])
def test_user_to_hpactionvars_populates_med_ll_info_from_nycdb(db, nycdb, use_bin):
    med = nycdb.load_hpd_registration('medium-landlord.json')
    oinfo = OnboardingInfoFactory(**onboarding_info_pad_kwarg(med, use_bin))
    v = user_to_hpactionvars(oinfo.user, NORMAL)
    assert v.landlord_entity_name_te == "LANDLORDO CALRISSIAN"
    assert v.landlord_entity_or_individual_mc == hp.LandlordEntityOrIndividualMC.COMPANY
    assert v.landlord_address_street_te == "9 BEAN CENTER DRIVE #40"
    llstate = v.landlord_address_state_mc
    assert llstate and llstate.value == "NJ"
    assert v.management_company_name_te == "FUNKY APARTMENT MANAGEMENT"
    assert v.management_company_address_street_te == "900 EAST 25TH STREET #2"
    v.to_answer_set()


def onboarding_info_pad_kwarg(hpd_reg, use_bin):
    if use_bin:
        assert hpd_reg.bin
        return {'pad_bin': hpd_reg.bin}
    assert hpd_reg.pad_bbl
    return {'pad_bbl': hpd_reg.pad_bbl}


@pytest.mark.parametrize('use_bin', [True, False])
def test_user_to_hpactionvars_populates_tiny_ll_info_from_nycdb(db, nycdb, use_bin):
    tiny = nycdb.load_hpd_registration('tiny-landlord.json')
    oinfo = OnboardingInfoFactory(**onboarding_info_pad_kwarg(tiny, use_bin))
    v = user_to_hpactionvars(oinfo.user, NORMAL)
    assert v.landlord_entity_name_te == "BOOP JONES"
    assert v.landlord_entity_or_individual_mc == hp.LandlordEntityOrIndividualMC.INDIVIDUAL
    v.to_answer_set()


def test_fill_fee_waiver_details_works():
    v = hp.HPActionVariables(sue_for_repairs_tf=True)
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

    assert v.cause_of_action_description_te == "Landlord has failed to do repairs"
    assert v.request_fee_waiver_tf is True
    assert v.tenant_receives_public_assistance_tf is True
    assert v.tenant_income_nu == 11.50
    assert v.tenant_income_source_te == 'Employment, HRA'
    assert v.tenant_monthly_rent_nu == 5
    assert v.tenant_monthly_exp_utilities_nu == 1.50
    assert v.tenant_monthly_exp_other_nu == 2.75
    assert v.previous_application_tf is False
    assert v.reason_for_further_application_te is None

    fwd.asked_before = True
    v = hp.HPActionVariables(sue_for_repairs_tf=True, sue_for_harassment_tf=True)
    fill_fee_waiver_details(v, fwd)

    assert v.previous_application_tf is True
    assert v.reason_for_further_application_te == "economic hardship"
    assert v.cause_of_action_description_te == \
        "Landlord has failed to do repairs and engaged in harassing behaviors"


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
    fill_hp_action_details(v, h, NORMAL)

    # In practice, the city *always* wants this to be false, so we're
    # testing to make sure our code disregards what the user answered.
    assert v.problem_is_urgent_tf is False

    h.urgent_and_dangerous = False
    fill_hp_action_details(v, h, NORMAL)
    assert v.problem_is_urgent_tf is False


def test_sue_for_harassment_works():
    h = HPActionDetailsFactory.build(sue_for_harassment=True)
    v = hp.HPActionVariables()
    fill_hp_action_details(v, h, NORMAL)
    assert v.sue_for_harassment_tf is True

    h.sue_for_harassment = None
    v = hp.HPActionVariables()
    fill_hp_action_details(v, h, NORMAL)
    assert v.sue_for_harassment_tf is None


def test_fill_harassment_details_works():
    h = HarassmentDetailsFactory.build(
        two_or_less_apartments_in_building=False,
        more_than_one_family_per_apartment=False,
        alleg_sued=True,
        harassment_details="Blarg"
    )
    v = hp.HPActionVariables()
    fill_harassment_details(v, h)
    assert v.more_than_2_apartments_in_building_tf is True
    assert v.more_than_one_family_per_apartment_tf is False
    assert v.harassment_sued_tf is True
    assert v.harassment_stopped_service_tf is False
    assert v.harassment_details_te == 'Blarg'
    assert v.prior_relief_sought_case_numbers_and_dates_te is None


def test_user_to_hpactionvars_populates_harassment_only_if_user_wants_it(db):
    har = HarassmentDetailsFactory(two_or_less_apartments_in_building=False)
    PriorCaseFactory(user=har.user)
    v = user_to_hpactionvars(har.user, NORMAL)
    assert v.sue_for_harassment_tf is None
    assert v.more_than_2_apartments_in_building_tf is None
    assert v.prior_repairs_case_mc is None

    HPActionDetailsFactory(sue_for_harassment=True, user=har.user)
    v = user_to_hpactionvars(har.user, NORMAL)
    assert v.sue_for_harassment_tf is True
    assert v.more_than_2_apartments_in_building_tf is True
    assert v.prior_repairs_case_mc == hp.PriorRepairsCaseMC.YES


@pytest.mark.parametrize("enum_name,attr_name", [
    (entry.name, get_hpactionvars_attr_for_harassment_alleg(entry.name))
    for entry in hp.HarassmentAllegationsMS
])
def test_hp_action_variables_has_harassment_allegation_attr(enum_name, attr_name):
    v = hp.HPActionVariables()
    assert hasattr(v, attr_name)


def test_fill_prior_cases_works(db):
    pc = PriorCaseFactory()
    v = hp.HPActionVariables()
    fill_prior_cases(v, pc.user)
    assert v.prior_repairs_case_mc == hp.PriorRepairsCaseMC.YES
    assert v.prior_harassment_case_mc == hp.PriorHarassmentCaseMC.NO
    assert v.prior_relief_sought_case_numbers_and_dates_te == \
        "R #123456789 on 2018-01-03"


@pytest.mark.parametrize('kwargs,repairs,harassment', [
    [dict(is_repairs=True, is_harassment=False), 'YES', 'NO'],
    [dict(is_repairs=False, is_harassment=True), 'NO', 'YES'],
    [dict(is_repairs=True, is_harassment=True), 'YES', 'YES'],
])
def test_fill_prior_repairs_and_harassment_mcs_works(kwargs, repairs, harassment):
    pc = PriorCaseFactory.build(**kwargs)
    v = hp.HPActionVariables()
    fill_prior_repairs_and_harassment_mcs(v, [pc])
    assert v.prior_repairs_case_mc == getattr(hp.PriorRepairsCaseMC, repairs)
    assert v.prior_harassment_case_mc == getattr(hp.PriorHarassmentCaseMC, harassment)


class TestFillLandlordInfo:
    @pytest.mark.parametrize('onb_kwargs,is_nycha', [
        ({}, False),
        ({'pad_bbl': ''}, False),
        ({'lease_type': 'NYCHA'}, True),
        ({'pad_bbl': '1234567890'}, False),
        ({'pad_bbl': '2022150116'}, True),
    ])
    def test_it_sets_nycha_info(self, db, loaded_nycha_csv_data, onb_kwargs, is_nycha):
        oinfo = OnboardingInfoFactory(**onb_kwargs)
        v = hp.HPActionVariables()
        was_filled_out = is_nycha
        assert fill_landlord_info(v, oinfo.user) is was_filled_out
        assert v.user_is_nycha_tf is is_nycha
        if is_nycha:
            assert v.landlord_entity_name_te == "NYC Housing Authority Law Dept"
            llstate = v.landlord_address_state_mc
            assert llstate and llstate.value == "NY"

    def test_it_fills_from_user_landlord_details(self, db):
        ld = LandlordDetailsV2Factory(is_looked_up=False)
        v = hp.HPActionVariables()
        assert fill_landlord_info(v, ld.user) is True
        assert v.landlord_entity_name_te == "Landlordo Calrissian"
        assert v.landlord_address_street_te == "123 Cloud City Drive"
        assert v.landlord_address_city_te == "Bespin"
        llstate = v.landlord_address_state_mc
        assert llstate and llstate.value == "NY"
        assert v.landlord_address_zip_te == "12345"

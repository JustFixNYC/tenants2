from datetime import date
from typing import Dict, Iterable, NamedTuple, Optional, Callable, Any, List
from enum import Enum

from users.models import JustfixUser
from onboarding.models import BOROUGH_CHOICES, LEASE_CHOICES, OnboardingInfo
from issues.models import ISSUE_AREA_CHOICES, ISSUE_CHOICES
from nycha.models import is_nycha_bbl, NychaProperty
import nycdb.models
from project import common_data
from .models import (
    FeeWaiverDetails,
    TenantChild,
    HPActionDetails,
    HarassmentDetails,
    attr_name_for_harassment_allegation,
    PriorCase,
    HP_ACTION_CHOICES,
)
from .forms import EMERGENCY_HPA_ISSUE_LIST
from .merge_issues import IssueMerger, merge_issue_models
from . import hpactionvars as hp


ISSUES_TO_MERGE = [
    # We want to merge these multiple issues into one, to reduce/prevent
    # the likelihood of addendumification.
    IssueMerger((ISSUE_CHOICES.HOME__NO_HEAT, ISSUE_CHOICES.HOME__NO_HOT_WATER)),
    IssueMerger(
        (ISSUE_CHOICES.HOME__MICE, ISSUE_CHOICES.HOME__RATS, ISSUE_CHOICES.HOME__COCKROACHES)
    ),
]

# How many lines the harassment details section of the HP action form has.
MAX_HARASSMENT_DETAILS_LINES = 11

# How many characters, on average, fit into a line in the harassment
# details section. (The font use is not monospaced.)
HARASSMENT_DETAILS_LINE_LENGTH = 60

# The most prior cases to list in EHPAs (so as not to generate an addendum).
MAX_EMERGENCY_PRIOR_CASES = 3

NYCHA_ADDRESS = common_data.load_json("nycha-address.json")


BOROUGH_COURT_LOCATIONS: Dict[str, hp.CourtLocationMC] = {
    BOROUGH_CHOICES.MANHATTAN: hp.CourtLocationMC.NEW_YORK_COUNTY,
    BOROUGH_CHOICES.BRONX: hp.CourtLocationMC.BRONX_COUNTY,
    BOROUGH_CHOICES.BROOKLYN: hp.CourtLocationMC.KINGS_COUNTY,
    BOROUGH_CHOICES.QUEENS: hp.CourtLocationMC.QUEENS_COUNTY,
    BOROUGH_CHOICES.STATEN_ISLAND: hp.CourtLocationMC.RICHMOND_COUNTY,
}


COURT_COUNTIES: Dict[str, hp.CourtCountyMC] = {
    BOROUGH_CHOICES.MANHATTAN: hp.CourtCountyMC.NEW_YORK,
    BOROUGH_CHOICES.BRONX: hp.CourtCountyMC.BRONX,
    BOROUGH_CHOICES.BROOKLYN: hp.CourtCountyMC.KINGS,
    BOROUGH_CHOICES.QUEENS: hp.CourtCountyMC.QUEENS,
    BOROUGH_CHOICES.STATEN_ISLAND: hp.CourtCountyMC.RICHMOND,
}


BOROUGHS: Dict[str, hp.TenantBoroughMC] = {
    BOROUGH_CHOICES.MANHATTAN: hp.TenantBoroughMC.MANHATTAN,
    BOROUGH_CHOICES.BRONX: hp.TenantBoroughMC.BRONX,
    BOROUGH_CHOICES.BROOKLYN: hp.TenantBoroughMC.BROOKLYN,
    BOROUGH_CHOICES.QUEENS: hp.TenantBoroughMC.QUEENS,
    BOROUGH_CHOICES.STATEN_ISLAND: hp.TenantBoroughMC.STATEN_ISLAND,
}


def justfix_issue_area_to_hp_area(area: str) -> hp.AreaComplainedOfMC:
    if area == ISSUE_AREA_CHOICES.PUBLIC_AREAS:
        return hp.AreaComplainedOfMC.PUBLIC_AREA
    return hp.AreaComplainedOfMC.MY_APARTMENT


def justfix_issue_area_to_hp_room(area: str) -> hp.WhichRoomMC:
    # This is important!  We are intentionally breaking with the
    # HotDocs schema's choices for "Which room MC" and
    # applying our own. The HotDocs components don't seem to have
    # any actual validation or logic pertaining to these, and
    # the values we pass in show up on the final PDF, so this
    # should be fine.
    if area == ISSUE_AREA_CHOICES.HOME:
        # The current label for this issue area,
        # "Entire home and hallways", is too long to fit
        # in the HPD inspection form, and gets put in an
        # addendum, which is really confusing to HPD
        # inspectors, so we'll use the built-in category for this.
        return hp.WhichRoomMC.ALL_ROOMS
    return ISSUE_AREA_CHOICES.get_enum_member(area)


def create_complaint(area: str, description: str) -> hp.TenantComplaints:
    return hp.TenantComplaints(
        area_complained_of_mc=justfix_issue_area_to_hp_area(area),
        which_room_mc=justfix_issue_area_to_hp_room(area),
        conditions_complained_of_te=description,
    )


def twoletter_to_hp_state(state: str) -> hp.LandlordAddressStateMC:
    # This is kind of yucky, because NYCDB/HPD and our db provide state information as
    # all-caps two-letter strings (e.g. "NY") while the HotDocs endpoint wants
    # them fully spelled out (e.g. "New York"). However, in practice it doesn't seem
    # to mind if we give it the two-letter strings, so we'll just do that.
    class OneOffEnum(Enum):
        VALUE = state

    return OneOffEnum.VALUE  # type: ignore


class FillLandlordInfoResult(NamedTuple):
    # Whether landlord information was actually filled out.
    was_filled: bool

    # If the landlord information returns has an expiration date,
    # e.g. if it was registered via HPD, this is it.
    expiration_date: Optional[date] = None

    def __bool__(self) -> bool:
        return self.was_filled


def fill_landlord_info_from_contact(v: hp.HPActionVariables, contact: nycdb.models.Contact) -> None:
    v.landlord_address_city_te = contact.address.city
    v.landlord_address_street_te = contact.address.first_line
    v.landlord_address_zip_te = contact.address.zipcode
    v.landlord_address_state_mc = twoletter_to_hp_state(contact.address.state)
    if isinstance(contact, nycdb.models.Company):
        v.landlord_entity_or_individual_mc = hp.LandlordEntityOrIndividualMC.COMPANY
    else:
        v.landlord_entity_or_individual_mc = hp.LandlordEntityOrIndividualMC.INDIVIDUAL

        # I don't think these are actually used in rendering the form, but just in case...
        v.landlord_name_first_te = contact.first_name
        v.landlord_name_last_te = contact.last_name
    v.landlord_entity_name_te = contact.name


def fill_landlord_management_info_from_company(
    v: hp.HPActionVariables, mgmtco: nycdb.models.Company
) -> None:
    v.management_company_address_city_te = mgmtco.address.city
    v.management_company_address_street_te = mgmtco.address.first_line
    v.management_company_address_zip_te = mgmtco.address.zipcode
    v.management_company_address_state_mc = twoletter_to_hp_state(mgmtco.address.state)
    v.management_company_name_te = mgmtco.name

    # TODO: We might actually want to fill this out even if we don't find
    # a management company, as this could at least generate the required
    # forms. Need to find this out.
    v.management_company_to_be_sued_tf = True


def fill_landlord_info_from_bbl_or_bin(
    v: hp.HPActionVariables, pad_bbl: str, pad_bin: str
) -> FillLandlordInfoResult:
    expiration_date: Optional[date] = None
    landlord_found = False
    contact = nycdb.models.get_non_head_officer_landlord(pad_bbl, pad_bin)
    if contact:
        landlord_found = True
        expiration_date = contact.expiration_date
        fill_landlord_info_from_contact(v, contact)
    mgmtco = nycdb.models.get_management_company(pad_bbl, pad_bin)
    if mgmtco:
        fill_landlord_management_info_from_company(v, mgmtco)
    return FillLandlordInfoResult(landlord_found, expiration_date)


def get_user_onboarding_str_attr(user: JustfixUser, attr: str) -> str:
    if hasattr(user, "onboarding_info"):
        return getattr(user.onboarding_info, attr)
    return ""


def get_user_pad_bbl(user: JustfixUser) -> str:
    return get_user_onboarding_str_attr(user, "pad_bbl")


def get_user_pad_bin(user: JustfixUser) -> str:
    return get_user_onboarding_str_attr(user, "pad_bin")


def fill_landlord_management_info_from_user_mgmt_co_details(
    v: hp.HPActionVariables, user: JustfixUser
):
    if not hasattr(user, "management_company_details"):
        return
    mcd = user.management_company_details
    if mcd.name and mcd.is_address_populated():
        v.management_company_address_city_te = mcd.city
        v.management_company_address_street_te = mcd.primary_line
        v.management_company_address_zip_te = mcd.zip_code
        v.management_company_address_state_mc = twoletter_to_hp_state(mcd.state)
        v.management_company_name_te = mcd.name

        v.management_company_to_be_sued_tf = True


def fill_landlord_info_from_user_landlord_details(
    v: hp.HPActionVariables, user: JustfixUser
) -> bool:
    if hasattr(user, "landlord_details"):
        ld = user.landlord_details
        if not ld.is_looked_up and ld.name and ld.is_address_populated():
            # The user has manually entered landlord details, use them!
            v.landlord_entity_name_te = ld.name
            v.landlord_address_street_te = ld.primary_line
            v.landlord_address_city_te = ld.city
            v.landlord_address_zip_te = ld.zip_code
            v.landlord_address_state_mc = twoletter_to_hp_state(ld.state)
            fill_landlord_management_info_from_user_mgmt_co_details(v, user)
            # TODO: Consider populating the 'individual' vs. 'company' field somehow?
            return True
    return False


def fill_landlord_info_from_open_data(
    v: hp.HPActionVariables, user: JustfixUser
) -> FillLandlordInfoResult:
    pad_bbl = get_user_pad_bbl(user)
    pad_bin = get_user_pad_bin(user)
    if pad_bbl or pad_bin:
        return fill_landlord_info_from_bbl_or_bin(v, pad_bbl, pad_bin)
    return FillLandlordInfoResult(False)


def fill_landlord_info_from_nycha(v: hp.HPActionVariables, user: JustfixUser) -> bool:
    v.user_is_nycha_tf = True

    name = NYCHA_ADDRESS["name"]
    pad_bbl = get_user_onboarding_str_attr(user, "pad_bbl")

    if pad_bbl:
        prop = NychaProperty.objects.filter(pad_bbl=pad_bbl).first()
        if prop:
            name = f"NYCHA {prop.development.title()} Houses"

    v.landlord_entity_name_te = name
    v.landlord_address_street_te = NYCHA_ADDRESS["primaryLine"]
    v.landlord_address_city_te = NYCHA_ADDRESS["city"]
    v.landlord_address_zip_te = NYCHA_ADDRESS["zipCode"]
    v.landlord_address_state_mc = twoletter_to_hp_state(NYCHA_ADDRESS["state"])
    return True


def did_user_self_report_as_nycha(user: JustfixUser) -> bool:
    return get_user_onboarding_str_attr(user, "lease_type") == LEASE_CHOICES.NYCHA


def does_user_have_a_nycha_bbl(user: JustfixUser) -> bool:
    return is_nycha_bbl(get_user_pad_bbl(user))


def fill_landlord_info(
    v: hp.HPActionVariables,
    user: JustfixUser,
    use_user_landlord_details: bool = True,
) -> FillLandlordInfoResult:
    v.user_is_nycha_tf = False
    if did_user_self_report_as_nycha(user):
        return FillLandlordInfoResult(fill_landlord_info_from_nycha(v, user))
    result = FillLandlordInfoResult(
        use_user_landlord_details and fill_landlord_info_from_user_landlord_details(v, user)
    )
    if not result:
        # The user has not manually entered landlord details; use the latest
        # open data to fill in both the landlord and management company.
        result = fill_landlord_info_from_open_data(v, user)
        if not result and does_user_have_a_nycha_bbl(user):
            result = FillLandlordInfoResult(fill_landlord_info_from_nycha(v, user))
    return result


def fill_tenant_children(v: hp.HPActionVariables, children: Iterable[TenantChild]) -> None:
    v.tenant_child_list = [
        hp.TenantChild(tenant_child_name_te=child.name, tenant_child_dob=child.dob)
        for child in children
    ]
    v.tenant_children_under_6_nu = len(v.tenant_child_list)


def get_tenant_repairs_allegations_mc(
    h: HPActionDetails,
) -> hp.TenantRepairsAllegationsMC:
    if h.filed_with_311 is True:
        if h.hpd_issued_violations is False and h.thirty_days_since_311 is True:
            # I filed a complaint with HPD. More than 30 days have passed since then.
            # HPD has not issued a Notice of Violation.
            return hp.TenantRepairsAllegationsMC.NO_NOTICE_ISSUED
        elif h.hpd_issued_violations is True and h.thirty_days_since_violations is True:
            # I filed a complaint with HPD. HPD issued a Notice of Violation.
            # More than 30 days have passed since then. The landlord has not fixed the problem.
            return hp.TenantRepairsAllegationsMC.NOTICE_ISSUED
    return hp.TenantRepairsAllegationsMC.WAIVE


def fill_hp_action_details(v: hp.HPActionVariables, h: HPActionDetails, kind: str) -> None:
    v.tenant_repairs_allegations_mc = get_tenant_repairs_allegations_mc(h)

    # In practice, the city *always* wants this to be false, so we are going to
    # force it to be the case for now, disregarding what the user said.
    # v.problem_is_urgent_tf = h.urgent_and_dangerous
    v.problem_is_urgent_tf = False

    v.sue_for_harassment_tf = h.sue_for_harassment

    v.sue_for_repairs_tf = h.sue_for_repairs


def get_hpactionvars_attr_for_harassment_alleg(name: str) -> str:
    return f"harassment_{name.lower()}_tf"


def fill_harassment_allegations(v: hp.HPActionVariables, h: HarassmentDetails) -> None:
    for entry in hp.HarassmentAllegationsMS:
        value = getattr(h, attr_name_for_harassment_allegation(entry.name))
        setattr(v, get_hpactionvars_attr_for_harassment_alleg(entry.name), value)


def flip_null_bool(value: Optional[bool]) -> Optional[bool]:
    """
    >>> flip_null_bool(None)
    >>> flip_null_bool(False)
    True
    >>> flip_null_bool(True)
    False
    """

    if value is None:
        return value
    return not value


def reduce_number_of_lines(value: str, max_lines: int, line_length: int) -> str:
    """
    If the given value, when text-wrapped across the given line length, is
    greater than the given number of lines, reduce the number of lines by
    replacing all newlines with ' / '.
    """

    import textwrap

    value = value.replace("\r", "")
    lines = value.split("\n")
    wrapped_lines: List[str] = []
    for line in lines:
        if line.strip():
            wrapped_lines.extend(textwrap.wrap(line, width=line_length))
        else:
            wrapped_lines.append("")

    if len(wrapped_lines) > max_lines:
        value = " / ".join(filter(None, lines))

    return value


def fill_harassment_details(v: hp.HPActionVariables, h: HarassmentDetails) -> None:
    fill_harassment_allegations(v, h)
    v.more_than_2_apartments_in_building_tf = flip_null_bool(h.two_or_less_apartments_in_building)
    v.more_than_one_family_per_apartment_tf = h.more_than_one_family_per_apartment
    v.harassment_details_te = reduce_number_of_lines(
        h.harassment_details,
        max_lines=MAX_HARASSMENT_DETAILS_LINES,
        line_length=HARASSMENT_DETAILS_LINE_LENGTH,
    )


def fill_fee_waiver_details(v: hp.HPActionVariables, fwd: FeeWaiverDetails) -> None:
    v.request_fee_waiver_tf = True

    causes: List[str] = []
    if v.sue_for_repairs_tf:
        causes.append("failed to do repairs")
    if v.sue_for_harassment_tf:
        causes.append("engaged in harassing behaviors")

    # Completes "My case is good and worthwhile because_______".
    v.cause_of_action_description_te = f"Landlord has {' and '.join(causes)}"

    # Waive any and all statutory fees for the defense or prosecution of the action.
    v.ifp_what_orders_ms = [hp.IFPWhatOrdersMS.FEES]

    # List any major property that you own, like a car or a valuable item, and the value of that
    # property.
    v.tenant_property_owned_te = "None"

    # How often do you get paid?
    v.pay_period_mc = hp.PayPeriodMC.MONTH

    # What is your household income?
    v.tenant_income_nu = fwd.income_amount_monthly

    # What is the source of your income?
    v.tenant_income_source_te = ", ".join(fwd.income_sources)

    # What is your monthly rent?
    v.tenant_monthly_rent_nu = fwd.rent_amount

    # Monthly expenditure for utilities
    v.tenant_monthly_exp_utilities_nu = fwd.expense_utilities

    # Monthly expenditure for other stuff
    v.tenant_monthly_exp_other_nu = fwd.non_utility_expenses

    # Have you asked for a fee waiver before?
    v.previous_application_tf = fwd.asked_before

    # Do you receive public assistance benefits?
    v.tenant_receives_public_assistance_tf = fwd.receives_public_assistance

    if fwd.asked_before:
        # Completes the sentence "I have applied for a fee waiver before, but I am making
        # this application because..."
        #
        # TODO: Replace with something more appropriate.
        v.reason_for_further_application_te = "economic hardship"


def fill_if_user_has_with_kind(
    fill_func: Callable[[hp.HPActionVariables, Any, str], None],
    v: hp.HPActionVariables,
    user: JustfixUser,
    attr_name: str,
    kind: str,
):
    if hasattr(user, attr_name):
        fill_func(v, getattr(user, attr_name), kind)


def fill_if_user_has(
    fill_func: Callable[[hp.HPActionVariables, Any], None],
    v: hp.HPActionVariables,
    user: JustfixUser,
    attr_name: str,
):
    if hasattr(user, attr_name):
        fill_func(v, getattr(user, attr_name))


def fill_prior_repairs_and_harassment_mcs(v: hp.HPActionVariables, cases: List[PriorCase]):
    if bool([case for case in cases if case.is_harassment]):
        v.prior_harassment_case_mc = hp.PriorHarassmentCaseMC.YES
    else:
        v.prior_harassment_case_mc = hp.PriorHarassmentCaseMC.NO

    if bool([case for case in cases if case.is_repairs]):
        v.prior_repairs_case_mc = hp.PriorRepairsCaseMC.YES
    else:
        v.prior_repairs_case_mc = hp.PriorRepairsCaseMC.NO


def fill_prior_cases(v: hp.HPActionVariables, user: JustfixUser, kind: str):
    cases = list(user.prior_hp_action_cases.all())
    cases_strs = [str(case) for case in cases]
    prior_cases_str = ", ".join(cases_strs)
    if kind == HP_ACTION_CHOICES.EMERGENCY and len(cases_strs) > MAX_EMERGENCY_PRIOR_CASES:
        extra_cases = len(cases_strs) - MAX_EMERGENCY_PRIOR_CASES
        prior_cases_str = (
            ", ".join(cases_strs[:MAX_EMERGENCY_PRIOR_CASES]) + f" and {extra_cases} more"
        )
    v.prior_relief_sought_case_numbers_and_dates_te = prior_cases_str
    fill_prior_repairs_and_harassment_mcs(v, cases)


def fill_issues(v: hp.HPActionVariables, user: JustfixUser, kind: str):
    issues = user.issues.all()
    custom_issues = user.custom_issues.all()

    if kind == HP_ACTION_CHOICES.EMERGENCY:
        issues = issues.filter(value__in=EMERGENCY_HPA_ISSUE_LIST)
        custom_issues = custom_issues.filter(area=ISSUE_AREA_CHOICES.HOME)

    for issue in merge_issue_models(issues, ISSUES_TO_MERGE):
        v.tenant_complaints_list.append(create_complaint(issue.area, issue.description))

    for cissue in custom_issues:
        # We're lowercasing the description because we *really* don't want
        # to generate an addendum: the font used in the form isn't monospaced
        # and many users type in all-caps, so lowercasing everything reduces
        # the risk of addendumification.
        complaint = create_complaint(cissue.area, cissue.description.lower())

        v.tenant_complaints_list.append(complaint)


def is_harlem_cjc(v: hp.HPActionVariables) -> Optional[bool]:
    # This logic needs to mirror the logic in the HotDocs interview file.
    return v.tenant_borough_mc == hp.TenantBoroughMC.MANHATTAN and (
        v.tenant_address_zip_te in ("10035", "10037")
        or (v.tenant_address_zip_te == "10029" and v.user_is_nycha_tf)
    )


def is_red_hook_cjc(v: hp.HPActionVariables) -> Optional[bool]:
    # This logic needs to mirror the logic in the HotDocs interview file.
    return (
        v.tenant_borough_mc == hp.TenantBoroughMC.BROOKLYN
        and v.tenant_address_zip_te == "11231"
        and v.user_is_nycha_tf
    )


def fill_onboarding_info(v: hp.HPActionVariables, oinfo: OnboardingInfo) -> None:
    v.tenant_address_apt_no_te = oinfo.apt_number
    v.tenant_address_city_te = oinfo.city
    v.tenant_address_zip_te = oinfo.zipcode
    v.tenant_address_street_te = oinfo.address
    v.tenant_borough_mc = BOROUGHS[oinfo.borough]
    v.court_county_mc = COURT_COUNTIES[oinfo.borough]
    v.tenant_address_floor_nu = oinfo.floor_number

    assert v.user_is_nycha_tf is not None

    if is_red_hook_cjc(v):
        v.court_location_mc = hp.CourtLocationMC.RED_HOOK_COMMUNITY_JUSTICE_CENTER
    elif is_harlem_cjc(v):
        v.court_location_mc = hp.CourtLocationMC.HARLEM_COMMUNITY_JUSTICE_CENTER
    else:
        v.court_location_mc = BOROUGH_COURT_LOCATIONS[oinfo.borough]


def user_to_hpactionvars(user: JustfixUser, kind: str) -> hp.HPActionVariables:
    v = hp.HPActionVariables()

    # TODO: The HP Action form actually has a field for home phone
    # and a separate one for work; it's unclear which one the
    # user may have provided, but we'll assume it's home for now.
    v.tenant_phone_home_te = user.formatted_phone_number()

    v.tenant_name_first_te = user.first_name
    v.tenant_name_last_te = user.last_name

    # I'm not sure, but I *think* this is the "do you agree to the terms of use"
    # checkbox.
    v.flag_tf = True

    # The fact that there is a multiple-select option and
    # a set of booleans for the same thing is, I think, an
    # artifact of the history of the form; the original
    # version only had the multi-select, and a newer 2018
    # version introduced the booleans. I think only the
    # booleans are used, but I'm setting the multiple-select
    # too, just in case it's used anywhere.
    #
    # Note that in some cases, there are multiple-select
    # options *and* a set of booleans for the same thing.
    # Historically, there were originally just multiple-selects,
    # but later booleans were added, because A2J (one of the interview
    # formats) doesn't support multiple-select options, so the
    # hotdocs setup had to be modified to use a bunch of
    # booleans instead. In all cases, we only need to care
    # about the booleans, and can ignore the multiple-select
    # values.

    # We're only serving New Yorkers at the moment...
    v.tenant_address_state_mc = hp.TenantAddressStateMC.NEW_YORK

    fill_landlord_info(v, user)

    fill_if_user_has(fill_onboarding_info, v, user, "onboarding_info")

    fill_issues(v, user, kind)

    fill_tenant_children(v, TenantChild.objects.filter(user=user))

    fill_if_user_has_with_kind(fill_hp_action_details, v, user, "hp_action_details", kind)

    if v.sue_for_harassment_tf:
        fill_if_user_has(fill_harassment_details, v, user, "harassment_details")
        fill_prior_cases(v, user, kind)

    if kind != HP_ACTION_CHOICES.EMERGENCY:
        fill_if_user_has(fill_fee_waiver_details, v, user, "fee_waiver_details")

    # Assume the tenant always wants to serve the papers themselves.
    v.tenant_wants_to_serve_tf = True

    return v

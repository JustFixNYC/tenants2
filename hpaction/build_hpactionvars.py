from typing import Dict, Iterable, Optional, Callable, Any
from enum import Enum

from users.models import JustfixUser
from onboarding.models import BOROUGH_CHOICES
from issues.models import ISSUE_AREA_CHOICES, ISSUE_CHOICES
from nycha.models import is_nycha_bbl
import nycdb.models
from .models import (
    FeeWaiverDetails, TenantChild, HPActionDetails, HarassmentDetails,
    attr_name_for_harassment_allegation)
from . import hpactionvars as hp


# TODO: There are more court locations than there are
# boroughs; specifically, the Harlem and Red Hook Community Justice
# Centers. Master.cmp has some HotDocs script logic to auto-default
# to Harlem if the user's zip code is "01035" or "01037" (I assume they
# should start with "10" though), but no logic to auto-default to
# Red Hook.  I guess this means we ultimately let the user decide
# which court to go to, as the LHI form does.
COURT_LOCATIONS: Dict[str, hp.CourtLocationMC] = {
    BOROUGH_CHOICES.MANHATTAN: hp.CourtLocationMC.NEW_YORK_COUNTY,
    BOROUGH_CHOICES.BRONX: hp.CourtLocationMC.BRONX_COUNTY,
    BOROUGH_CHOICES.BROOKLYN: hp.CourtLocationMC.KINGS_COUNTY,
    BOROUGH_CHOICES.QUEENS: hp.CourtLocationMC.QUEENS_COUNTY,
    BOROUGH_CHOICES.STATEN_ISLAND: hp.CourtLocationMC.RICHMOND_COUNTY
}


COURT_COUNTIES: Dict[str, hp.CourtCountyMC] = {
    BOROUGH_CHOICES.MANHATTAN: hp.CourtCountyMC.NEW_YORK,
    BOROUGH_CHOICES.BRONX: hp.CourtCountyMC.BRONX,
    BOROUGH_CHOICES.BROOKLYN: hp.CourtCountyMC.KINGS,
    BOROUGH_CHOICES.QUEENS: hp.CourtCountyMC.QUEENS,
    BOROUGH_CHOICES.STATEN_ISLAND: hp.CourtCountyMC.RICHMOND
}


BOROUGHS: Dict[str, hp.TenantBoroughMC] = {
    BOROUGH_CHOICES.MANHATTAN: hp.TenantBoroughMC.MANHATTAN,
    BOROUGH_CHOICES.BRONX: hp.TenantBoroughMC.BRONX,
    BOROUGH_CHOICES.BROOKLYN: hp.TenantBoroughMC.BROOKLYN,
    BOROUGH_CHOICES.QUEENS: hp.TenantBoroughMC.QUEENS,
    BOROUGH_CHOICES.STATEN_ISLAND: hp.TenantBoroughMC.STATEN_ISLAND
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
        conditions_complained_of_te=description
    )


def nycdb_addr_to_hp_state(address: nycdb.models.Address) -> hp.LandlordAddressStateMC:
    # This is kind of yucky, because NYCDB/HPD provides state information as
    # all-caps two-letter strings (e.g. "NY") while the HotDocs endpoint wants
    # them fully spelled out (e.g. "New York"). However, in practice it doesn't seem
    # to mind if we give it the two-letter strings, so we'll just do that.
    class OneOffEnum(Enum):
        VALUE = address.state

    return OneOffEnum.VALUE  # type: ignore


def fill_landlord_info_from_contact(
    v: hp.HPActionVariables,
    contact: nycdb.models.Contact
) -> None:
    v.landlord_address_city_te = contact.address.city
    v.landlord_address_street_te = contact.address.first_line
    v.landlord_address_zip_te = contact.address.zipcode
    v.landlord_address_state_mc = nycdb_addr_to_hp_state(contact.address)
    if isinstance(contact, nycdb.models.Company):
        v.landlord_entity_or_individual_mc = hp.LandlordEntityOrIndividualMC.COMPANY
    else:
        v.landlord_entity_or_individual_mc = hp.LandlordEntityOrIndividualMC.INDIVIDUAL

        # I don't think these are actually used in rendering the form, but just in case...
        v.landlord_name_first_te = contact.first_name
        v.landlord_name_last_te = contact.last_name
    v.landlord_entity_name_te = contact.name


def fill_landlord_management_info_from_company(
    v: hp.HPActionVariables,
    mgmtco: nycdb.models.Company
) -> None:
    v.management_company_address_city_te = mgmtco.address.city
    v.management_company_address_street_te = mgmtco.address.first_line
    v.management_company_address_zip_te = mgmtco.address.zipcode
    v.management_company_address_state_mc = nycdb_addr_to_hp_state(mgmtco.address)
    v.management_company_name_te = mgmtco.name

    # TODO: We might actually want to fill this out even if we don't find
    # a management company, as this could at least generate the required
    # forms. Need to find this out.
    v.management_company_to_be_sued_tf = True


def fill_landlord_info_from_bbl_or_bin(
    v: hp.HPActionVariables,
    pad_bbl: str,
    pad_bin: str
) -> bool:
    landlord_found = False
    contact = nycdb.models.get_landlord(pad_bbl, pad_bin)
    if contact:
        landlord_found = True
        fill_landlord_info_from_contact(v, contact)
    mgmtco = nycdb.models.get_management_company(pad_bbl, pad_bin)
    if mgmtco:
        fill_landlord_management_info_from_company(v, mgmtco)
    return landlord_found


def get_user_onboarding_str_attr(user: JustfixUser, attr: str) -> str:
    if hasattr(user, 'onboarding_info'):
        return getattr(user.onboarding_info, attr)
    return ''


def get_user_pad_bbl(user: JustfixUser) -> str:
    return get_user_onboarding_str_attr(user, 'pad_bbl')


def get_user_pad_bin(user: JustfixUser) -> str:
    return get_user_onboarding_str_attr(user, 'pad_bin')


def fill_nycha_info(v: hp.HPActionVariables, user: JustfixUser):
    pad_bbl = get_user_pad_bbl(user)
    if pad_bbl:
        v.user_is_nycha_tf = is_nycha_bbl(pad_bbl)


def fill_landlord_info(v: hp.HPActionVariables, user: JustfixUser) -> None:
    landlord_found = False

    pad_bbl = get_user_pad_bbl(user)
    pad_bin = get_user_pad_bin(user)
    if pad_bbl or pad_bin:
        landlord_found = fill_landlord_info_from_bbl_or_bin(v, pad_bbl, pad_bin)

    if not landlord_found and hasattr(user, 'landlord_details'):
        ld = user.landlord_details
        v.landlord_entity_name_te = ld.name


def fill_tenant_children(v: hp.HPActionVariables, children: Iterable[TenantChild]) -> None:
    v.tenant_child_list = [
        hp.TenantChild(
            tenant_child_name_te=child.name,
            tenant_child_dob=child.dob
        )
        for child in children
    ]
    v.tenant_children_under_6_nu = len(v.tenant_child_list)


def get_tenant_repairs_allegations_mc(
    h: HPActionDetails
) -> Optional[hp.TenantRepairsAllegationsMC]:
    if h.filed_with_311 is True:
        if h.hpd_issued_violations is False and h.thirty_days_since_311 is True:
            # I filed a complaint with HPD. More than 30 days have passed since then.
            # HPD has not issued a Notice of Violation.
            return hp.TenantRepairsAllegationsMC.NO_NOTICE_ISSUED
        elif h.hpd_issued_violations is True and h.thirty_days_since_violations is True:
            # I filed a complaint with HPD. HPD issued a Notice of Violation.
            # More than 30 days have passed since then. The landlord has not fixed the problem.
            return hp.TenantRepairsAllegationsMC.NOTICE_ISSUED
    return None


def fill_hp_action_details(v: hp.HPActionVariables, h: HPActionDetails) -> None:
    v.tenant_repairs_allegations_mc = get_tenant_repairs_allegations_mc(h)
    v.problem_is_urgent_tf = h.urgent_and_dangerous
    v.sue_for_harassment_tf = h.sue_for_harassment
    v.sue_for_repairs_tf = h.sue_for_repairs


def get_hpactionvars_attr_for_harassment_alleg(name: str) -> str:
    return f"harassment_{name.lower()}_tf"


def fill_harassment_allegations(v: hp.HPActionVariables, h: HarassmentDetails) -> None:
    for entry in hp.HarassmentAllegationsMS:
        value = getattr(h, attr_name_for_harassment_allegation(entry.name))
        setattr(v, get_hpactionvars_attr_for_harassment_alleg(entry.name), value)


def fill_harassment_details(v: hp.HPActionVariables, h: HarassmentDetails) -> None:
    fill_harassment_allegations(v, h)
    v.more_than_2_apartments_in_building_tf = h.more_than_two_apartments_in_building
    v.more_than_one_family_per_apartment_tf = h.more_than_one_family_per_apartment
    v.harassment_details_te = h.harassment_details

    prior_relief = h.prior_relief_sought_case_numbers_and_dates.strip()
    if prior_relief:
        v.prior_harassment_case_mc = hp.PriorHarassmentCaseMC.YES
        v.prior_relief_sought_case_numbers_and_dates_te = prior_relief
    else:
        v.prior_harassment_case_mc = hp.PriorHarassmentCaseMC.NO


def fill_fee_waiver_details(v: hp.HPActionVariables, fwd: FeeWaiverDetails) -> None:
    v.request_fee_waiver_tf = True

    # Completes "My case is good and worthwhile because_______".
    v.cause_of_action_description_te = "Landlord has failed to do repairs"

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
    v.tenant_income_source_te = ', '.join(fwd.income_sources)

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


def fill_if_user_has(
    fill_func: Callable[[hp.HPActionVariables, Any], None],
    v: hp.HPActionVariables,
    user: JustfixUser,
    attr_name: str,
):
    if hasattr(user, attr_name):
        fill_func(v, getattr(user, attr_name))


def user_to_hpactionvars(user: JustfixUser) -> hp.HPActionVariables:
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
    fill_nycha_info(v, user)

    if hasattr(user, 'onboarding_info'):
        oinfo = user.onboarding_info
        v.tenant_address_apt_no_te = oinfo.apt_number
        v.tenant_address_city_te = oinfo.city
        v.tenant_address_zip_te = oinfo.zipcode
        v.tenant_address_street_te = oinfo.address
        v.tenant_borough_mc = BOROUGHS[oinfo.borough]
        v.court_location_mc = COURT_LOCATIONS[oinfo.borough]
        v.court_county_mc = COURT_COUNTIES[oinfo.borough]

    for issue in user.issues.all():
        desc = ISSUE_CHOICES.get_label(issue.value)
        v.tenant_complaints_list.append(create_complaint(issue.area, desc))

    for cissue in user.custom_issues.all():
        v.tenant_complaints_list.append(create_complaint(cissue.area, cissue.description))

    fill_if_user_has(fill_fee_waiver_details, v, user, 'fee_waiver_details')

    fill_tenant_children(v, TenantChild.objects.filter(user=user))

    fill_if_user_has(fill_hp_action_details, v, user, 'hp_action_details')

    if v.sue_for_harassment_tf:
        fill_if_user_has(fill_harassment_details, v, user, 'harassment_details')

    # Assume the tenant always wants to serve the papers themselves.
    v.tenant_wants_to_serve_tf = True

    return v

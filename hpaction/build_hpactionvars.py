from typing import Dict
from enum import Enum

from users.models import JustfixUser
from onboarding.models import BOROUGH_CHOICES
from issues.models import ISSUE_AREA_CHOICES, ISSUE_CHOICES
import nycdb.models
from .models import FeeWaiverDetails
from . import hpactionvars as hp


# TODO: There are more court locations than there are
# boroughs; specifically, the Harlem and Red Hook Community Justice
# Centers. Master.cmp has some HotDocs script logic to auto-default
# to Harlem if the user's zip code is "01035" or "01037" (I assume they
# should start with "10" though), but no logic to auto-default to
# Red Hook.  I guess this means we ultimately let the user decide
# which court to go to, as the LHI form does.
COURT_LOCATIONS: Dict[str, hp.CourtLocationMC] = {
    BOROUGH_CHOICES.MANHATTAN: hp.CourtLocationMC.NY,
    BOROUGH_CHOICES.BRONX: hp.CourtLocationMC.BRONX,
    BOROUGH_CHOICES.BROOKLYN: hp.CourtLocationMC.KINGS,
    BOROUGH_CHOICES.QUEENS: hp.CourtLocationMC.QUEENS,
    BOROUGH_CHOICES.STATEN_ISLAND: hp.CourtLocationMC.RICHMOND
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
    v.service_address_full_te = ", ".join(contact.address.lines_for_mailing)
    if isinstance(contact, nycdb.models.Company):
        v.landlord_entity_or_individual_mc = hp.LandlordEntityOrIndividualMC.COMPANY
    else:
        v.landlord_entity_or_individual_mc = hp.LandlordEntityOrIndividualMC.INDIVIDUAL

        # I don't think these are actually used in rendering the form, but just in case...
        v.landlord_name_first_te = contact.first_name
        v.landlord_name_last_te = contact.last_name
    v.landlord_entity_name_te = contact.name
    v.served_person_te = contact.name


def fill_landlord_management_info_from_company(
    v: hp.HPActionVariables,
    mgmtco: nycdb.models.Company
) -> None:
    v.management_company_address_city_te = mgmtco.address.city
    v.management_company_address_street_te = mgmtco.address.first_line
    v.management_company_address_zip_te = mgmtco.address.zipcode
    v.management_company_address_state_mc = nycdb_addr_to_hp_state(mgmtco.address)
    v.service_address_full_management_company_te = ", ".join(
        mgmtco.address.lines_for_mailing)
    v.served_person_management_company_te = mgmtco.name
    v.management_company_name_te = mgmtco.name

    # TODO: We might actually want to fill this out even if we don't find
    # a management company, as this could at least generate the required
    # forms. Need to find this out.
    v.management_company_to_be_sued_tf = True
    v.mgmt_co_is_party_tf = True
    v.service_already_completed_mgmt_co_tf = False
    v.hpd_service_mgmt_co_mc = hp.HPDServiceMgmtCoMC.MAIL
    v.service_method_mgmt_co_mc = hp.ServiceMethodMgmtCoMC.MAIL


def fill_landlord_info_from_bbl(v: hp.HPActionVariables, pad_bbl: str) -> bool:
    landlord_found = False
    contact = nycdb.models.get_landlord(pad_bbl)
    if contact:
        landlord_found = True
        fill_landlord_info_from_contact(v, contact)
    mgmtco = nycdb.models.get_management_company(pad_bbl)
    if mgmtco:
        fill_landlord_management_info_from_company(v, mgmtco)
    return landlord_found


def fill_landlord_info(v: hp.HPActionVariables, user: JustfixUser) -> None:
    landlord_found = False

    v.service_already_completed_landlord_tf = False
    v.hpd_service_landlord_mc = hp.HPDServiceLandlordMC.MAIL
    v.service_method_mc = hp.ServiceMethodMC.MAIL
    v.landlord_is_party_tf = True

    if hasattr(user, 'onboarding_info'):
        pad_bbl: str = user.onboarding_info.pad_bbl
        if pad_bbl:
            landlord_found = fill_landlord_info_from_bbl(v, pad_bbl)

    if not landlord_found and hasattr(user, 'landlord_details'):
        ld = user.landlord_details
        v.landlord_entity_name_te = ld.name
        v.served_person_te = ld.name
        v.service_address_full_te = ld.address


def fill_fee_waiver_details(v: hp.HPActionVariables, fwd: FeeWaiverDetails) -> None:
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


def user_to_hpactionvars(user: JustfixUser) -> hp.HPActionVariables:
    v = hp.HPActionVariables()

    # TODO: The HP Action form actually has a field for home phone
    # and a separate one for work; it's unclear which one the
    # user may have provided, but we'll assume it's home for now.
    v.tenant_phone_home_te = user.formatted_phone_number()

    v.server_name_full_te = user.full_name
    v.server_name_full_management_company_te = user.full_name
    v.server_name_full_hpd_te = user.full_name
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
    # Note also that we're implying fee waiver
    # now even though we don't collect information from the
    # user about it; this is because,
    # until we explicitly add support for it, we want users
    # to have the forms for it at least available in
    # the generated PDF just in case they end up wanting
    # to pursue it.
    v.action_type_ms = [
        hp.ActionTypeMS.REPAIRS,
        hp.ActionTypeMS.FEE_WAIVER,
    ]
    v.sue_for_repairs_tf = True
    v.request_fee_waiver_tf = True
    v.sue_for_harassment_tf = False

    # We're only serving New Yorkers at the moment...
    v.tenant_address_state_mc = hp.TenantAddressStateMC.NEW_YORK

    # For now we're going to say the problem is not urgent, as this
    # will generate the HPD inspection forms.
    v.problem_is_urgent_tf = False

    fill_landlord_info(v, user)

    if hasattr(user, 'onboarding_info'):
        oinfo = user.onboarding_info
        v.tenant_address_apt_no_te = oinfo.apt_number
        v.tenant_address_city_te = oinfo.city
        v.tenant_address_zip_te = oinfo.zipcode
        v.tenant_address_street_te = oinfo.address
        v.tenant_borough_mc = BOROUGHS[oinfo.borough]
        v.court_location_mc = COURT_LOCATIONS[oinfo.borough]
        v.court_county_mc = COURT_COUNTIES[oinfo.borough]

        full_addr = ', '.join(oinfo.address_lines_for_mailing)
        v.server_address_full_hpd_te = full_addr
        v.server_address_full_te = full_addr
        v.server_address_full_management_company_te = full_addr

    for issue in user.issues.all():
        desc = ISSUE_CHOICES.get_label(issue.value)
        v.tenant_complaints_list.append(create_complaint(issue.area, desc))

    for cissue in user.custom_issues.all():
        v.tenant_complaints_list.append(create_complaint(cissue.area, cissue.description))

    if hasattr(user, 'fee_waiver_details'):
        fill_fee_waiver_details(v, user.fee_waiver_details)

    return v

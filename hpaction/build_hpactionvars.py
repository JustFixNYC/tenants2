from typing import Dict

from users.models import JustfixUser
from onboarding.models import BOROUGH_CHOICES
from issues.models import ISSUE_AREA_CHOICES, ISSUE_CHOICES
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
    return ISSUE_AREA_CHOICES.get_enum_member(area)


def create_complaint(area: str, description: str) -> hp.TenantComplaints:
    return hp.TenantComplaints(
        area_complained_of_mc=justfix_issue_area_to_hp_area(area),
        which_room_mc=justfix_issue_area_to_hp_room(area),
        conditions_complained_of_te=description
    )


def user_to_hpactionvars(user: JustfixUser) -> hp.HPActionVariables:
    v = hp.HPActionVariables()

    v.server_name_full_te = user.full_name
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
    # Note also that we're implying fee waiver and harassment
    # now even though we don't collect information from the
    # user about these particular actions; this is because,
    # until we explicitly add support for them, we want users
    # to have the forms for the actions at least available in
    # the generated PDF just in case they end up wanting
    # to pursue them.
    v.action_type_ms = [
        hp.ActionTypeMS.REPAIRS,
        hp.ActionTypeMS.FEE_WAIVER,
        hp.ActionTypeMS.HARASSMENT
    ]
    v.sue_for_repairs_tf = True
    v.request_fee_waiver_tf = True
    v.sue_for_harassment_tf = True

    # We're only serving New Yorkers at the moment...
    v.tenant_address_state_mc = hp.TenantAddressStateMC.NEW_YORK

    # For now we're going to say the problem is not urgent, as this
    # will generate the HPD inspection forms.
    v.problem_is_urgent_tf = False

    if hasattr(user, 'landlord_details'):
        ld = user.landlord_details
        v.landlord_entity_name_te = ld.name
        v.served_person_te = ld.name
        v.service_address_full_te = ld.address

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

    for issue in user.issues.all():
        desc = ISSUE_CHOICES.get_label(issue.value)
        v.tenant_complaints_list.append(create_complaint(issue.area, desc))

    for cissue in user.custom_issues.all():
        v.tenant_complaints_list.append(create_complaint(cissue.area, cissue.description))

    return v

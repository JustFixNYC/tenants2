from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LandlordDetailsFactory
from issues.models import Issue, CustomIssue, ISSUE_AREA_CHOICES, ISSUE_CHOICES
from hpaction.build_hpactionvars import user_to_hpactionvars
import hpaction.hpactionvars as hp


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
    assert v.court_location_mc == hp.CourtLocationMC.KINGS
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


def test_user_to_hpactionvars_populates_landlord_info(db):
    ld = LandlordDetailsFactory(name="Landlordo Calrissian")
    v = user_to_hpactionvars(ld.user)
    assert v.landlord_entity_name_te == "Landlordo Calrissian"
    v.to_answer_set()

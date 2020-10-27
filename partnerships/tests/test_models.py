from partnerships.models import PartnerOrg
from .factories import PartnerOrgFactory


def test_str_works_on_uninitialized_models():
    p = PartnerOrg()
    assert str(p) == "PartnerOrg object (None)"


def test_str_works():
    p = PartnerOrgFactory.build()
    assert str(p) == "Justice for All Coalition (j4ac)"

from pathlib import Path
import json
from django.core.management import call_command

from rh.tests.factories import RentalHistoryRequestFactory
from loc.tests.factories import LetterRequestFactory
from hpaction.tests.factories import DocusignEnvelopeFactory
from dwh.models import (
    OnlineRentHistoryRequest,
    LetterOfComplaintRequest,
    EmergencyHPASigning,
)
from dwh.management.commands.etl import Flow, NodeDesc

MY_DIR = Path(__file__).parent.resolve()

FLOWS_DIR = MY_DIR / "rapidpro_flows"


def test_it_does_not_explode(db, django_file_storage):
    rhr = RentalHistoryRequestFactory.create()
    LetterRequestFactory.create(user=rhr.user)
    DocusignEnvelopeFactory.create(
        docs__user=rhr.user,
        status="SIGNED",
    )
    call_command('etl', '--skip-rapidpro-runs')
    assert OnlineRentHistoryRequest.objects.all().count() == 1
    assert LetterOfComplaintRequest.objects.all().count() == 1
    assert EmergencyHPASigning.objects.all().count() == 1


class TestFlow:
    def get_flow(self, filename):
        flow_dict = json.loads((FLOWS_DIR / filename).read_text())['flows'][0]
        return Flow(flow_dict, f'file:///{filename}')

    def test_it_works_with_old_schema(self):
        flow = self.get_flow("dhcr_followup_1_old_schema.json")
        assert flow.name == "DHCR Rental History Follow Up #1"
        assert flow.uuid == "be922331-eb0b-4823-86d2-647dc5a014e3"
        assert flow.find_node_uuids(NodeDesc(r"^That’s great")) == [
            "fa540b3a-626e-4546-82bd-bc937023ebe2"
        ]
        assert flow.find_node_uuids(NodeDesc(r"^No worries")) == [
            "b7a52eb8-0f84-478a-8933-7461578861f5"
        ]

    def test_it_works_with_new_schema(self):
        flow = self.get_flow("dhcr_flow_new_schema.json")
        assert flow.name == "DHCR flow"
        assert flow.uuid == "367fb415-29bd-4d98-8e42-40cba0dc8a97"

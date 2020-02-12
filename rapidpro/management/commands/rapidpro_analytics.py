from typing import List, Dict, Any, Iterator, NamedTuple, Optional
import re
from django.core.management.base import BaseCommand
from temba_client.v2 import TembaClient, Run

from .syncrapidpro import (
    ensure_rapidpro_is_configured,
    get_rapidpro_client
)


RH_UUID = "367fb415-29bd-4d98-8e42-40cba0dc8a97"

RH_FOLLOWUP_1_UUID = "be922331-eb0b-4823-86d2-647dc5a014e3"

RH_FOLLOWUP_2_UUID = "52c3d0fc-d198-45d1-86be-c6fed577ad3a"


class NodeDesc(NamedTuple):
    regex: str
    expected: int = 1


class Flow:
    _f: Dict[str, Any]
    uuid: str
    name: str

    def __init__(self, flow: Dict[str, Any]):
        self._f = flow
        self.uuid = flow['metadata']['uuid']
        self.name = flow['metadata']['name']

    @staticmethod
    def from_uuids(client: TembaClient, uuids: List[str]) -> List['Flow']:
        flows_by_uuid: Dict[str, Flow] = {}
        defns = client.get_definitions(flows=uuids).flows
        for flow_defn in defns:
            flow = Flow(flow_defn)
            flows_by_uuid[flow.uuid] = flow
        result: List[Flow] = []
        for uuid in uuids:
            result.append(flows_by_uuid[uuid])
        return result

    def find_all_node_uuids(self, descs: List[NodeDesc]) -> List[str]:
        uuids: List[str] = []
        for desc in descs:
            uuids.extend(self.find_node_uuids(desc))
        return uuids

    def find_node_uuids(self, desc: NodeDesc) -> List[str]:
        pattern = re.compile(desc.regex)
        uuids: List[str] = []
        for action_set in self._f['action_sets']:
            uuid = action_set['uuid']
            for action in action_set['actions']:
                if action['type'] != 'reply':
                    continue
                msg = action['msg']
                if pattern.match(msg['base']):
                    uuids.append(uuid)
                    break
        if len(uuids) != desc.expected:
            raise ValueError(
                f'Expected to find {desc.expected} node(s) matching pattern "{desc.regex}" '
                f'in flow {self.url}, but found {len(uuids)}!'
            )
        return uuids

    @property
    def url(self) -> str:
        return f"https://textit.in/flow/editor/{self.uuid}/"

    def iter_runs(self, client: TembaClient) -> Iterator[Run]:
        run_batches = client.get_runs(flow=self.uuid).iterfetches(retry_on_rate_exceed=True)
        for run_batch in run_batches:
            for run in run_batch:
                yield run


class AnalyticsLogger:
    def __init__(self, client: TembaClient):
        self.client = client

    def log_run(self, flow: Flow, run: Run, **extra):
        user_id = run.contact.uuid
        timestamp = run.created_on
        num_steps = len(run.path)
        exit_type = run.exit_type
        print(f"{timestamp.date()} user={user_id[:8]} steps={num_steps} exit={exit_type} "
              f" {flow.name} {extra}")

    def process_rh_requests(self, flow: Flow, error_nodes=List[NodeDesc]):
        error_uuids = flow.find_all_node_uuids(error_nodes)
        for run in flow.iter_runs(self.client):
            errors = 0
            for step in run.path:
                if step.node in error_uuids:
                    errors += 1
            self.log_run(flow, run, num_errors=errors)

    def process_rh_followups(self, flow: Flow, yes_nodes=NodeDesc, no_nodes=NodeDesc):
        yes_uuids = flow.find_node_uuids(yes_nodes)
        no_uuids = flow.find_node_uuids(no_nodes)
        for run in flow.iter_runs(self.client):
            rh_received: Optional[bool] = None
            for step in run.path:
                if step.node in yes_uuids:
                    assert rh_received is None or rh_received is True
                    rh_received = True
                elif step.node in no_uuids:
                    assert rh_received is None or rh_received is False
                    rh_received = False
            self.log_run(flow, run, rh_received=rh_received)


class Command(BaseCommand):
    help = "Get RapidPro analytics."

    def handle(self, *args, **options):
        ensure_rapidpro_is_configured()

        client = get_rapidpro_client()
        analytics = AnalyticsLogger(client)
        rh, rhf1, rhf2 = Flow.from_uuids(client, [
            RH_UUID,
            RH_FOLLOWUP_1_UUID,
            RH_FOLLOWUP_2_UUID
        ])

        analytics.process_rh_requests(
            rh,
            error_nodes=[
                NodeDesc(r"^Sorry", expected=2),
                NodeDesc(r"^Oops", expected=1),
            ]
        )

        analytics.process_rh_followups(
            rhf1,
            yes_nodes=NodeDesc(r"^That’s great"),
            no_nodes=NodeDesc(r"^No worries"),
        )

        analytics.process_rh_followups(
            rhf2,
            yes_nodes=NodeDesc(r"^That’s great", 1),
            no_nodes=NodeDesc(r"^We're sorry to hear", 1),
        )

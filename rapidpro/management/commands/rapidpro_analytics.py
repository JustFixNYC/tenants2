from typing import List, Dict, Any, Iterator, NamedTuple
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


def process_rh_followups(client: TembaClient, flow: Flow, yes_nodes=NodeDesc, no_nodes=NodeDesc):
    yes_uuids = flow.find_node_uuids(yes_nodes)
    no_uuids = flow.find_node_uuids(no_nodes)
    for run in flow.iter_runs(client):
        exited = False
        for step in run.path:
            date = step.time.date()
            preamble = f"{date} {flow.name}:"
            if step.node in yes_uuids:
                print(f"{preamble} RH RECEIVED")
                exited = True
            elif step.node in no_uuids:
                print(f"{preamble} RH NOT RECEIVED")
                exited = True
        if not exited:
            print(f"{date} {flow.name}: {run.exit_type}")


class Command(BaseCommand):
    help = "Get RapidPro analytics."

    def handle(self, *args, **options):
        ensure_rapidpro_is_configured()
        client = get_rapidpro_client()
        rh, rhf1, rhf2 = Flow.from_uuids(client, [
            RH_UUID,
            RH_FOLLOWUP_1_UUID,
            RH_FOLLOWUP_2_UUID
        ])

        process_rh_followups(
            client,
            rhf1,
            yes_nodes=NodeDesc(r"^That’s great"),
            no_nodes=NodeDesc(r"^No worries"),
        )

        process_rh_followups(
            client,
            rhf2,
            yes_nodes=NodeDesc(r"^That’s great", 1),
            no_nodes=NodeDesc(r"^We're sorry to hear", 1),
        )

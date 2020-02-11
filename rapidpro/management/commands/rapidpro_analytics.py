from typing import List, Dict, Any, Pattern, Iterator
import re
from django.core.management.base import BaseCommand
from temba_client.v2 import TembaClient, Run

from .syncrapidpro import (
    ensure_rapidpro_is_configured,
    get_rapidpro_client
)


RH_FOLLOWUP_1_UUID = "be922331-eb0b-4823-86d2-647dc5a014e3"

RH_FOLLOWUP_2_UUID = "52c3d0fc-d198-45d1-86be-c6fed577ad3a"

# ERROR_RE = re.compile(r'^Sorry, we didn\'t understand that')
RH_RECEIVED_RE = re.compile(r"^That’s great")

RH1_NOT_RECEIVED_RE = re.compile(r"^No worries")

RH2_NOT_RECEIVED_RE = re.compile(r"^We're sorry to hear")

Flow = Dict[str, Any]


def get_flow_defns(client: TembaClient, uuids: List[str]) -> List[Flow]:
    flows_by_uuid: Dict[str, Any] = {}
    defns = client.get_definitions(flows=uuids).flows
    for flow in defns:
        flows_by_uuid[flow['metadata']['uuid']] = flow
    result: List[Flow] = []
    for uuid in uuids:
        result.append(flows_by_uuid[uuid])
    return result


def find_flow_node_uuids(flow: Flow, pattern: Pattern, expected: int) -> List[str]:
    uuids: List[str] = []
    for action_set in flow['action_sets']:
        uuid = action_set['uuid']
        for action in action_set['actions']:
            if action['type'] != 'reply':
                continue
            msg = action['msg']
            if pattern.match(msg['base']):
                uuids.append(uuid)
                break
    flow_uuid = flow['metadata']['uuid']
    if len(uuids) != expected:
        raise ValueError(
            f'Expected to find {expected} node(s) matching pattern {pattern} '
            f'in flow https://textit.in/flow/editor/{flow_uuid}/, but found {len(uuids)}!'
        )
    return uuids


def iter_runs(client: TembaClient, flow: Flow) -> Iterator[Run]:
    uuid = flow['metadata']['uuid']
    run_batches = client.get_runs(flow=uuid).iterfetches(retry_on_rate_exceed=True)
    for run_batch in run_batches:
        for run in run_batch:
            yield run


def process_rh_followups(
    client: TembaClient,
    number: int,
    flow: Flow,
    yes_uuids=List[str],
    no_uuids=List[str]
):
    name = f"RH FOLLOWUP #{number}"
    for run in iter_runs(client, flow):
        exited = False
        for step in run.path:
            date = step.time.date()
            preamble = f"{date} {name}:"
            if step.node in yes_uuids:
                print(f"{preamble} RH RECEIVED")
                exited = True
            elif step.node in no_uuids:
                print(f"{preamble} RH NOT RECEIVED")
                exited = True
        if not exited:
            print(f"{date} {name}: {run.exit_type}")


class Command(BaseCommand):
    help = "Get RapidPro analytics."

    def handle(self, *args, **options):
        ensure_rapidpro_is_configured()
        client = get_rapidpro_client()
        rhf1, rhf2 = get_flow_defns(client, [
            RH_FOLLOWUP_1_UUID,
            RH_FOLLOWUP_2_UUID
        ])

        process_rh_followups(
            client,
            1,
            rhf1,
            yes_uuids=find_flow_node_uuids(rhf1, RH_RECEIVED_RE, 1),
            no_uuids=find_flow_node_uuids(rhf1, RH1_NOT_RECEIVED_RE, 1),
        )

        process_rh_followups(
            client,
            2,
            rhf2,
            yes_uuids=find_flow_node_uuids(rhf2, RH_RECEIVED_RE, 1),
            no_uuids=find_flow_node_uuids(rhf2, RH2_NOT_RECEIVED_RE, 1),
        )

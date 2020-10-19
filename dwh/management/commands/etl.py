from typing import List, Dict, Any, Iterator, NamedTuple, Optional, Pattern
from pathlib import Path
import re
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings
from django.db import connections, connection
from temba_client.v2 import TembaClient, Run

from rapidpro import rapidpro_util
from dwh import models
from dwh.util import uuid_from_url, BatchWriter, iter_cursor_dicts
from hpaction.models import DocusignEnvelope, HP_DOCUSIGN_STATUS_CHOICES


# The rent history request flow.
RH_URL = "https://textit.in/flow/editor/367fb415-29bd-4d98-8e42-40cba0dc8a97/"

# The first rent history follow-up.
RH_FOLLOWUP_1_URL = "https://textit.in/flow/editor/be922331-eb0b-4823-86d2-647dc5a014e3/"

# The second rent history follow-up.
RH_FOLLOWUP_2_URL = "https://textit.in/flow/editor/52c3d0fc-d198-45d1-86be-c6fed577ad3a/"

# URLs for individual groups that users are put in based on their responses to LOC follow-up flows.
LOC_GROUP_URLS = {
    'll_responding': 'https://textit.in/contact/filter/0bec29ac-14e2-4a9f-a928-fe1a9392924d/',
    'll_not_responding': 'https://textit.in/contact/filter/0f362cdc-53f6-41d0-b534-252f099c3695/', # noqa
    'll_retaliation': 'https://textit.in/contact/filter/6c53aaad-24d6-4c35-98ab-fe8db55e93aa/',
    'got_results': "https://textit.in/contact/filter/80302300-7dd8-49bd-9f72-e4d481ed83b5/",
    'interested_in_hp': "https://textit.in/contact/filter/846c2eb8-45e8-48c5-b130-02c53be1aece/",
}

# The maximum amount of days that can pass between when a user requests their
# rent history, and when we follow-up with them.
RH_MAX_FOLLOWUP_DAYS = 25

MY_DIR = Path(__file__).parent.resolve()

APP_DIR = MY_DIR / ".." / ".."

RHBOT_SQLFILE = APP_DIR / "rhbot.sql"

RHONLINE_SQLFILE = APP_DIR / "rhonline.sql"

LOC_SQLFILE = APP_DIR / "loc.sql"


class NodeDesc(NamedTuple):
    regex: str
    expected: int = 1


def is_v13_flow_schema(flow: Dict[str, Any]) -> bool:
    # From Nyaruka tech support:
    # > If you want to fix that script to work for newer definitions
    # > (version "13" onwards), you could look to see if there's a
    # > top-level property in the definition called nodes - each
    # > node has actions and one type of action is a msg_created
    # > action which has a text property.
    return 'nodes' in flow


def get_flow_uuid(flow: Dict[str, Any]) -> str:
    if is_v13_flow_schema(flow):
        return flow['uuid']
    return flow['metadata']['uuid']


def get_flow_name(flow: Dict[str, Any]) -> str:
    if is_v13_flow_schema(flow):
        return flow['name']
    return flow['metadata']['name']


class Flow:
    def __init__(self, flow: Dict[str, Any], url: str):
        self._f = flow
        self.uuid = get_flow_uuid(flow)
        self.name = get_flow_name(flow)
        self.url = url

    @staticmethod
    def from_urls(client: TembaClient, urls: List[str]) -> List['Flow']:
        uuids = [uuid_from_url(url) for url in urls]
        flows_by_uuid: Dict[str, Flow] = {}
        defns = client.get_definitions(flows=uuids, dependencies="none").flows
        for flow_defn in defns:
            url = [url for url in urls if uuid_from_url(url) == get_flow_uuid(flow_defn)][0]
            flow = Flow(flow_defn, url)
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

    def __iter_node_uuids_old_schema(self, pattern: Pattern, desc: NodeDesc) -> Iterator[str]:
        for action_set in self._f['action_sets']:
            uuid = action_set['uuid']
            for action in action_set['actions']:
                if action['type'] != 'reply':
                    continue
                msg = action['msg']
                if pattern.match(msg['base']):
                    yield uuid
                    break

    def __iter_node_uuids_v13_schema(self, pattern: Pattern, desc: NodeDesc) -> Iterator[str]:
        for action_set in self._f['nodes']:
            uuid = action_set['uuid']
            # As of mid-October 2020, it seems not all nodes necessarily
            # have 'actions' properties, e.g. for nodes of type=switch,
            # so we'll default to an empty list if it's not present.
            for action in action_set.get('actions', []):
                if action['type'] != 'send_msg':
                    continue
                if pattern.match(action['text']):
                    yield uuid
                    break

    def find_node_uuids(self, desc: NodeDesc) -> List[str]:
        pattern = re.compile(desc.regex)
        if is_v13_flow_schema(self._f):
            uuids = list(self.__iter_node_uuids_v13_schema(pattern, desc))
        else:
            uuids = list(self.__iter_node_uuids_old_schema(pattern, desc))
        if len(uuids) != desc.expected:
            raise ValueError(
                f'Expected to find {desc.expected} node(s) matching pattern "{desc.regex}" '
                f'in flow {self.url}, but found {len(uuids)}!'
            )
        return uuids

    def iter_exited_runs(self, client: TembaClient) -> Iterator[Run]:
        print(f"Processing exited runs of flow '{self.name}'.")
        run_batches = client.get_runs(flow=self.uuid).iterfetches(retry_on_rate_exceed=True)
        for run_batch in run_batches:
            for run in run_batch:
                if run.exit_type:
                    yield run


class AnalyticsLogger:
    BATCH_SIZE = 1000

    def __init__(self, client: TembaClient):
        self.client = client
        self.writer = BatchWriter(models.RapidproRun)

    def log_run(
        self,
        flow: Flow,
        run: Run,
        num_error_steps: Optional[int] = None,
        was_rent_history_received: Optional[bool] = None,
    ):
        run = models.RapidproRun(
            flow_uuid=flow.uuid,
            flow_name=flow.name,
            user_uuid=run.contact.uuid,
            start_time=run.created_on,
            end_time=run.exited_on,
            num_steps=len(run.path),
            exit_type=run.exit_type,
            num_error_steps=num_error_steps,
            was_rent_history_received=was_rent_history_received,
        )
        self.writer.write(run)

    def process_rh_requests(self, flow: Flow, error_nodes=List[NodeDesc]):
        error_uuids = flow.find_all_node_uuids(error_nodes)
        for run in flow.iter_exited_runs(self.client):
            errors = 0
            for step in run.path:
                if step.node in error_uuids:
                    errors += 1
            self.log_run(flow, run, num_error_steps=errors)

    def process_rh_followups(self, flow: Flow, yes_nodes=NodeDesc, no_nodes=NodeDesc):
        yes_uuids = flow.find_node_uuids(yes_nodes)
        no_uuids = flow.find_node_uuids(no_nodes)
        for run in flow.iter_exited_runs(self.client):
            rh_received: Optional[bool] = None
            for step in run.path:
                if step.node in yes_uuids:
                    assert rh_received is None or rh_received is True
                    rh_received = True
                elif step.node in no_uuids:
                    assert rh_received is None or rh_received is False
                    rh_received = False
            self.log_run(flow, run, was_rent_history_received=rh_received)


class Command(BaseCommand):
    help = "Extract, Transform and Load (ETL) data into the data warehouse db."

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-rapidpro-runs',
            help="Don't process RapidPro runs.",
            action='store_true'
        )
        parser.add_argument(
            '--skip-online-rent-history',
            help="Don't process online rent history requests.",
            action='store_true'
        )
        parser.add_argument(
            '--skip-loc',
            help="Don't process Letter of Complaint requests.",
            action="store_true",
        )
        parser.add_argument(
            '--skip-ehpa',
            help="Don't process Emergency HP Action signings.",
            action="store_true",
        )

    def create_views(self):
        base_args: Dict[str, Any] = {
            'rh_followup_1_uuid': uuid_from_url(RH_FOLLOWUP_1_URL),
            'rh_followup_2_uuid': uuid_from_url(RH_FOLLOWUP_2_URL),
            'rh_max_followup_days': RH_MAX_FOLLOWUP_DAYS,
        }
        with connections[settings.DWH_DATABASE].cursor() as cursor:
            cursor.execute(RHBOT_SQLFILE.read_text(), {
                'rh_uuid': uuid_from_url(RH_URL),
                **base_args,
            })
            cursor.execute(RHONLINE_SQLFILE.read_text(), base_args)

    def load_rapidpro_runs(self):
        client = rapidpro_util.get_client_from_settings()

        if client is None:
            print("RapidPro is not configured, skipping RapidproRun ETL.")
            return

        analytics = AnalyticsLogger(client)
        rh, rhf1, rhf2 = Flow.from_urls(client, [
            RH_URL,
            RH_FOLLOWUP_1_URL,
            RH_FOLLOWUP_2_URL,
        ])

        with analytics.writer.atomic_transaction(using=settings.DWH_DATABASE, wipe=True):
            analytics.process_rh_requests(
                rh,
                error_nodes=[
                    NodeDesc(r"^Sorry", expected=2),
                    NodeDesc(r"^Oops"),
                ]
            )

            analytics.process_rh_followups(
                rhf1,
                yes_nodes=NodeDesc(r"^That’s great"),
                no_nodes=NodeDesc(r"^No worries"),
            )

            analytics.process_rh_followups(
                rhf2,
                yes_nodes=NodeDesc(r"^That’s great"),
                no_nodes=NodeDesc(r"^We're sorry to hear"),
            )

    def load_online_rent_history_requests(self):
        print("Processing online rent history requests.")
        writer = BatchWriter(models.OnlineRentHistoryRequest)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT rh.created_at, rapidpro_contact.uuid AS user_uuid
                FROM rh_rentalhistoryrequest AS rh
                LEFT JOIN rapidpro_contact ON rh.phone_number = rapidpro_contact.phone_number
                """
            )
            with writer.atomic_transaction(using=settings.DWH_DATABASE, wipe=True):
                for row_dict in iter_cursor_dicts(cursor):
                    req = models.OnlineRentHistoryRequest(**row_dict)
                    writer.write(req)

    def load_loc_requests(self):
        print("Processing letter of complaint requests.")
        writer = BatchWriter(models.LetterOfComplaintRequest)
        kwargs = {
            f"{name}_uuid": uuid_from_url(url) for (name, url) in LOC_GROUP_URLS.items()
        }
        with connection.cursor() as cursor:
            cursor.execute(LOC_SQLFILE.read_text(), kwargs)
            with writer.atomic_transaction(using=settings.DWH_DATABASE, wipe=True):
                for row_dict in iter_cursor_dicts(cursor):
                    req = models.LetterOfComplaintRequest(**row_dict)
                    writer.write(req)

    def load_ehpa_signings(self):
        print("Processing EHPA signings.")
        writer = BatchWriter(models.EmergencyHPASigning)
        signings = DocusignEnvelope.objects.filter(
            status=HP_DOCUSIGN_STATUS_CHOICES.SIGNED,
        )
        with writer.atomic_transaction(using=settings.DWH_DATABASE, wipe=True):
            for signing in signings:
                writer.write(models.EmergencyHPASigning(
                    created_at=signing.created_at
                ))

    def handle(self, *args, **options):
        skip_online_rent_history: bool = options['skip_online_rent_history']
        skip_rapidpro_runs: bool = options['skip_rapidpro_runs']
        skip_loc: bool = options['skip_loc']
        skip_ehpa: bool = options['skip_ehpa']

        if settings.DWH_DATABASE != 'default':
            call_command("migrate", "dwh", f"--database={settings.DWH_DATABASE}")

        self.create_views()

        if not skip_loc:
            self.load_loc_requests()

        if not skip_online_rent_history:
            self.load_online_rent_history_requests()

        if not skip_rapidpro_runs:
            self.load_rapidpro_runs()

        if not skip_ehpa:
            self.load_ehpa_signings()

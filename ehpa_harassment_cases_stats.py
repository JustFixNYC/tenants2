import json
from typing import Counter
from pathlib import Path
import textwrap


DATAFILE = Path('ehpa_harassment_cases.json')


DESCRIPTIONS = {
    "alleg_force": "used force or threatened to use force",
    "alleg_misleading_info": "lied about the occupancy or rent status of your apartment",
    "alleg_stopped_service": "interrupted or stopped essential services repeatedly",
    "alleg_failed_to_comply": "has not made required repairs even though HPD has already filed violations",  # noqa
    "alleg_false_cert_repairs": "lied about making required repairs",
    "alleg_conduct_in_violation": "done construction without a permit from the Department of Buildings",  # noqa
    "alleg_sued": "brought court cases for no good reason.",
    "alleg_removed_possessions": "removed your belongings, the front door, or locked you out of your apartment",  # noqa
    "alleg_induced_leaving": "made buyout offers while threatening you *or* cursed or used profane language to intimidate you *or* knowingly lied to you *or* contacted your job without your permission",  # noqa
    "alleg_contact": "repeatedly contacted or visited you outside of business hours",
    "alleg_threats_re_status": "threatened you based on your age; race; creed; color; national origin; gender; disability; marital or partnership status; caregiver status; uniformed service; sexual orientation; citizenship status; status as a victim of domestic violence, sex offenses, or stalking; lawful source of income; or because you have children",  # noqa
    "alleg_requested_id": "asked for documents that would reveal citizenship status when they already have your government-issued ID",  # noqa
    "alleg_disturbed": "repeatedly disturbed your comfort, peace, or quiet *or* made it such that you had to get or stop medical treatment",  # noqa
}


def load_datafile():
    return json.loads(DATAFILE.read_text())


def print_counters(counters, min_value: int = 1):
    items = list(counters.items())
    items.sort(key=lambda x: x[1])
    items.reverse()
    for item, count in items:
        if count >= min_value:
            wrapped_item = '\n'.join(textwrap.wrap(item, width=50, subsequent_indent='      '))
            print(f"{count:<5} {wrapped_item}")


def main():
    cases = load_datafile()
    print(f"Total harassment forms generated: {len(cases)}\n")

    counters = Counter[str]()
    for case in cases:
        for key in case.keys():
            if key.startswith("alleg_") and case[key] is True:
                desc = DESCRIPTIONS[key]
                counters[desc] += 1
    print_counters(counters)


if __name__ == '__main__':
    main()

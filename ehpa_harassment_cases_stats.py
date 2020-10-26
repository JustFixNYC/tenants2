import json
from typing import Counter
from pathlib import Path


DATAFILE = Path('ehpa_harassment_cases.json')


def load_datafile():
    return json.loads(DATAFILE.read_text())


def print_counters(counters, min_value: int = 1):
    items = list(counters.items())
    items.sort(key=lambda x: x[1])
    items.reverse()
    for item, count in items:
        if count >= min_value:
            print(f"{item:40} {count}")


def main():
    cases = load_datafile()
    print(f"Total harassment forms generated: {len(cases)}\n")

    counters = Counter[str]()
    for case in cases:
        for key in case.keys():
            if key.startswith("alleg_") and case[key] is True:
                counters[key] += 1
    print_counters(counters)


if __name__ == '__main__':
    main()

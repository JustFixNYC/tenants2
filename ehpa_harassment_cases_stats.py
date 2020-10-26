import json
from typing import Counter
from pathlib import Path


DATAFILE = Path('ehpa_harassment_cases.json')


def main():
    cases = json.loads(DATAFILE.read_text())
    print(f"Total harassment forms generated: {len(cases)}\n")

    counters = Counter[str]()
    for case in cases:
        for key in case.keys():
            if key.startswith("alleg_") and case[key] is True:
                counters[key] += 1
    items = list(counters.items())

    items.sort(key=lambda x: x[1])
    items.reverse()
    for item, count in items:
        print(f"{item:40} {count}")


if __name__ == '__main__':
    main()

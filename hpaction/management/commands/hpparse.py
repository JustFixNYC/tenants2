import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import NamedTuple, List, Dict
from django.core.management.base import BaseCommand

from project.justfix_environment import BASE_DIR


MASTER_CMP_PATH = BASE_DIR / 'hpaction' / 'hotdocs-data' / 'Master.cmp'

HD_URL = 'http://www.hotdocs.com/schemas/component_library/2009'

HD = '{' + HD_URL + '}'

NS = {'hd': HD_URL}


@dataclass
class HDVariable:
    name: str
    help_text: str

    def describe(self):
        return f"{self.__class__.__name__} {repr(self.name)}"


class HDDate(HDVariable):
    pass


class HDText(HDVariable):
    pass


class HDBoolean(HDVariable):
    pass


class HDNumber(HDVariable):
    pass


class HDOption(NamedTuple):
    name: str
    label: str


@dataclass
class HDMultipleChoice(HDVariable):
    options: List[HDOption]
    select_multiple: bool

    def describe(self):
        base_desc = super().describe()
        if self.select_multiple:
            return f"{base_desc} select_multiple"
        return base_desc


class HDVars:
    d: Dict[str, HDVariable]

    def __init__(self):
        self.d = {}

    def append(self, var: HDVariable):
        self.d[var.name] = var


class HDRepeat(NamedTuple):
    name: str
    variables: List[HDVariable]


def get_help_text(el: ET.Element) -> str:
    # Absolutely no idea why el.find() doesn't work here.
    for prompt in el.findall('hd:prompt', NS):
        if prompt.text:
            return prompt.text
    return ''


def get_mc_options(el: ET.Element) -> List[HDOption]:
    results: List[HDOption] = []
    for option in el.findall('hd:options/hd:option', NS):
        results.append(HDOption(
            name=option.attrib['name'],
            label=get_help_text(option)
        ))
    return results


def get_hd_repeats(components: ET.Element, hd_vars: HDVars) -> List[HDRepeat]:
    result: List[HDRepeat] = []
    for dialog in components.iter(f'{HD}dialog'):
        is_sheet = len(dialog.findall('hd:style/hd:spreadsheetOnParent', NS)) > 0
        if not is_sheet:
            continue
        repeat_vars: List[HDVariable] = []
        for item in dialog.findall('hd:contents/hd:item', NS):
            name = item.attrib['name']
            value = hd_vars.d[name]
            del hd_vars.d[name]
            repeat_vars.append(value)
        result.append(HDRepeat(
            name=dialog.attrib['name'],
            variables=repeat_vars
        ))
    return result


def get_hd_vars(components: ET.Element) -> HDVars:
    hd_vars = HDVars()
    for el in components.findall('hd:text', NS):
        hd_vars.append(HDText(
            name=el.attrib['name'],
            help_text=get_help_text(el)
        ))
    for el in components.findall('hd:date', NS):
        hd_vars.append(HDDate(
            name=el.attrib['name'],
            help_text=get_help_text(el)
        ))
    for el in components.findall('hd:number', NS):
        hd_vars.append(HDNumber(
            name=el.attrib['name'],
            help_text=get_help_text(el)
        ))
    for el in components.findall('hd:trueFalse', NS):
        hd_vars.append(HDBoolean(
            name=el.attrib['name'],
            help_text=get_help_text(el)
        ))
    for el in components.findall('hd:multipleChoice', NS):
        sm = len(el.findall('hd:multipleSelection', NS)) > 0
        hd_vars.append(HDMultipleChoice(
            name=el.attrib['name'],
            help_text=get_help_text(el),
            options=get_mc_options(el),
            select_multiple=sm
        ))
    return hd_vars


class Command(BaseCommand):
    help = f"Parse {MASTER_CMP_PATH.name} and show results."

    def handle(self, *args, **options):
        tree = ET.parse(str(MASTER_CMP_PATH))
        root = tree.getroot()
        components = root.find('hd:components', NS)
        if not components:
            raise Exception('could not find components')
        hd_vars = get_hd_vars(components)
        hd_repeats = get_hd_repeats(components, hd_vars)

        print("## Variables\n")

        for var in hd_vars.d.values():
            print(var.describe())

        print("\n## Repeats")

        for repeat in hd_repeats:
            print()
            print(repeat.name)
            for var in repeat.variables:
                print("  ", var.describe())

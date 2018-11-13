import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import NamedTuple, List, Dict
from pathlib import Path
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


class HDRepeat(NamedTuple):
    name: str
    variables: List[HDVariable]


class HDComponentLibrary:
    vars: Dict[str, HDVariable]
    repeats: List[HDRepeat]

    def __init__(self, path: Path):
        self.vars = {}
        self.repeats = []

        tree = ET.parse(str(path))
        root = tree.getroot()
        components = root.find('hd:components', NS)
        if not components:
            raise Exception('Could not find <hd:components> element')
        self.populate_vars(components)
        self.populate_repeats(components)

    def get_help_text(self, el: ET.Element) -> str:
        # Absolutely no idea why el.find() doesn't work here.
        for prompt in el.findall('hd:prompt', NS):
            if prompt.text:
                return prompt.text
        return ''

    def get_mc_options(self, el: ET.Element) -> List[HDOption]:
        results: List[HDOption] = []
        for option in el.findall('hd:options/hd:option', NS):
            results.append(HDOption(
                name=option.attrib['name'],
                label=self.get_help_text(option)
            ))
        return results

    def populate_repeats(self, components: ET.Element) -> None:
        for dialog in components.iter(f'{HD}dialog'):
            is_sheet = len(dialog.findall('hd:style/hd:spreadsheetOnParent', NS)) > 0
            if not is_sheet:
                continue
            repeat_vars: List[HDVariable] = []
            for item in dialog.findall('hd:contents/hd:item', NS):
                name = item.attrib['name']
                value = self.vars[name]
                del self.vars[name]
                repeat_vars.append(value)
            self.repeats.append(HDRepeat(
                name=dialog.attrib['name'],
                variables=repeat_vars
            ))

    def add_var(self, var: HDVariable) -> None:
        self.vars[var.name] = var

    def populate_vars(self, components: ET.Element) -> None:
        for el in components.findall('hd:text', NS):
            self.add_var(HDText(
                name=el.attrib['name'],
                help_text=self.get_help_text(el)
            ))
        for el in components.findall('hd:date', NS):
            self.add_var(HDDate(
                name=el.attrib['name'],
                help_text=self.get_help_text(el)
            ))
        for el in components.findall('hd:number', NS):
            self.add_var(HDNumber(
                name=el.attrib['name'],
                help_text=self.get_help_text(el)
            ))
        for el in components.findall('hd:trueFalse', NS):
            self.add_var(HDBoolean(
                name=el.attrib['name'],
                help_text=self.get_help_text(el)
            ))
        for el in components.findall('hd:multipleChoice', NS):
            sm = len(el.findall('hd:multipleSelection', NS)) > 0
            self.add_var(HDMultipleChoice(
                name=el.attrib['name'],
                help_text=self.get_help_text(el),
                options=self.get_mc_options(el),
                select_multiple=sm
            ))


class Command(BaseCommand):
    help = f"Parse {MASTER_CMP_PATH.name} and show results."

    def handle(self, *args, **options):
        lib = HDComponentLibrary(MASTER_CMP_PATH)

        print("## Variables\n")

        for var in lib.vars.values():
            print(var.describe())

        print("\n## Repeats")

        for repeat in lib.repeats:
            print()
            print(repeat.name)
            for var in repeat.variables:
                print("  ", var.describe())

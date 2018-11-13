import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import NamedTuple, List
from django.core.management.base import BaseCommand

from project.justfix_environment import BASE_DIR


MASTER_CMP_PATH = BASE_DIR / 'hpaction' / 'hotdocs-data' / 'Master.cmp'

NS = {'hd': 'http://www.hotdocs.com/schemas/component_library/2009'}


@dataclass
class HDVariable:
    name: str
    help_text: str


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


def get_hd_vars(components: ET.Element) -> List[HDVariable]:
    hd_vars: List[HDVariable] = []
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
        for var in hd_vars:
            print(var)

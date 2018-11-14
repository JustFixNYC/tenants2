import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import NamedTuple, List, Dict
from pathlib import Path


HD_URL = 'http://www.hotdocs.com/schemas/component_library/2009'

HD = '{' + HD_URL + '}'

NS = {'hd': HD_URL}


@dataclass
class HDVariable:
    '''
    Represents the definition of a variable in a HotDocs component library.
    '''

    name: str
    help_text: str

    def describe(self):
        return f"{self.__class__.__name__} {repr(self.name)}"


class HDDate(HDVariable):
    pass


class HDText(HDVariable):
    pass


class HDTrueFalse(HDVariable):
    pass


class HDNumber(HDVariable):
    pass


class HDMultipleChoiceOption(NamedTuple):
    name: str
    label: str


@dataclass
class HDMultipleChoice(HDVariable):
    options: List[HDMultipleChoiceOption]
    select_multiple: bool

    def describe(self):
        base_desc = super().describe()
        if self.select_multiple:
            return f"{base_desc} select_multiple"
        return base_desc


class HDRepeatedVariables(NamedTuple):
    '''
    Represents the definition of a structure in a HotDocs
    component library that is ultimately delivered as
    a set of variables with repeated answers in a
    HotDocs Answer Set.

    The Pythonic/OO representation of this is essentially
    a collection of sub-objects off a parent object.
    '''

    label: str
    variables: List[HDVariable]


class HDComponentLibrary:
    '''
    Represents the parts of a HotDocs component library that
    we care about for generating valid HotDocs Answer Sets,
    and contains logic for parsing the information out of
    a HotDocs Component File.

    Unlike the HotDocs Answer Set, the HotDocs Component
    File format doesn't seem to be documented anywhere, so
    the implementation of this class is largely dependent
    on examining the library file we need to use and
    figuring out how it's structured.

    That said, for more information on what a component
    library is, see:

    http://help.hotdocs.com/developer/webhelp/Automating_Text_Templates_1/att1_overview_template_and_component_files.htm
    '''

    # All the "top-level" variables defined by the component library.
    vars: Dict[str, HDVariable]

    # All the repeated variables or "sub-objects" defined by the
    # component library.
    repeated_vars: List[HDRepeatedVariables]

    def __init__(self, path: Path):
        '''
        Parse the given HotDocs Component File (it seems to have a .cmp
        extension).
        '''

        self.vars = {}
        self.repeated_vars = []

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

    def get_mc_options(self, el: ET.Element) -> List[HDMultipleChoiceOption]:
        results: List[HDMultipleChoiceOption] = []
        for option in el.findall('hd:options/hd:option', NS):
            results.append(HDMultipleChoiceOption(
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
            self.repeated_vars.append(HDRepeatedVariables(
                label=dialog.attrib['name'],
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
            self.add_var(HDTrueFalse(
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

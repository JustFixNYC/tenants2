import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import NamedTuple, List, Dict, Tuple, Set
from pathlib import Path
import textwrap
from django.contrib.humanize.templatetags.humanize import apnumber
from django.utils.text import slugify


HD_URL = 'http://www.hotdocs.com/schemas/component_library/2009'

HD = '{' + HD_URL + '}'

NS = {'hd': HD_URL}


def wrap_comment(string: str, indent: int) -> List[str]:
    indent_str = ' ' * indent
    lines = textwrap.wrap(string, width=100 - indent - 2)
    return [f'{indent_str}# {line}' for line in lines]


def to_camel_case(string: str) -> str:
    return ''.join([
        word[0].upper() + word[1:]
        for word in string.split(' ')
    ])


def to_snake_case(string: str) -> str:
    name = slugify(string.lower()).replace('-', '_')
    if name[0].isdigit():
        return apnumber(name[0]) + name[1:]
    return name


@dataclass
class HDVariable:
    '''
    Represents the definition of a variable in a HotDocs component library.
    '''

    name: str
    help_text: str

    def describe(self):
        return f"{self.__class__.__name__} {repr(self.name)}"

    @property
    def snake_case_name(self) -> str:
        return to_snake_case(self.name)

    @property
    def camel_case_name(self) -> str:
        return to_camel_case(self.name)

    @property
    def py_annotation(self) -> str:
        raise NotImplementedError()


class HDDate(HDVariable):
    @property
    def py_annotation(self) -> str:
        return 'datetime.date'


class HDText(HDVariable):
    @property
    def py_annotation(self) -> str:
        return 'str'


class HDTrueFalse(HDVariable):
    @property
    def py_annotation(self) -> str:
        return 'bool'


class HDNumber(HDVariable):
    @property
    def py_annotation(self) -> str:
        return 'Union[str, float]'


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

    @property
    def py_annotation(self) -> str:
        anno = self.camel_case_name
        return f'List[{anno}]' if self.select_multiple else anno


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

    @property
    def py_class_name(self) -> str:
        return to_camel_case(self.label)

    @property
    def py_prop_name(self) -> str:
        return f"{to_snake_case(self.label)}_list"


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

    def __init__(self, path: Path) -> None:
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


class PythonEnumOption(NamedTuple):
    symbol: str
    value: str
    comment: str


class PythonEnum(NamedTuple):
    name: str
    options: Tuple[PythonEnumOption, ...]

    def generate_code(self) -> List[str]:
        lines: List[str] = [
            f'class {self.name}(Enum):'
        ]

        for option in self.options:
            if option.comment:
                lines.extend(wrap_comment(option.comment, indent=4))
            lines.extend([
                f'    {option.symbol} = {repr(option.value)}'
                f''
            ])

        lines.append(f'\n')

        return lines


class PythonAlias(NamedTuple):
    name: str
    alias_for: str

    def generate_code(self) -> str:
        return f'{self.name} = {self.alias_for}\n'


class PythonCodeGenerator:
    lib: HDComponentLibrary
    primary_class_name: str
    imports: List[str]
    enums: List[PythonEnum]
    aliases: List[PythonAlias]
    dataclasses: List[str]

    def __init__(self, lib: HDComponentLibrary, primary_class_name: str) -> None:
        self.lib = lib
        self.primary_class_name = primary_class_name
        self.imports = [
            'from typing import Optional, Union, List',
            'import datetime',
            'from enum import Enum',
            'from dataclasses import dataclass, field',
            'from hpaction.hotdocs import AnswerSet, enum2mc',
            ''
        ]

        self.enums = []
        self.aliases = []
        self.dataclasses = []

        self.process_enum_definitions(list(lib.vars.values()))
        for repeat in self.lib.repeated_vars:
            self.process_enum_definitions(repeat.variables)

        self.coalesce_duplicate_enums()
        for repeat in self.lib.repeated_vars:
            self.make_repeat_dataclass_definition(repeat)
        self.make_primary_dataclass_definition()

    def process_enum_definitions(self, hd_vars: List[HDVariable]):
        mcs = [var for var in hd_vars if isinstance(var, HDMultipleChoice)]
        for mc in mcs:
            self.enums.append(PythonEnum(
                name=mc.camel_case_name,
                options=tuple([
                    PythonEnumOption(
                        symbol=to_snake_case(option.name).upper(),
                        value=option.name,
                        comment=option.label
                    )
                    for option in mc.options
                ])
            ))

    def coalesce_duplicate_enums(self):
        choices: Set[List[PythonEnumOption]] = set()
        enums = tuple(self.enums)
        for enum in enums:
            if enum.options in choices:
                self.enums.remove(enum)
                alias_for = [
                    e for e in enums if e.options == enum.options
                ][0].name
                self.aliases.append(PythonAlias(enum.name, alias_for))
            else:
                choices.add(enum.options)

    def define_base_dataclass(self, class_name: str, hd_vars: List[HDVariable]) -> List[str]:
        lines = [
            f'@dataclass',
            f'class {class_name}:',
        ]

        for var in hd_vars:
            if var.help_text:
                lines.extend(wrap_comment(var.help_text, indent=4))
            lines.append(f'    {var.snake_case_name}: Optional[{var.py_annotation}] = None\n')

        return lines

    def make_repeat_dataclass_definition(self, repeat: HDRepeatedVariables) -> None:
        hd_vars = repeat.variables
        lines = self.define_base_dataclass(repeat.py_class_name, hd_vars)
        self.add_dataclass(lines)

    def define_to_answer_set_method(self, hd_vars: List[HDVariable]) -> List[str]:
        lines = [
            f'    def to_answer_set(self) -> AnswerSet:',
            f'        result = AnswerSet()'
        ]

        for var in hd_vars:
            prop = f'self.{var.snake_case_name}'
            add_arg = f'self.{var.snake_case_name}'
            if isinstance(var, HDMultipleChoice):
                add_arg = f'enum2mc({add_arg})'
            lines.extend([
                f'        if {prop} is not None:',
                f'            result.add({repr(var.name)},',
                f'                       {add_arg})',
            ])

        for repeat in self.lib.repeated_vars:
            lines.extend([
                f'        # TODO: Add values for self.{repeat.py_prop_name}.'
            ])

        lines.append(f'        return result\n')
        return lines

    def make_primary_dataclass_definition(self) -> None:
        class_name = self.primary_class_name
        hd_vars = list(self.lib.vars.values())
        lines = self.define_base_dataclass(class_name, hd_vars)
        for repeat in self.lib.repeated_vars:
            lines.extend([
                f'    {repeat.py_prop_name}: List[{repeat.py_class_name}] = ' +
                'field(default_factory=list)',
                f''
            ])
        lines.extend(self.define_to_answer_set_method(hd_vars))
        self.add_dataclass(lines)

    def add_dataclass(self, lines: List[str]) -> None:
        if self.dataclasses:
            self.dataclasses.append('')
        self.dataclasses.extend(lines)

    def getvalue(self) -> str:
        enums: List[str] = []
        for enum in self.enums:
            enums.extend(enum.generate_code())

        aliases = [alias.generate_code() for alias in self.aliases]

        return '\n'.join([*self.imports, '', *enums, *aliases, '', *self.dataclasses])

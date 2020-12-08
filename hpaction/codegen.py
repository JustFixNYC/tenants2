from typing import Tuple, Set, NamedTuple, List
import textwrap

from .hotdocs_cmp import (
    HDComponentLibrary,
    HDVariable,
    HDMultipleChoice,
    HDRepeatedVariables,
    to_snake_case,
)


def wrap_comment(string: str, indent: int) -> List[str]:
    indent_str = " " * indent
    lines = textwrap.wrap(string, width=100 - indent - 2)
    return [f"{indent_str}# {line}" for line in lines]


class PythonEnumOption(NamedTuple):
    symbol: str
    value: str
    comment: str


class PythonEnum(NamedTuple):
    name: str
    options: Tuple[PythonEnumOption, ...]

    def generate_code(self) -> List[str]:
        lines: List[str] = [f"class {self.name}(Enum):"]

        for option in self.options:
            if option.comment:
                lines.extend(wrap_comment(option.comment, indent=4))
            lines.extend([f"    {option.symbol} = {repr(option.value)}" f""])

        lines.append(f"\n")

        return lines


class PythonAlias(NamedTuple):
    name: str
    alias_for: str

    def generate_code(self) -> str:
        return f"{self.name} = {self.alias_for}\n"


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
            "from typing import Optional, Union, List",
            "from decimal import Decimal",
            "import datetime",
            "from enum import Enum",
            "from dataclasses import dataclass, field",
            "from hpaction.hotdocs import AnswerSet, enum2mc, enum2mc_opt, none2unans, AnswerType",
            "",
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
            self.enums.append(
                PythonEnum(
                    name=mc.camel_case_name,
                    options=tuple(
                        [
                            PythonEnumOption(
                                symbol=to_snake_case(option.name).upper(),
                                value=option.name,
                                comment=option.label,
                            )
                            for option in mc.options
                        ]
                    ),
                )
            )

    def coalesce_duplicate_enums(self):
        choices: Set[Tuple[PythonEnumOption, ...]] = set()
        enums = tuple(self.enums)
        for enum in enums:
            if enum.options in choices:
                self.enums.remove(enum)
                alias_for = [e for e in enums if e.options == enum.options][0].name
                self.aliases.append(PythonAlias(enum.name, alias_for))
            else:
                choices.add(enum.options)

    def define_base_dataclass(self, class_name: str, hd_vars: List[HDVariable]) -> List[str]:
        lines = [
            f"@dataclass",
            f"class {class_name}:",
        ]

        for var in hd_vars:
            if var.help_text:
                lines.extend(wrap_comment(var.help_text, indent=4))
            varname = var.snake_case_name
            line = f"    {varname}: Optional[{var.py_annotation}] = None"
            if varname.startswith("if"):
                # TODO: This is a very strange bug with pycodestyle/flake8 that
                # appears to trigger E701 if the property name starts with "if".
                #
                # It might be fixed by the following PR, but I don't think we
                # are using the version that integrates it:
                #
                # https://github.com/PyCQA/pycodestyle/pull/640
                line += "  # noqa: E701"
            lines.append(f"{line}\n")

        return lines

    def make_repeat_dataclass_definition(self, repeat: HDRepeatedVariables) -> None:
        hd_vars = repeat.variables
        lines = self.define_base_dataclass(repeat.py_class_name, hd_vars)
        lines.extend(
            [
                f"    @staticmethod",
                f"    def add_to_answer_set(values: List[{repr(repeat.py_class_name)}], "
                + f"result: AnswerSet) -> None:",
            ]
        )

        for var in hd_vars:
            conv_arg = f"none2unans(v.{var.snake_case_name}, {var.answer_type})"
            if isinstance(var, HDMultipleChoice):
                conv_arg = f"enum2mc({conv_arg})"
            lines.extend(
                [
                    f"        result.add({repr(var.name)}, [",
                    f"            {conv_arg}",
                    f"            for v in values",
                    f"        ])",
                ]
            )

        lines.append("")
        self.add_dataclass(lines)

    def get_var_add_arg(self, obj_name: str, var: HDVariable) -> str:
        add_arg = f"{obj_name}.{var.snake_case_name}"
        if isinstance(var, HDMultipleChoice):
            add_arg = f"enum2mc_opt({add_arg})"
        return add_arg

    def define_to_answer_set_method(self, hd_vars: List[HDVariable]) -> List[str]:
        lines = [f"    def to_answer_set(self) -> AnswerSet:", f"        result = AnswerSet()"]

        for var in hd_vars:
            prop = f"self.{var.snake_case_name}"
            lines.extend(
                [
                    f"        result.add_opt({repr(var.name)},",
                    f'                       {self.get_var_add_arg("self", var)})',
                ]
            )

        for repeat in self.lib.repeated_vars:
            prop = f"self.{repeat.py_prop_name}"
            lines.extend(
                [
                    f"        if {prop}:",
                    f"            {repeat.py_class_name}.add_to_answer_set({prop}, result)",
                ]
            )

        lines.append(f"        return result\n")
        return lines

    def make_primary_dataclass_definition(self) -> None:
        class_name = self.primary_class_name
        hd_vars = list(self.lib.vars.values())
        lines = self.define_base_dataclass(class_name, hd_vars)
        for repeat in self.lib.repeated_vars:
            lines.extend(
                [
                    f"    {repeat.py_prop_name}: List[{repeat.py_class_name}] = "
                    + "field(default_factory=list)",
                    f"",
                ]
            )
        lines.extend(self.define_to_answer_set_method(hd_vars))
        self.add_dataclass(lines)

    def add_dataclass(self, lines: List[str]) -> None:
        if self.dataclasses:
            self.dataclasses.append("")
        self.dataclasses.extend(lines)

    def getvalue(self) -> str:
        enums: List[str] = []
        for enum in self.enums:
            enums.extend(enum.generate_code())

        aliases = [alias.generate_code() for alias in self.aliases]

        return "\n".join([*self.imports, "", *enums, *aliases, "", *self.dataclasses])

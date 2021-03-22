import os
import sys
import inspect
import textwrap
from dataclasses import dataclass
from typing import (
    MutableMapping,
    get_type_hints,
    Type,
    Dict,
    List,
    cast,
    Any,
    Optional,
    Union,
    Tuple,
    Callable,
    TypeVar,
    Generic,
    NoReturn,
    IO,
)


T = TypeVar("T")

Converter = Callable[[str], T]


def envhelp(text: str):
    """
    Set the environment variable help for the given converter,
    which documents how an environment variable string is
    converted to its Python representation:

        >>> @envhelp('i am some help')
        ... def boop(): return 'foo'

    The help can then be retrieved with get_envhelp():

        >>> get_envhelp(boop)
        'i am some help'
    """

    def decorator(func: Callable):
        setattr(func, "__envhelp__", text)
        return func

    return decorator


def get_envhelp(obj: Any) -> str:
    """
    Return the environment variable help for the given
    converter, or an empty string if none is available.
    """

    return getattr(obj, "__envhelp__", "")


def quotestrings(*strings: str) -> str:
    """
    Enclose the given strings in quotes
    and comma-separate them, e.g.:

        >>> quotestrings('foo', 'bar')
        "'foo', 'bar'"
    """

    return ", ".join([f"'{s}'" for s in strings])


def destructure_optional(klass: Any) -> Tuple[bool, Any]:
    """
    Attempts to determine whether the given argument represents
    an Optional type. If so, "unwraps" the Optional, revealing
    the underlying type:

        >>> destructure_optional(Optional[int])
        (True, <class 'int'>)

        >>> destructure_optional(int)
        (False, <class 'int'>)

        >>> destructure_optional(Union[bool, int])
        (False, typing.Union[bool, int])
    """

    origin = getattr(klass, "__origin__", None)
    args = getattr(klass, "__args__", [])
    args_has_none = None.__class__ in args

    if origin is Union and len(args) == 2 and args_has_none:
        other = [arg for arg in args if arg is not None.__class__][0]
        return (True, other)
    return (False, klass)


class Converters:
    TRUTHY = ["yes", "yup", "true"]

    FALSY = ["no", "nope", "false"]

    @classmethod
    def convert_bool_safe(cls, value: str) -> Optional[bool]:
        """
        Convert the given string value to a boolean, returning
        None if it couldn't be converted, e.g.:

            >>> Converters.convert_bool_safe('yes')
            True
            >>> Converters.convert_bool_safe('no')
            False
            >>> Converters.convert_bool_safe('NO')
            False
            >>> print(Converters.convert_bool_safe('blah'))
            None
        """

        value = value.lower()
        if value in cls.TRUTHY:
            return True
        if value in cls.FALSY:
            return False
        return None

    @classmethod
    @envhelp(
        f"The value should be one of {quotestrings(*TRUTHY)} for True, or "
        f"{quotestrings(*FALSY)} for False."
    )
    def convert_bool(cls, value: str) -> bool:
        """
        Convert the given string value to a boolean, raising
        an exception if it couldn't be converted, e.g.:

            >>> Converters.convert_bool('blah')
            Traceback (most recent call last):
            ...
            ValueError: 'blah' must be one of the following: yes, yup, true, no, nope, false
        """

        result = cls.convert_bool_safe(value)
        if result is not None:
            return result
        choices = ", ".join(cls.TRUTHY + cls.FALSY)
        raise ValueError(f"'{value}' must be one of the following: {choices}")

    @classmethod
    def convert_str(cls, value: str) -> str:
        """
        If it's a string type, we just pass it through unchanged.
        """

        return value

    @classmethod
    def convert_int(cls, value: str) -> int:
        return int(value)

    @classmethod
    def get_converter(cls, klass: Type[T]) -> Converter:
        """
        Iterate through all our attributes until we find a class
        method that takes a string argument called "value" and
        returns exactly the kind of value we're looking for.

        If none is found, a ValueError is raised.
        """

        for name in vars(cls):
            if name.startswith("convert_"):
                thing = getattr(cls, name)
                hints = get_type_hints(thing)
                if hints.get("value") == str and hints.get("return") == klass:
                    return thing
        raise ValueError(f'Unable to find converter from string to "{klass}"')

    @classmethod
    def convert(cls, value: str, klass: Type[T]) -> T:
        """
        Convert the given string value to the given annotation class.
        """

        converter = cls.get_converter(klass)
        return converter(value)


@dataclass(frozen=True)
class EnvVarInfo(Generic[T]):
    """
    Encapsulates metadata about an environment variable.
    """

    # The name of the variable.
    name: str

    # Whether or not the variable is optional.
    is_optional: bool

    # The type of the variable (excluding its optional component).
    klass: Type[T]

    # Help text for the variable.
    helptext: str

    # The environment the variable belongs to.
    environment: "BaseEnvironment"

    @staticmethod
    def from_env(env: "BaseEnvironment") -> Dict[str, "EnvVarInfo"]:
        """
        Return a mapping from environment variable names to their
        metadata for a given environment.
        """

        hints = get_type_hints(env.__class__)
        varinfo: Dict[str, EnvVarInfo] = {}
        alldocs = env.get_docs()
        for var, hintclass in hints.items():
            if var.upper() != var:
                # This isn't actually an environment variable, so
                # skip it.
                continue
            is_optional, klass = destructure_optional(hintclass)
            convert = env.converters.get_converter(hintclass)
            helptext = "\n\n".join(
                filter(
                    None,
                    [
                        alldocs.get(var, ""),
                        "\n".join(textwrap.wrap(get_envhelp(convert))),
                    ],
                )
            )
            varinfo[var] = EnvVarInfo(
                name=var,
                is_optional=is_optional,
                klass=hintclass,
                environment=env,
                helptext=helptext,
            )
        return varinfo

    def convert(self, value: str) -> T:
        """
        Convert a string to the variable's type.
        """

        return self.environment.converters.convert(value, self.klass)


class BaseEnvironment:
    """
    This class lets you define the environment variables you're
    looking for using Python 3's type annotations, e.g.:

        >>> class MyEnv(BaseEnvironment):
        ...     FOO: bool
        ...     BAR: str = 'here is a default value'

    Instantiating the class when required environment variables
    are missing will raise an exception:

        >>> env = MyEnv()
        Traceback (most recent call last):
        ...
        ValueError: Error evaluating environment variable FOO: this variable must be defined!

    If the required variables are present, they can be
    accessed as attributes:

        >>> env = MyEnv(env={'FOO': 'yes'})
        >>> env.FOO
        True
        >>> env.BAR
        'here is a default value'
    """

    # The raw environment (e.g., the operating system environment).
    env: MutableMapping[str, str]

    # Converters capable of converting values from the raw environment
    # to the strongly-typed values we need.
    converters: Type[Converters]

    # This is where we output any detailed error feedback to.
    err_output: IO

    # Whether we want to abort the process with a non-zero exit code
    # when there are problems validating environment variables.
    exit_when_invalid: bool

    # A mapping from our environment variables to metadata about them.
    varinfo: Dict[str, EnvVarInfo]

    def __init__(
        self,
        env: MutableMapping[str, str] = os.environ,
        converters: Type[Converters] = Converters,
        err_output: IO = sys.stderr,
        exit_when_invalid=False,
        throw_when_invalid=True,
    ) -> None:
        self.env = env
        self.converters = converters
        self.err_output = err_output
        self.exit_when_invalid = exit_when_invalid
        self.varinfo = EnvVarInfo.from_env(self)

        typed_env = {}
        errors: Dict[EnvVarInfo, str] = {}
        for var in self.varinfo.values():
            try:
                typed_env[var.name] = self._resolve_value(var)
            except ValueError as e:
                errors[var] = e.args[0]
        if errors and (throw_when_invalid or exit_when_invalid):
            self._fail(errors)
        self.__dict__.update(typed_env)

    def _resolve_value(self, var: EnvVarInfo[T]) -> Optional[T]:
        """
        Attempt to resolve the typed value of the given environment
        variable. Return None if the environment variable is optional
        and it's not defined (or is empty) in the raw environment.

        If a value for the variable can't be found and it's
        non-optional, a ValueError is raised.
        """

        if self.env.get(var.name, "").strip():
            # The environment variable is non-empty, so let's
            # convert it to the expected type.
            return var.convert(self.env[var.name])
        elif hasattr(self.__class__, var.name):
            # A default value has been set, so fall back to that.
            # Assume a static type-checker has validated
            # that the value is of the proper type.
            return getattr(self.__class__, var.name)
        elif var.is_optional:
            # The type is Optional, so set it to None.
            return None
        else:
            # The type is not Optional, so raise an error.
            raise ValueError("this variable must be defined!")

    def _fail(self, errors: Dict[EnvVarInfo, str]) -> NoReturn:
        """
        Given a mapping from variables to error strings, output detailed
        help.

        Depending on the value of `exit_when_invalid`, either abort the
        process or raise a ValueError.
        """

        if len(errors) == 1:
            var, msg = list(errors.items())[0]
            excmsg = f"Error evaluating environment variable {var.name}: {msg}"
            firstline = "An environment variable is not defined properly."
        else:
            names = ", ".join([var.name for var in errors])
            excmsg = f"Error evaluating environment variables {names}"
            firstline = f"{len(errors)} environment variables are not defined properly."

        self.err_output.write(f"{firstline}\n\n")
        self._output_help_with_optional_info(self.err_output, errors)
        if self.exit_when_invalid:
            raise SystemExit(1)
        raise ValueError(excmsg)

    def _output_help_with_optional_info(self, output: IO, info: Dict[EnvVarInfo, str]) -> None:
        """
        Output help about the given environment variables, along with optional
        extra information about each one.
        """

        indent = "    "

        def wrap(text: str) -> str:
            return "\n".join(textwrap.wrap(text, initial_indent=indent, subsequent_indent=indent))

        for var, desc in info.items():
            details = "\n\n".join(filter(None, [wrap(desc), textwrap.indent(var.helptext, indent)]))
            output.writelines([f"  {var.name}:\n", details, f"\n\n"])

    def print_help(self, output: IO = sys.stdout) -> None:
        """
        Print help about all environment variables.
        """

        self._output_help_with_optional_info(output, {var: "" for var in self.varinfo.values()})

    @classmethod
    def get_docs(cls) -> Dict[str, str]:
        """
        Return a dictionary mapping the names of
        this environment's variables to their
        documentation.

        Traverses all base classes that derive from BaseEnvironment.
        """

        classes = [cls]
        result: Dict[str, str] = {}
        while classes:
            klass = classes.pop()
            result.update(klass._get_docs_non_recursively())
            for base in klass.__bases__:
                if issubclass(base, BaseEnvironment):
                    base = cast(Type[BaseEnvironment], base)
                    classes.append(base)
        return result

    @classmethod
    def _get_docs_non_recursively(cls) -> Dict[str, str]:
        """
        Return a dictionary mapping the names of
        this environment's variables to their
        documentation.

        This method does *not* traverse base classes.
        """

        result: Dict[str, str] = {}

        try:
            source_lines = textwrap.dedent(inspect.getsource(cls)).splitlines()
        except OSError:
            return result

        comments: List[str] = []
        for line in source_lines:
            # Assume PEP-8, i.e. indentations are four spaces. So we'll
            # only pay attention to top-level comments in the class.
            if line.startswith("    #"):
                comments.append(line[6:])
            else:
                parts = line.strip().split(" ")
                varname = parts[0]
                if varname.endswith(":"):
                    varname = varname[:-1]
                if varname and varname == varname.upper() and comments:
                    result[varname] = "\n".join(comments)
                    comments = []
                else:
                    comments = []

        return result

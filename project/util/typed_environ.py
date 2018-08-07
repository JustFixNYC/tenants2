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
    IO
)


T = TypeVar('T')

Converter = Callable[[str], T]


def envhelp(text: str):
    '''
    Set the environment variable help for the given converter,
    which documents how an environment variable string is
    converted to its Python representation:

        >>> @envhelp('i am some help')
        ... def boop(): return 'foo'

    The help can then be retrieved with get_envhelp():

        >>> get_envhelp(boop)
        'i am some help'
    '''

    def decorator(func: Callable):
        setattr(func, '__envhelp__', text)
        return func
    return decorator


def get_envhelp(obj: Any) -> str:
    '''
    Return the environment variable help for the given
    converter, or an empty string if none is available.
    '''

    return getattr(obj, '__envhelp__', '')


def quotestrings(*strings: str) -> str:
    '''
    Enclose the given strings in quotes
    and comma-separate them, e.g.:

        >>> quotestrings('foo', 'bar')
        "'foo', 'bar'"
    '''

    return ', '.join([f"'{s}'" for s in strings])


def destructure_optional(klass: Any) -> Tuple[bool, Any]:
    '''
    Attempts to determine whether the given argument represents
    an Optional type. If so, "unwraps" the Optional, revealing
    the underlying type:

        >>> destructure_optional(Optional[int])
        (True, <class 'int'>)

        >>> destructure_optional(int)
        (False, <class 'int'>)

        >>> destructure_optional(Union[bool, int])
        (False, typing.Union[bool, int])
    '''

    origin = getattr(klass, '__origin__', None)
    args = getattr(klass, '__args__', [])
    args_has_none = None.__class__ in args

    if origin is Union and len(args) == 2 and args_has_none:
        other = [arg for arg in args if arg is not None.__class__][0]
        return (True, other)
    return (False, klass)


class Converters:
    TRUTHY = ['yes', 'yup', 'true']

    FALSY = ['no', 'nope', 'false']

    @classmethod
    def convert_bool_safe(cls, value: str) -> Optional[bool]:
        '''
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
        '''

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
        '''
        Convert the given string value to a boolean, raising
        an exception if it couldn't be converted, e.g.:

            >>> Converters.convert_bool('blah')
            Traceback (most recent call last):
            ...
            ValueError: 'blah' must be one of the following: yes, yup, true, no, nope, false
        '''

        result = cls.convert_bool_safe(value)
        if result is not None:
            return result
        choices = ', '.join(cls.TRUTHY + cls.FALSY)
        raise ValueError(f"'{value}' must be one of the following: {choices}")

    @classmethod
    def convert_str(cls, value: str) -> str:
        '''
        If it's a string type, we just pass it through unchanged.
        '''

        return value

    @classmethod
    def get_converter(cls, klass: Type[T]) -> Converter:
        '''
        Iterate through all our attributes until we find a class
        method that takes a string argument called "value" and
        returns exactly the kind of value we're looking for.

        If none is found, a ValueError is raised.
        '''

        for name in vars(cls):
            if name.startswith('convert_'):
                thing = getattr(cls, name)
                hints = get_type_hints(thing)
                if hints.get('value') == str and hints.get('return') == klass:
                    return thing
        raise ValueError(f'Unable to find converter from string to "{klass}"')

    @classmethod
    def convert(cls, value: str, klass: Type[T]) -> T:
        '''
        Convert the given string value to the given annotation class.
        '''

        converter = cls.get_converter(klass)
        return converter(value)


@dataclass
class EnvVarInfo(Generic[T]):
    '''
    Encapsulates metadata about an environment variable.
    '''

    # The name of the variable.
    name: str

    # Whether or not the variable is optional.
    is_optional: bool

    # The type of the variable (excluding its optional component).
    klass: Type[T]

    # Help text for the variable.
    helptext: str

    # The Converters class/subclass with which the variable can be
    # converted from a string to its type.
    #
    # Note that originally this was a reference to the actual function
    # that performed the conversion, but this isn't currently possible
    # with mypy:
    #
    #     https://github.com/python/mypy/issues/708
    converters: Type[Converters]

    @staticmethod
    def from_env(
        env: Type['BaseEnvironment'],
        converters: Type[Converters]
    ) -> Dict[str, 'EnvVarInfo']:
        '''
        Return a mapping from environment variable names to their
        metadata for a given environment and converters.
        '''

        hints = get_type_hints(env)
        varinfo: Dict[str, EnvVarInfo] = {}
        alldocs = env.get_docs()
        for var, hintclass in hints.items():
            is_optional, klass = destructure_optional(hintclass)
            helptext = alldocs.get(var, '')
            varinfo[var] = EnvVarInfo(
                name=var,
                is_optional=is_optional,
                klass=hintclass,
                converters=converters,
                helptext=helptext
            )
        return varinfo

    def convert(self, value: str) -> T:
        '''
        Convert a string to the variable's type.
        '''

        return self.converters.convert(value, self.klass)


class BaseEnvironment:
    '''
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
    '''

    def __init__(self,
                 env: MutableMapping[str, str] = os.environ,
                 converters: Type[Converters] = Converters,
                 err_output: IO = sys.stderr,
                 exit_when_invalid=False) -> None:
        typed_env = {}
        myclass = self.__class__
        varinfo = EnvVarInfo.from_env(myclass, converters)
        errors: Dict[str, str] = {}
        for var in varinfo.values():
            try:
                if env.get(var.name, '').strip():
                    # The environment variable is non-empty, so let's
                    # convert it to the expected type.
                    typed_env[var.name] = var.convert(env[var.name])
                elif hasattr(myclass, var.name):
                    # A default value has been set, so fall back to that.
                    # Assume a static type-checker has validated
                    # that the value is of the proper type.
                    typed_env[var.name] = getattr(myclass, var.name)
                elif var.is_optional:
                    # The type is Optional, so set it to None.
                    typed_env[var.name] = None
                else:
                    # The type is not Optional, so raise an error.
                    raise ValueError('this variable must be defined!')
            except ValueError as e:
                errors[var.name] = e.args[0]
        if errors:
            if len(errors) == 1:
                name, msg = list(errors.items())[0]
                excmsg = f"Error evaluating environment variable {name}: {msg}"
                firstline = "An environment variable is not defined properly."
            else:
                names = ', '.join(errors.keys())
                excmsg = f"Error evaluating environment variables {names}"
                firstline = f"{len(errors)} environment variables are not defined properly."

            err_output.write(f'{firstline}\n\n')
            indent = '    '

            def wrap(text: str) -> str:
                return '\n'.join(
                    textwrap.wrap(text, initial_indent=indent, subsequent_indent=indent))

            for name, desc in errors.items():
                var = varinfo[name]
                docs = f'\n\n{textwrap.indent(var.helptext, indent)}' if var.helptext else ''
                # TODO: Output envhelp for the converter if it's available.
                err_output.writelines([
                    f'  {name}:\n',
                    wrap(desc) + docs,
                    f'\n\n'
                ])
            if exit_when_invalid:
                raise SystemExit(1)
            raise ValueError(excmsg)
        self.__dict__.update(typed_env)

    @classmethod
    def get_docs(cls) -> Dict[str, str]:
        '''
        Return a dictionary mapping the names of
        this environment's variables to their
        documentation.

        Traverses all base classes that derive from BaseEnvironment.
        '''

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
        '''
        Return a dictionary mapping the names of
        this environment's variables to their
        documentation.

        This method does *not* traverse base classes.
        '''

        result: Dict[str, str] = {}

        try:
            source_lines = textwrap.dedent(inspect.getsource(cls)).splitlines()
        except OSError:
            return result

        comments: List[str] = []
        for line in source_lines:
            # Assume PEP-8, i.e. indentations are four spaces. So we'll
            # only pay attention to top-level comments in the class.
            if line.startswith('    #'):
                comments.append(line[6:])
            else:
                parts = line.strip().split(' ')
                varname = parts[0]
                if varname.endswith(':'):
                    varname = varname[:-1]
                if varname and varname == varname.upper() and comments:
                    result[varname] = '\n'.join(comments)
                    comments = []

        return result

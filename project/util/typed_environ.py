import os
import sys
import inspect
import textwrap
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
    IO
)


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
    def convert(cls, value: str, klass: Any) -> Any:
        '''
        Convert the given string value to the given annotation class.
        '''

        # Iterate through all our attributes until we find a class
        # method that takes a string argument called "value" and
        # returns exactly the kind of value we're looking for.
        for name in vars(cls):
            if name.startswith('convert_'):
                thing = getattr(cls, name)
                hints = get_type_hints(thing)
                if hints.get('value') == str and hints.get('return') == klass:
                    return thing(value)
        raise ValueError(f'Unable to find converter from "{klass}" to string')


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
        hints = get_type_hints(myclass)
        errors: Dict[str, str] = {}
        for var, klass in hints.items():
            try:
                is_optional, klass = destructure_optional(klass)
                if env.get(var, '').strip():
                    # The environment variable is non-empty, so let's
                    # convert it to the expected type.
                    typed_env[var] = converters.convert(env[var], klass)
                elif hasattr(myclass, var):
                    # A default value has been set, so fall back to that.
                    # Assume a static type-checker has validated
                    # that the value is of the proper type.
                    typed_env[var] = getattr(myclass, var)
                elif is_optional:
                    # The type is Optional, so set it to None.
                    typed_env[var] = None
                else:
                    # The type is not Optional, so raise an error.
                    raise ValueError('this variable must be defined!')
            except ValueError as e:
                errors[var] = e.args[0]
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
            alldocs = self.get_docs()
            indent = '    '

            def wrap(text: str) -> str:
                return '\n'.join(
                    textwrap.wrap(text, initial_indent=indent, subsequent_indent=indent))

            for name, desc in errors.items():
                docs = f'\n\n{textwrap.indent(alldocs[name], indent)}' if name in alldocs else ''
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

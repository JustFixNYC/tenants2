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
    IO
)


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
    def convert(cls, value: str, klass: Any) -> Any:
        '''
        Convert the given string value to the given annotation class.
        '''

        if klass is bool:
            return Converters.convert_bool(value)
        raise ValueError(f'Unrecognized type annotation class "{klass}"')


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
                 err_output: IO = sys.stderr) -> None:
        typed_env = {}
        myclass = self.__class__
        hints = get_type_hints(myclass)
        errors: Dict[str, str] = {}
        for var, klass in hints.items():
            try:
                value = getattr(myclass, var, None)
                if var in env:
                    value = env[var]
                if value is None:
                    raise ValueError('this variable must be defined!')
                if isinstance(value, klass):
                    typed_env[var] = value
                else:
                    typed_env[var] = converters.convert(value, klass)
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

            def wrap(text: str) -> str:
                indent = '    '
                return '\n'.join(
                    textwrap.wrap(text, initial_indent=indent, subsequent_indent=indent))

            for name, desc in errors.items():
                docs = f'\n\n{wrap(alldocs[name])}' if name in alldocs else ''
                err_output.writelines([
                    f'  {name}:\n',
                    wrap(desc) + docs,
                    f'\n\n'
                ])
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
            source_lines = inspect.getsource(cls).splitlines()
        except OSError:
            return result

        comments: List[str] = []
        for line in source_lines:
            line = line.strip()
            if line.startswith('# '):
                comments.append(line[2:])
            else:
                parts = line.split(' ')
                varname = parts[0]
                if varname.endswith(':'):
                    varname = varname[:-1]
                if varname and varname == varname.upper() and comments:
                    result[varname] = '\n'.join(comments)
                    comments = []

        return result

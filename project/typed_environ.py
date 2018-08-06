import os
import inspect
from typing import MutableMapping, get_type_hints, Type, Dict, List, cast, Any


class Converters:
    TRUTHY = ['yes', 'yup', 'true']

    FALSY = ['no', 'nope', 'false']

    @classmethod
    def convert_bool(cls, value: str) -> bool:
        value = value.lower()
        if value in cls.TRUTHY:
            return True
        if value in cls.FALSY:
            return False
        choices = ', '.join(cls.TRUTHY + cls.FALSY)
        raise ValueError(f"'{value}' must be one of the following: {choices}")

    @classmethod
    def convert(cls, value: str, klass: Any) -> Any:
        if klass is bool:
            return Converters.convert_bool(value)
        raise ValueError(f'Unrecognized type annotation class "{klass}"')


class BaseEnvironment:
    def __init__(self,
                 env: MutableMapping[str, str] = os.environ,
                 converters: Type[Converters] = Converters) -> None:
        typed_env = {}
        myclass = self.__class__
        hints = get_type_hints(myclass)
        for var, klass in hints.items():
            value = getattr(myclass, var, None)
            if var in env:
                value = env[var]
            if value is None:
                raise ValueError(f'{var} must be defined in the environment!')
            if isinstance(value, klass):
                typed_env[var] = value
            else:
                typed_env[var] = converters.convert(value, klass)
        self.__dict__.update(typed_env)

    @classmethod
    def get_env_var_docs(cls) -> Dict[str, str]:
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
            result.update(klass._get_env_var_docs())
            for base in klass.__bases__:
                if issubclass(base, BaseEnvironment):
                    base = cast(Type[BaseEnvironment], base)
                    classes.append(base)
        return result

    @classmethod
    def _get_env_var_docs(cls) -> Dict[str, str]:
        '''
        Return a dictionary mapping the names of
        this environment's variables to their
        documentation.

        This method does *not* traverse base classes.
        '''

        result: Dict[str, str] = {}
        source_lines = inspect.getsource(cls).splitlines()
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

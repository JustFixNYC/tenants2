from typing import Dict, Any, Type

class BaseModel:
    __fields__: Dict[str, Any]
    def __init__(self, *args, **kwargs) -> None: ...
    def dict(self, by_alias=False) -> Dict[str, Any]: ...

class ValidationError(Exception): ...

# I think Field is actually a class, but this seems like
# the only way to make mypy typecheck properly when assigning
# a field to a Field.
def Field(default: Any, alias: str) -> Any: ...

class fields:
    class Field:
        name: str
        type_: Type
        default: Any
        required: bool
        alias: str
        allow_none: bool

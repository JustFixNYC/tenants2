from typing import Dict, Any


class BaseModel:
    def __init__(self, *args, **kwargs) -> None:
        ...

    def dict(self) -> Dict[str, Any]:
        ...


class ValidationError(Exception):
    ...


# I think Schema is actually a class, but this seems like
# the only way to make mypy typecheck properly when assigning
# a field to a Schema.
def Schema(default: Any, alias: str) -> Any:
    ...

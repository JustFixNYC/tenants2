from typing import Dict, Any


class BaseModel:
    def __init__(self, *args, **kwargs) -> None:
        ...

    def dict(self) -> Dict[str, Any]:
        ...


class ValidationError(Exception):
    ...

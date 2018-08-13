from typing import Any

# We have to use "as" to re-export the symbol here.
# For more details, see: https://github.com/python/mypy/issues/4091
from .request import HttpRequest as HttpRequest

# This indicates that this typing is incomplete.
def __getattr__(attr: str) -> Any: ...

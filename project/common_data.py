import json
from typing import List, Tuple
from pathlib import Path
import pydantic


MY_DIR = Path(__file__).parent.resolve()

COMMON_DATA_DIR = MY_DIR.parent / 'common-data'


class Choices(pydantic.BaseModel):
    choices: List[Tuple[str, str]]

    @classmethod
    def from_file(cls, *path):
        obj = json.loads(COMMON_DATA_DIR.joinpath(*path).read_text())
        return cls(choices=obj)

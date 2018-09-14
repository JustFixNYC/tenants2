import json
from typing import List, Tuple, Optional, Dict
from pathlib import Path
import pydantic


MY_DIR = Path(__file__).parent.resolve()

COMMON_DATA_DIR = MY_DIR.parent / 'common-data'


class Choices(pydantic.BaseModel):
    choices: List[Tuple[str, str]]

    choices_dict: Optional[Dict[str, str]]

    def get_label(self, value: str) -> str:
        if self.choices_dict is None:
            self.choices_dict = dict(self.choices)
        return self.choices_dict[value]

    @classmethod
    def from_file(cls, *path):
        obj = json.loads(COMMON_DATA_DIR.joinpath(*path).read_text())
        return cls(choices=obj)

from typing import Optional

from pydantic import BaseModel


class HardshipDeclarationVariables(BaseModel):
    index_number: Optional[str]
    county_and_court: Optional[str]
    address: str
    has_finanicial_hardship: bool
    has_health_risk: bool
    name: str
    date: str


def fill_hardship_pdf(v: HardshipDeclarationVariables, locale: str) -> bytes:
    raise NotImplementedError()

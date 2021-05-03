import re
from dataclasses import dataclass

from project.util.phone_number import ALL_DIGITS_RE

IN_QUOTES_RE = re.compile(r'"(?P<text>.+)"')


@dataclass
class Query:
    full_legal_name: str = ""
    phone_number: str = ""
    has_hpa_packet: bool = False
    message_body: str = ""

    @staticmethod
    def parse(query: str) -> "Query":
        result = Query()
        quoted_match = IN_QUOTES_RE.fullmatch(query)

        if quoted_match:
            result.message_body = quoted_match.group("text")
        elif ALL_DIGITS_RE.fullmatch(query):
            result.phone_number = query
        elif query.lower() == "has:hpa":
            result.has_hpa_packet = True
        else:
            result.full_legal_name = query
        return result

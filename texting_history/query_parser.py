from dataclasses import dataclass
from project.util.phone_number import ALL_DIGITS_RE


@dataclass
class Query:
    full_name: str = ''
    phone_number: str = ''
    has_hpa_packet: bool = False

    @staticmethod
    def parse(query: str) -> 'Query':
        result = Query()
        if ALL_DIGITS_RE.fullmatch(query):
            result.phone_number = query
        elif query.lower() == 'has:hpa':
            result.has_hpa_packet = True
        else:
            result.full_name = query
        return result

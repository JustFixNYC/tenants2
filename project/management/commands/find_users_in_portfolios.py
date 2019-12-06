from typing import List, Tuple
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connections

from users.models import JustfixUser


# https://www.worstevictorsnyc.org/evictors-list/citywide/
CITYWIDE_WORST_EVICTORS: List[Tuple[str, str]] = [
    ('PHILLIP WISCHERTH', '4015250030'),
    ('VED PARKASH', '2032030038'),
    ('PETER FINE', '1011717506'),
    ('EUGENE SCHNEUR', '1016310065'),
    ('DONALD HASTINGS / DOUGLAS EISENBERG', '4015640058'),
    ('RON MOELIS', '1016000021'),
    ('JOEL WIENER / AMONG OTHERS', '1020890041'),
    ('LARRY GLUCK', '1020730001'),
    ('JONATHAN WIENER', '2028190001'),
    ('JAY ROSENFELD', '1021570056'),
    ('LEIBEL LEDERMAN / JOEL GOLDSTEIN / IRVING LANGER', '1019260029'),
    ('SAM APPLEGRAD', '2044290035'),
    ('DAVID KLEINER (AKA DAVID DAVID)', '2023810049'),
    ('MARK ENGEL', '2037390067'),
    ('ADAM WEINSTEIN', '1009340024'),
    ('MOSHE PILLER', '3051630027'),
    ('DAVID BREUER', '3049640040'),
    ('STEVEN FINKELSTEIN', '2031870053'),
    ('LABE TWERSKI', '1018400035'),
    ('MATTHEW BECKER', '2032490010'),
]


def get_assoc_bbls(bbl: str) -> List[str]:
    with connections[settings.WOW_DATABASE].cursor() as cursor:
        cursor.execute('SELECT bbl from get_assoc_addrs_from_bbl(%(bbl)s)', {'bbl': bbl})
        bbls = [row[0] for row in cursor]
        assert bbl in bbls
        return bbls


class Command(BaseCommand):
    def handle(self, *args, **options):
        print("Portfolio,User")
        for portfolio, bbl in CITYWIDE_WORST_EVICTORS:
            bbls = get_assoc_bbls(bbl)
            for user in JustfixUser.objects.filter(onboarding_info__pad_bbl__in=bbls):
                print(f"{portfolio},{user.admin_url}")

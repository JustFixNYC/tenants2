from django.core.management.base import BaseCommand

from project.justfix_environment import BASE_DIR
from hpaction.hotdocs_cmp import HDComponentLibrary


MASTER_CMP_PATH = BASE_DIR / 'hpaction' / 'hotdocs-data' / 'Master.cmp'


class Command(BaseCommand):
    help = f"Parse {MASTER_CMP_PATH.name} and show results."

    def handle(self, *args, **options) -> None:
        lib = HDComponentLibrary(MASTER_CMP_PATH)

        print("## Variables\n")

        for var in lib.vars.values():
            print(var.describe())

        print("\n## Repeated variables")

        for repeat in lib.repeated_vars:
            print()
            print(repeat.label)
            for var in repeat.variables:
                print("  ", var.describe())

        print("\n## Python code")

        print('\n'.join(lib.make_python_definitions("HPActionVariables")))

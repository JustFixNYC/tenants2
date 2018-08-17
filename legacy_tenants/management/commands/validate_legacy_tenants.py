from django.core.management.base import BaseCommand
from pydantic import ValidationError

from legacy_tenants import mongo


class Command(BaseCommand):
    help = 'Validate legacy tenants against our schema.'

    def handle(self, *args, **options):
        db = mongo.get_db()
        tenants = db['tenants'].find({})
        total = tenants.count()
        invalid = 0
        self.stdout.write(f"Validating {total} tenants.")
        for tenant in tenants:
            tenant_id = tenant['_id']
            tenant_name = tenant.get('fullName', '<no fullName provided>')
            try:
                mongo.MongoTenant(**tenant)
            except ValidationError as e:
                invalid += 1
                self.stdout.write(f"Tenant {tenant_id} ({tenant_name}): {e}\n")
        self.stdout.write(f'Done. Out of {total} tenants, {invalid} are invalid.\n')

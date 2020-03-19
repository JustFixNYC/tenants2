from django.core.management.base import BaseCommand
from django.conf import settings
from hellosign_sdk import HSClient


class Command(BaseCommand):
    help = "Validate HelloSign configuration."

    def handle(self, *args, **options) -> None:
        client = HSClient(api_key=settings.HELLOSIGN_API_KEY)
        template = client.get_template(settings.HELLOSIGN_HPA_TEMPLATE_ID)
        print(f"Documents in template {template.title}:")
        for doc in template.documents:
            print(f"  Custom fields in document '{doc['name']}':")
            for cf in doc['custom_fields']:
                required = 'required' if cf['required'] else 'optional'
                print(f"    {cf['name']} - {required} {cf['type']}")

import os
import requests
import uuid
import json
from django.core.management import BaseCommand


class Command(BaseCommand):
    help = 'Translate text from Spanish to English.'

    def add_arguments(self, parser):
        parser.add_argument('text', help="Spanish text to translate")

    def handle(self, *args, **options) -> None:
        subscription_key = os.environ['TRANSLATOR_TEXT_SUBSCRIPTION_KEY']
        endpoint = os.environ['TRANSLATOR_TEXT_ENDPOINT']
        region = os.environ['TRANSLATOR_TEXT_REGION']
        path = '/translate?api-version=3.0'
        params = '&from=es&to=en'
        constructed_url = endpoint + path + params
        headers = {
            'Ocp-Apim-Subscription-Key': subscription_key,
            'Ocp-Apim-Subscription-Region': region,
            'Content-type': 'application/json',
            'X-ClientTraceId': str(uuid.uuid4())
        }
        body = [{
            'text': options['text'],
        }]
        request = requests.post(constructed_url, headers=headers, json=body)
        response = request.json()
        print(json.dumps(response, sort_keys=True, indent=4,
                         ensure_ascii=False, separators=(',', ': ')))

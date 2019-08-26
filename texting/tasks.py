from celery import shared_task

from . import twilio


shared_task(ignore_result=True)(twilio.send_sms)

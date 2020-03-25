from celery import shared_task

from . import email_verify


shared_task(ignore_result=True)(email_verify.send_verification_email)

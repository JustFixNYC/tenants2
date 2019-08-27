from celery import shared_task

from . import email_letter

shared_task(ignore_result=True)(email_letter.email_letter)

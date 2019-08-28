from celery import shared_task

from . import email_packet
from .lhiapi import get_answers_and_documents_and_notify


shared_task(ignore_result=True)(email_packet.email_packet)

shared_task(ignore_result=True)(get_answers_and_documents_and_notify)

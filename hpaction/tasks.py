from celery import shared_task

from .lhiapi import get_answers_and_documents_and_notify


shared_task(ignore_result=True)(get_answers_and_documents_and_notify)

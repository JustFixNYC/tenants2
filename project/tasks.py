from celery import shared_task

from project import slack


shared_task(ignore_result=True)(slack.sendmsg)

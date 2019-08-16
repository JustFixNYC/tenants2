from project.util.celery_util import fire_and_forget_task
from project import slack


async_slack_sendmsg = fire_and_forget_task(slack.sendmsg)

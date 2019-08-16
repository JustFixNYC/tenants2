from celery import shared_task

from project import slack


print("HELLO FROM TASK-LAND")


@shared_task
def boop(x):
    print(f"BOOP {x}")
    return x + 1


shared_task(ignore_result=True)(slack.sendmsg)

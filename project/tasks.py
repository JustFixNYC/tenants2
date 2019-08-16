from celery import shared_task


@shared_task
def boop(x, y):
    print(f'boop({x}, {y}) called.')

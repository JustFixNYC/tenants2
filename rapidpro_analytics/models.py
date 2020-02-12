from django.db import models


UUID_LEN = 36


class Run(models.Model):
    # The RapidPro UUID of the run's flow.
    flow_uuid = models.CharField(max_length=UUID_LEN)

    # The human-readable name of the run's flow.
    flow_name = models.CharField(max_length=255)

    # The UUID of the user who went through the run.
    user_uuid = models.CharField(max_length=UUID_LEN)

    # When the run started.
    start_time = models.DateTimeField()

    # When the run ended. This can be null if the run is still in-progress.
    end_time = models.DateTimeField(null=True)

    # The number of steps in the run's flow that the user went through.
    num_steps = models.IntegerField()

    # how the run ended (one of "interrupted", "completed", "expired"), or
    # null if the run is still in-progress.
    exit_type = models.CharField(max_length=40, null=True)

    # If we can distinguish between what steps constitute
    # "error" states, e.g. "sorry, I don't understand what you mean",
    # how many of the steps in the run were errors?
    num_error_steps = models.IntegerField(null=True)

    # If this represents a rent history followup, did the user
    # confirm that their rent history was received or not?
    was_rent_history_received = models.BooleanField(null=True)

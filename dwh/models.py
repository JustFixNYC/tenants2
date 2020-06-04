from django.db import models


UUID_LEN = 36


class RapidproRun(models.Model):
    '''
    Represents a run of a RapidPro flow that was exited (i.e., is no longer in-progress).
    '''

    # The RapidPro UUID of the run's flow.
    flow_uuid = models.CharField(max_length=UUID_LEN)

    # The human-readable name of the run's flow.
    flow_name = models.CharField(max_length=255)

    # The UUID of the user who went through the run.
    user_uuid = models.CharField(max_length=UUID_LEN)

    # When the run started.
    start_time = models.DateTimeField()

    # When the run ended.
    end_time = models.DateTimeField()

    # The number of steps in the run's flow that the user went through.
    num_steps = models.IntegerField()

    # how the run ended (one of "interrupted", "completed", "expired").
    exit_type = models.CharField(max_length=15)

    # If we can distinguish between what steps constitute
    # "error" states, e.g. "sorry, I don't understand what you mean",
    # how many of the steps in the run were errors?
    num_error_steps = models.IntegerField(null=True)

    # If this represents a rent history followup, did the user
    # confirm that their rent history was received or not?
    was_rent_history_received = models.BooleanField(null=True)


class OnlineRentHistoryRequest(models.Model):
    '''
    Represents an *online* (not SMS-based) rental history request.
    '''

    created_at = models.DateTimeField()

    # The UUID of the RapidPro user for whom the request was made.
    user_uuid = models.CharField(max_length=UUID_LEN, blank=True, null=True)


class LetterOfComplaintRequest(models.Model):
    '''
    Represents a letter of complaint request.
    '''

    created_at = models.DateTimeField()

    mail_choice = models.CharField(max_length=30)

    letter_sent_at = models.DateTimeField(null=True, blank=True)

    landlord_responded_by = models.DateTimeField(null=True, blank=True)

    landlord_did_not_respond_by = models.DateTimeField(null=True, blank=True)

    landlord_retaliated_by = models.DateTimeField(null=True, blank=True)

    repairs_made_by = models.DateTimeField(null=True, blank=True)

    interested_in_hp_action_by = models.DateTimeField(null=True, blank=True)


class EmergencyHPASigning(models.Model):
    '''
    Represents an Emergency HP Action signing.
    '''

    created_at = models.DateTimeField()

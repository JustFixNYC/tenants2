from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone

from loc.models import LetterRequest, LOC_MAILING_CHOICES


DEFAULT_DAYS_OLD = 30


class Command(BaseCommand):
    help = "Find recent users who sent LOCs in the same building."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            help=f"Look at LOCs that are these many days old (default {DEFAULT_DAYS_OLD})",
            default=DEFAULT_DAYS_OLD,
        )

    def handle(self, *args, **options):
        days_old: int = options["days"]
        start_date = timezone.now() - timedelta(days=days_old)
        all_sent_letters = LetterRequest.objects.filter(
            mail_choice=LOC_MAILING_CHOICES.WE_WILL_MAIL
        )
        recent_letters = (
            all_sent_letters.filter(letter_sent_at__gte=start_date)
            .exclude(user__onboarding_info__pad_bbl="")
            .order_by("-letter_sent_at")
            .prefetch_related("user", "user__onboarding_info")
        )
        letters_with_allies = 0
        recent_letters = list(recent_letters)
        for letter in recent_letters:
            user = letter.user
            onb = user.onboarding_info
            other_loc_users = (
                all_sent_letters.filter(
                    user__onboarding_info__pad_bbl=onb.pad_bbl,
                    letter_sent_at__lt=letter.letter_sent_at,
                )
                .exclude(user=user)
                .count()
            )
            if other_loc_users > 0:
                letters_with_allies += 1
            print(other_loc_users, letter.user.first_name, letter.letter_sent_at.date())
        pct = int(float(letters_with_allies) / len(recent_letters) * 100)
        print(
            f"\nOut of the {len(recent_letters)} LOCs sent over the past {days_old} days, "
            f"{letters_with_allies} ({pct}%) had potential allies."
        )

from django.core.management.base import BaseCommand

from loc.models import LetterRequest, LOC_MAILING_CHOICES


DEFAULT_NUM_LOCS = 100


class Command(BaseCommand):
    help = "Find recent users who sent LOCs in the same building."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            help=f"Number of recent LOCs to look at (default {DEFAULT_NUM_LOCS})",
            default=DEFAULT_NUM_LOCS,
        )

    def handle(self, *args, **options):
        count: int = options["count"]
        sent_letters = (
            LetterRequest.objects.filter(mail_choice=LOC_MAILING_CHOICES.WE_WILL_MAIL)
            .exclude(letter_sent_at__isnull=True)
            .exclude(user__onboarding_info__pad_bbl="")
        )
        letters = sent_letters.order_by("-letter_sent_at").prefetch_related(
            "user", "user__onboarding_info"
        )
        letters_with_allies = 0
        num_latest_letters = count
        for letter in letters[:num_latest_letters]:
            user = letter.user
            onb = user.onboarding_info
            other_loc_users = (
                sent_letters.filter(
                    user__onboarding_info__pad_bbl=onb.pad_bbl,
                    letter_sent_at__lt=letter.letter_sent_at,
                )
                .exclude(user=user)
                .count()
            )
            if other_loc_users > 0:
                letters_with_allies += 1
            print(other_loc_users, letter.user.first_name, letter.letter_sent_at.date())
        print(
            f"\nOut of the {num_latest_letters} most recently sent LOCs, "
            f"{letters_with_allies} had potential allies."
        )

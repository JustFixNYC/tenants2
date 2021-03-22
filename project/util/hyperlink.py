from typing import NamedTuple, List
from django.utils.html import format_html
from django.utils.safestring import SafeText


class Hyperlink(NamedTuple):
    """
    A hyperlink for embedding in HTML.
    """

    # The text that will be hyperlinked.
    name: str

    # The URL to link to.
    url: str

    @property
    def admin_button_html(self) -> str:
        """
        HTML for embedding as a button in the Django admin UI.
        """

        return format_html(
            '<a href="{}" class="button" target="blank" rel="nofollow noopener">{}</a>',
            self.url,
            self.name,
        )

    @staticmethod
    def join_admin_buttons(links: List["Hyperlink"]) -> str:
        """
        Joins together multiple Hyperlinks into a single HTML string consisting
        of buttons.
        """

        return SafeText(" ".join(map(lambda link: link.admin_button_html, links)))

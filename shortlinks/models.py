from django.db import models


class Link(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    url = models.URLField(help_text="The destination of the link.")

    title = models.CharField(max_length=200, help_text="The title of the link.")

    slug = models.SlugField(
        max_length=200,
        help_text=(
            "The slug of the link. This will be used in the short link, so "
            "try to keep it short yet (hopefully) memorable."
        ),
        unique=True,
    )

    description = models.TextField(help_text="A description of the link. Optional.", blank=True)

    def __str__(self):
        return self.title

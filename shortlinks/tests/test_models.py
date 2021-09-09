import pytest

from shortlinks.models import Link


class TestLink:
    def test_str_works(self):
        link = Link(title="Boop")
        assert str(link) == "Boop"

    @pytest.mark.django_db
    def test_save_converts_slug_to_lowercase(self):
        link = Link(slug="BOOP")
        link.save()
        assert link.slug == "boop"

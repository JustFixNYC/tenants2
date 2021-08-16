from shortlinks.models import Link


class TestLink:
    def test_str_works(self):
        link = Link(title="Boop")
        assert str(link) == "Boop"

from django.core.management import call_command


def test_it_does_not_explode():
    call_command("exampleairtablecsv")

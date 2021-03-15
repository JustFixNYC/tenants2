from unittest.mock import MagicMock
from django.core.management import call_command
from django.utils import timezone
from freezegun import freeze_time
import pytest

from onboarding.tests.factories import OnboardingInfoFactory
from .factories import SubmittedHardshipDeclarationFactory
from evictionfree.management.commands import process_declarations


@pytest.fixture
def fake_send_decl(monkeypatch):
    send_declaration = MagicMock()
    monkeypatch.setattr(process_declarations, "send_declaration", send_declaration)
    yield send_declaration


def test_it_ignores_brand_new_unprocessed_decls(db, fake_send_decl):
    SubmittedHardshipDeclarationFactory(
        fully_processed_at=None,
    )
    call_command("process_declarations")
    fake_send_decl.assert_not_called()


def test_it_processes_slightly_old_unprocessed_decls(db, fake_send_decl):
    with freeze_time("2021-02-01"):
        shd = SubmittedHardshipDeclarationFactory(
            fully_processed_at=None,
        )
    call_command("process_declarations")
    fake_send_decl.assert_called_once_with(shd)


def test_it_ignores_fully_processed_decls(db, fake_send_decl):
    with freeze_time("2021-02-01"):
        SubmittedHardshipDeclarationFactory(
            fully_processed_at=timezone.now(),
        )
    call_command("process_declarations")
    fake_send_decl.assert_not_called()


def test_it_processes_slightly_old_decls_not_sent_to_housing_court(db, fake_send_decl):
    with freeze_time("2021-02-01"):
        onb = OnboardingInfoFactory()
        shd = SubmittedHardshipDeclarationFactory(
            user=onb.user,
            fully_processed_at=timezone.now(),
            emailed_to_housing_court_at=None,
        )
        OnboardingInfoFactory.set_geocoded_point(onb, 0.1, 0.1)
        onb.save()
    call_command("process_declarations")
    fake_send_decl.assert_called_once_with(shd)

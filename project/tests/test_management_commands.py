import json
from pathlib import Path
from io import StringIO
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.core.management import call_command
from django.core.management.base import CommandError
import pytest

from project.management.commands import sendtestslack
from project.management.commands import rollbarsourcemaps


def test_envhelp_works():
    out = StringIO()
    call_command('envhelp', stdout=out)
    assert 'DEBUG' in out.getvalue()


def test_fixnewlines_works():
    testfile = Path('test-file-with-crlfs.txt').resolve()
    testfile.write_bytes(b'hello there.\r\nhow are you.')
    try:
        out = StringIO()
        call_command('fixnewlines', str(testfile), stdout=out)
        assert 'Converting 1 CRLFs to LFs' in out.getvalue()
        assert testfile.read_bytes() == b'hello there.\nhow are you.'
    finally:
        testfile.unlink()


def test_raisetesterror_works():
    with pytest.raises(Exception, match="exception with id 'boop'"):
        call_command('raisetesterror', 'boop')


class SendtestslackTests(TestCase):
    @override_settings(SLACK_WEBHOOK_URL='')
    def test_it_raises_error_when_settings_are_not_defined(self):
        with self.assertRaises(CommandError) as cm:
            call_command('sendtestslack')
        self.assertIn('SLACK_WEBHOOK_URL must be configured.',
                      cm.exception.args[0])

    @override_settings(SLACK_WEBHOOK_URL='http://boop')
    @patch.object(sendtestslack, 'sendmsg')
    def test_it_has_exit_code_zero_when_sendmsg_is_successful(self, m):
        m.return_value = True
        call_command('sendtestslack')
        m.assert_called_with(
            'Hi, this is a test message sent from <https://example.com/|example.com>!',
            is_safe=True)

    @override_settings(SLACK_WEBHOOK_URL='http://boop')
    @patch.object(sendtestslack, 'sendmsg')
    def test_it_raises_error_when_sendmsg_fails(self, m):
        m.return_value = False
        with self.assertRaises(CommandError) as cm:
            call_command('sendtestslack')
        self.assertIn('Sending test Slack message failed.',
                      cm.exception.args[0])


class TestStoreTestFile:
    def test_it_deletes_file_by_default(self, django_file_storage):
        out = StringIO()
        call_command('storetestfile', stdout=out)
        assert 'Deleting test file' in out.getvalue()

    def test_it_does_not_delete_file_if_told_not_to(self, django_file_storage):
        out = StringIO()
        call_command('storetestfile', '--no-delete', stdout=out)
        assert 'Please delete "storetestfile_test_file.txt" manually' in out.getvalue()


class TestExportStats:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db):
        from onboarding.tests.factories import OnboardingInfoFactory
        from rapidpro.tests.factories import UserContactGroupFactory

        self.redacted = 'REDACTED'
        self.pad_bbl = '1234567890'
        oi = OnboardingInfoFactory(pad_bbl=self.pad_bbl)
        UserContactGroupFactory(user=oi.user, group__uuid='1', group__name='Boop')
        UserContactGroupFactory(user=oi.user, group__uuid='2', group__name='Goop')

    def test_it_works_with_json(self, db):
        out = StringIO()
        call_command('exportstats', 'userstats', '--format=json', stdout=out)
        results = json.loads(out.getvalue())
        assert len(results) == 1
        assert results[0]['pad_bbl'] == self.redacted
        assert results[0]['rapidpro_contact_groups'] == ['Boop', 'Goop']

    def test_it_works_with_csv(self, db):
        out = StringIO()
        call_command('exportstats', 'userstats', stdout=out)
        assert self.pad_bbl not in out.getvalue()
        assert self.redacted in out.getvalue()
        assert '"Boop, Goop"' in out.getvalue()

        out = StringIO()
        call_command('exportstats', 'userstats-with-bbls', stdout=out)
        assert self.pad_bbl in out.getvalue()
        assert self.redacted not in out.getvalue()


class TestRollbarSourceMaps:
    def test_it_errors_when_aws_is_not_configured(self):
        with pytest.raises(CommandError, match='currently only works with AWS integration'):
            call_command('rollbarsourcemaps')

    def test_get_bundle_urls_works_with_dev_bundles(self):
        urls = rollbarsourcemaps.get_bundle_urls({
            'assetsByChunkName': {
                "confetti": "confetti.bundle.js"
            }
        }, '/webpack/')
        assert urls == ['/webpack/confetti.bundle.js']

    def test_get_bundle_urls_works_with_prod_bundles(self):
        urls = rollbarsourcemaps.get_bundle_urls({
            'assetsByChunkName': {
                "confetti": [
                    "confetti.72e54ae11edbd5b71c4d.bundle.js",
                    "confetti.72e54ae11edbd5b71c4d.bundle.js.map"
                ],
            }
        }, '/webpack/')
        assert urls == ['/webpack/confetti.72e54ae11edbd5b71c4d.bundle.js']

    def test_it_errors_when_rollbar_is_not_configured(self, settings):
        settings.AWS_STORAGE_STATICFILES_BUCKET_NAME = 'bop'
        with pytest.raises(CommandError, match='requires Rollbar integration'):
            call_command('rollbarsourcemaps')

    def test_it_works(self, settings, requests_mock):
        settings.AWS_STORAGE_STATICFILES_BUCKET_NAME = 'bop'
        settings.ROLLBAR = {'access_token': 'blarf'}
        requests_mock.post(rollbarsourcemaps.ROLLBAR_SOURCEMAP_URL)
        call_command('rollbarsourcemaps')
        first_req = requests_mock.request_history[0]
        assert 'access_token=blarf' in first_req.text


class TestRaiseCeleryTestError:
    def test_it_raises_error_if_celery_is_disabled(self):
        with pytest.raises(CommandError, match='Celery integration is disabled'):
            call_command('raisecelerytesterror', 'blarf')

    def test_it_works(self, settings):
        settings.CELERY_BROKER_URL = 'blarrrf'
        # The task will be executed eagerly and its exception will be propagated.
        # Not an ideal test, but better than nothing--at least we're exercising
        # the task's code.
        with pytest.raises(Exception, match="example Celery task exception with id 'blarf'"):
            call_command('raisecelerytesterror', 'blarf')

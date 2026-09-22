"""Tests for the IDS information-requirements check.

The fixtures here are built with ifcopenshell rather than committed as .ifc
files: a synthetic model missing exactly one property is both smaller and far
clearer about what it is testing than a 4 MB export would be.
"""

import os
import tempfile
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase, override_settings
from django.test.client import BOUNDARY, MULTIPART_CONTENT, encode_multipart

from . import ids_check
from .models import Verification


def _row(cardinality, status):
    """One entry of the summary aggregate_status() reduces."""

    return {'name': 'spec', 'cardinality': cardinality, 'status': status}


class AggregateStatusTests(SimpleTestCase):

    """The traffic light. Pure, so it needs neither a model nor a database."""

    def test_everything_passing_is_green(self):
        self.assertEqual(
            ids_check.aggregate_status([_row('required', True), _row('optional', True)]),
            ids_check.PASSED)

    def test_only_an_optional_failure_is_orange(self):
        self.assertEqual(
            ids_check.aggregate_status([_row('required', True), _row('optional', False)]),
            ids_check.OPTIONAL_FAILED)

    def test_an_obligatory_failure_is_red(self):
        # Red wins even though every optional specification passed - the point
        # of the orange state is that it means the obligatory ones are fine.
        self.assertEqual(
            ids_check.aggregate_status([_row('required', False), _row('optional', True)]),
            ids_check.FAILED)

    def test_an_ungraded_obligatory_specification_is_red(self):
        # ifctester leaves the status None for a specification it never reached.
        # An ungraded requirement is not a met one.
        self.assertEqual(
            ids_check.aggregate_status([_row('required', None)]),
            ids_check.FAILED)

    def test_a_prohibited_specification_is_graded_as_obligatory(self):
        self.assertEqual(
            ids_check.aggregate_status([_row('prohibited', False), _row('optional', True)]),
            ids_check.FAILED)

    def test_no_specifications_at_all_is_an_error(self):
        # Calling an IDS that produced no verdict "passed" would be the worst
        # available answer.
        self.assertEqual(ids_check.aggregate_status([]), ids_check.ERROR)


class CheckIfcAgainstIdsTests(SimpleTestCase):

    """The real thing, against the project's own IDS."""

    def _write_model(self, directory, populate=None):
        import ifcopenshell

        model = ifcopenshell.file(schema='IFC4')

        if populate:
            populate(model, ifcopenshell)

        path = os.path.join(directory, 'model.ifc')

        model.write(path)

        return path

    def test_a_model_missing_required_data_fails(self):
        import ifcopenshell

        def populate(model, _):
            model.create_entity('IfcBuilding', GlobalId=ifcopenshell.guid.new(), Name='B')

        with tempfile.TemporaryDirectory() as directory:

            result = ids_check.check_ifc_against_ids(self._write_model(directory, populate))

        self.assertEqual(result['status'], ids_check.FAILED)

        rows = {row['name']: row for row in result['summary']['specifications']}

        # The building exists but carries no PermitCheck property set.
        self.assertFalse(rows['Building requirements']['status'])
        self.assertEqual(rows['Building requirements']['cardinality'], 'required')

        # Nothing in this model is a lift, and the IDS marks that specification
        # minOccurs="0" - so it passes rather than dragging the model to red.
        self.assertTrue(rows['Elevator requirements']['status'])
        self.assertEqual(rows['Elevator requirements']['cardinality'], 'optional')

    def test_a_file_that_is_not_ifc_reports_an_error_rather_than_raising(self):
        with tempfile.TemporaryDirectory() as directory:

            path = os.path.join(directory, 'junk.ifc')

            with open(path, 'w') as handle:
                handle.write('this is not an IFC file')

            result = ids_check.check_ifc_against_ids(path)

        self.assertEqual(result['status'], ids_check.ERROR)
        self.assertEqual(result['summary'], {})
        # The traceback is the only feedback available to whoever uploaded it.
        self.assertIn('Traceback', result['detail']['console'])

    def test_an_unreadable_ids_reports_an_error(self):
        with tempfile.TemporaryDirectory() as directory:

            result = ids_check.check_ifc_against_ids(
                self._write_model(directory),
                ids_path=os.path.join(directory, 'does_not_exist.ids'))

        self.assertEqual(result['status'], ids_check.ERROR)
        self.assertIn('Traceback', result['detail']['console'])


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class VerificationUploadTests(TestCase):

    """When the check runs, and - just as important - when it does not."""

    def setUp(self):
        self.verification = Verification.objects.create()

    def _patch(self, payload, **kwargs):
        return self.client.patch(
            '/api/verifications/%s/' % self.verification.pk, payload, **kwargs)

    def _patch_upload(self, payload):
        # Client.patch() defaults to application/octet-stream - only post()
        # encodes multipart - so the upload AddFileModal sends has to be built
        # explicitly here.
        return self._patch(
            encode_multipart(BOUNDARY, payload), content_type=MULTIPART_CONTENT)

    def test_attaching_a_model_runs_the_check(self):
        upload = SimpleUploadedFile('model.ifc', b'ISO-10303-21;', content_type='application/octet-stream')

        with mock.patch.object(Verification, 'run_ids_check') as run:

            response = self._patch_upload({'ifc_file': upload})

        self.assertEqual(response.status_code, 200)
        run.assert_called_once()

    def test_patching_anything_else_does_not_re_run_the_check(self):
        # The expensive part of an upload must not be repeated by every
        # unrelated write to the same endpoint.
        with mock.patch.object(Verification, 'run_ids_check') as run:

            response = self._patch(
                {'report': 'unchanged'}, content_type='application/json')

        self.assertEqual(response.status_code, 200)
        run.assert_not_called()

    def test_a_broken_model_still_uploads_and_reports_the_error(self):
        upload = SimpleUploadedFile('model.ifc', b'not an ifc', content_type='application/octet-stream')

        response = self._patch_upload({'ifc_file': upload})

        # The file is kept; only the verdict says the check could not run.
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['ids_status'], ids_check.ERROR)

        # The heavy detail is excluded from this serializer.
        self.assertNotIn('ids_detail', response.json())

    def test_the_ids_report_action_serves_the_detail(self):
        self.verification.ids_detail = {'specifications': [], 'console': ''}
        self.verification.ids_status = ids_check.PASSED
        self.verification.save()

        response = self.client.get(
            '/api/verifications/%s/ids-report/' % self.verification.pk)

        self.assertEqual(response.status_code, 200)
        self.assertIn('ids_detail', response.json())
        self.assertEqual(response.json()['ids_status'], ids_check.PASSED)

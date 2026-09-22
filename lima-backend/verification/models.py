import traceback

from django.db import models
from digital_regulation.models import Regulation
from check_engine.console import capture_console
from check_engine.main import ComplianceCheck

from . import ids_check

from django.utils import timezone

# Verification Models
class Verification(models.Model):
    
    time_created = models.DateTimeField(auto_now_add=True)
    time_executed = models.DateTimeField(null=True, blank=True, default=None)
    is_executed = models.BooleanField(default=False)
    ifc_file = models.FileField(upload_to='ifc_files/', blank=True)
    xkt_file = models.FileField(upload_to='xkt_files/', blank=True)
    report = models.CharField(max_length=200, default='', blank=True)
    regulations = models.ManyToManyField(Regulation, blank=True)

    # Whether the attached model carries the information the rules need, checked
    # against the IDS when the file arrives rather than when a rule is run.
    ids_status = models.CharField(max_length=20, default=ids_check.NOT_CHECKED, blank=True)
    ids_checked_at = models.DateTimeField(null=True, blank=True, default=None)
    # Counts only - small enough to travel with the verification list, which is
    # what the CheckPanel table renders from.
    ids_summary = models.JSONField(default=dict, blank=True)
    # The applicability and requirement sentences and the failing elements.
    # Served on demand by the ids-report action so the list stays cheap.
    ids_detail = models.JSONField(default=dict, blank=True)

    def get_ruleset(self):

        '''Get a ruleset containing all the rules assigned to the verification'''

        ruleset = []

        for regulation in self.regulations.all():

            for rule in regulation.rules.all():
                    
                    ruleset.append(rule)

        return ruleset

    def run_verification(self):

        '''Execute the compliance check of the attributed IFC model.

        Returns the report together with the console output the run produced,
        so the Reports view can show what the engine printed - including the
        traceback of a rule that failed, which used to surface only as a 500
        the interface had no way to explain.'''

        check = None

        status = 'ok'

        with capture_console() as console:

            try:

                check = ComplianceCheck(self.get_ruleset(), self.ifc_file.path)

                check.execute()

            except Exception:

                # Rule code is user authored, so a failure here is feedback for
                # whoever wrote the rule rather than a server fault. Printing it
                # puts it in the captured console and still leaves it in the
                # server log, where it has always been.
                traceback.print_exc()

                status = 'error'

        # Rules that completed before a failure are still worth reporting.
        report = check.report.final_report if check else []

        if status == 'ok':

            self.report = report

            self.time_executed = timezone.now() # Set the execution time

            self.is_executed = True # Set that the verification was executed

            self.save()

        return {
            'status': status,
            'report': report,
            'console': console.getvalue(),
        }

    def run_ids_check(self):

        '''Check the attached model against the information requirements and store the verdict.

        Deliberately separate from run_verification: this asks whether the model
        carries the data the rules need, and it is answered when the file arrives
        rather than when a compliance check is requested.'''

        if not self.ifc_file:

            result = {'status': ids_check.NOT_CHECKED, 'summary': {}, 'detail': {}}

        else:

            result = ids_check.check_ifc_against_ids(self.ifc_file.path)

        self.ids_status = result['status']

        self.ids_summary = result['summary']

        self.ids_detail = result['detail']

        self.ids_checked_at = timezone.now()

        # update_fields so this cannot clobber a concurrent run_verification()
        # writing report/is_executed on the same row.
        self.save(update_fields=[
            'ids_status', 'ids_summary', 'ids_detail', 'ids_checked_at'])

        return result

    def save(self, *args, **kwargs):
        super(Verification, self).save(*args, **kwargs)
        
class RuleResult(models.Model):
    
    object_ids = models.TextField(max_length=20000)
    result = models.BooleanField()
    verification = models.ForeignKey(Verification, on_delete=models.CASCADE)
    

    

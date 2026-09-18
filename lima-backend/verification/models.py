from django.db import models
from digital_regulation.models import Regulation
from check_engine.main import ComplianceCheck

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

    def get_ruleset(self):

        '''Get a ruleset containing all the rules assigned to the verification'''

        ruleset = []

        for regulation in self.regulations.all():

            for rule in regulation.rules.all():
                    
                    ruleset.append(rule)

        return ruleset

    def run_verification(self):

        '''Execute the compliance check of the attributed IFC model and returns a report'''

        check = ComplianceCheck(self.get_ruleset(), self.ifc_file.path)

        check.execute()

        self.report = check.report.final_report

        self.time_executed = timezone.now() # Set the execution time

        self.is_executed = True # Set that the verification was executed

        self.save()

        return self.report

    def save(self, *args, **kwargs):
        super(Verification, self).save(*args, **kwargs)
        
class RuleResult(models.Model):
    
    object_ids = models.TextField(max_length=20000)
    result = models.BooleanField()
    verification = models.ForeignKey(Verification, on_delete=models.CASCADE)
    

    

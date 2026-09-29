from django.db import transaction
from rest_framework import viewsets
from .models import Regulation,Rule
from .serializers import RegulationSerializer, RuleSerializer

# My views
class RegulationViewSet(viewsets.ModelViewSet):
    queryset = Regulation.objects.all()
    serializer_class = RegulationSerializer

    @transaction.atomic
    def perform_destroy(self, instance):

        # Deleting a regulation only drops the many-to-many links, which would
        # leave its rules in the database with nothing pointing at them. A rule
        # still attached to another regulation is kept.
        rules = list(instance.rules.all())

        instance.delete()

        for rule in rules:
            if not rule.regulation_set.exists():
                rule.delete()


class RuleViewSet(viewsets.ModelViewSet):
    queryset = Rule.objects.all()
    serializer_class = RuleSerializer

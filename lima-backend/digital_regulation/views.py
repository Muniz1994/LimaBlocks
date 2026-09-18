from rest_framework import viewsets
from .models import Regulation,Rule
from .serializers import RegulationSerializer, RuleSerializer

# My views
class RegulationViewSet(viewsets.ModelViewSet):
    queryset = Regulation.objects.all()
    serializer_class = RegulationSerializer


class RuleViewSet(viewsets.ModelViewSet):
    queryset = Rule.objects.all()
    serializer_class = RuleSerializer

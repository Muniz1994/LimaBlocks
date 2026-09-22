from rest_framework import serializers
from .models import Verification,RuleResult

class RuleResultSerializer(serializers.ModelSerializer):

    class Meta:
        model = RuleResult
        fields = '__all__'

class VerificationSerializer(serializers.ModelSerializer):

    results = RuleResultSerializer(read_only=True)

    class Meta:
        model = Verification
        # Everything but the heavy IDS detail, which the list has no use for -
        # it is fetched one verification at a time by the ids-report action.
        exclude = ['ids_detail']
        read_only_fields = ['ids_status', 'ids_summary', 'ids_checked_at']


class VerificationIdsReportSerializer(serializers.ModelSerializer):

    '''Everything the details modal shows, fetched one verification at a time.'''

    class Meta:
        model = Verification
        fields = ['id', 'ids_status', 'ids_checked_at', 'ids_summary', 'ids_detail']

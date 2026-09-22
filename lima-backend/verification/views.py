from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404
from .models import Verification
from .serializers import VerificationSerializer, VerificationIdsReportSerializer

# Verification views
class VerificationViewSet(viewsets.ModelViewSet):
    queryset = Verification.objects.all()
    serializer_class = VerificationSerializer

    def perform_create(self, serializer):

        serializer.save()

        if serializer.instance.ifc_file:

            serializer.instance.run_ids_check()

    def perform_update(self, serializer):

        '''Re-check the information requirements only when the model itself changed.

        AddFileModal patches ifc_file and xkt_file together, but this is also the
        endpoint that would later patch regulations or a report, and re-running a
        multi-second check for those would be paid for by the user every time.
        Comparing the stored file name across the save is the cheapest reliable
        signal that a new model arrived - and it also catches the file being
        cleared, which correctly resets the verdict.'''

        previous_file = serializer.instance.ifc_file.name

        serializer.save()

        if serializer.instance.ifc_file.name != previous_file:

            serializer.instance.run_ids_check()

    @action(detail=True, methods=['get'], url_path='ids-report')
    def ids_report(self, request, pk=None):

        '''The full IDS result for one verification, for the details modal.'''

        return Response(VerificationIdsReportSerializer(self.get_object()).data)

class VerificationExecuteView(APIView):

    def get_object(self, pk):

        ''' method to verify if the verification exits'''
        try:
            return Verification.objects.get(pk=pk)
        except Verification.DoesNotExist:
            raise Http404
        
    def get(self, request, pk, format=None):

        ''' This is the method responsible to define the response of a GET API call.
        We check is the verification requested exists and then we execute it.

        The response carries the report alongside the console output of the run:

            {"status": "ok" | "error", "report": [...], "console": "..."}

        A rule that raises gives status "error" and a traceback in "console"
        rather than a 500, so the interface can show what went wrong.'''

        verification = self.get_object(pk)

        result = verification.run_verification()

        return Response(result)
    



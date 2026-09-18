from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import Http404
from .models import Verification
from .serializers import VerificationSerializer

# Verification views
class VerificationViewSet(viewsets.ModelViewSet):
    queryset = Verification.objects.all()
    serializer_class = VerificationSerializer

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
    



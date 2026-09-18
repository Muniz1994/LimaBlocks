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
        The report generated is then given as the reponse'''
        
        verification = self.get_object(pk)

        report = verification.run_verification()

        return Response(report)
    



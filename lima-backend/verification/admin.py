from django.contrib import admin
from .models import Verification

# Verification models registration into admin
class VerificationAdmin(admin.ModelAdmin):
    list_display = ['time_executed','ifc_file']


admin.site.register(Verification, VerificationAdmin)

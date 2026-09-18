from django.contrib import admin

from .models import Regulation,  Rule

# Model registration
class RegulationAdmin(admin.ModelAdmin):
    list_display = ["name", "scope"]


class ZoneAdmin(admin.ModelAdmin):
    list_display = ["name", "regulation"]

class RuleAdmin(admin.ModelAdmin):
    list_display = ["name", "text", "external_reference", "code"]

admin.site.register(Regulation, RegulationAdmin)
admin.site.register(Rule, RuleAdmin)
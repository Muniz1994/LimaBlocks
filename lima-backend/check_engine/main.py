if __name__ != '__main__':
    from .CHECKIFC.GeomTools.CheckModel import *
    from .CHECKMODEL.PermitModel import *
    

from django.forms.models import model_to_dict
import ast


# Dictionary that has some of SECClass codes to be used in the verification of the rules 
ROOM_TYPES = {
            "vestibulo":"SL_40_65_94",
            "corredor":"SL_90_10_36",
            "instalacaoSanitaria":"SL_35_80",
            "despensa":"SL_90_50_46",
            "arrecadacao":"SL_90_50_39",
            "sala":"SL_45_10_49",
            "cozinha":"SL_45_10_23",
            "quartoCasal":"SL_45_10_10",
            "quartoDuplo":"SL_45_10_11",
            "quartoSimples":"SL_45_10_07",
            "varanda":"SL_45_10_06",
                }

# Main report class 
class VerificationRecord:
    
    def __init__(self) -> None:
        
        self.checks_executed = []
        
        self.num_checks_executed = 0
        
        self.final_report = []
        
        self.final_report_num = 0
        
        
    def add_check(self, subject, attribute_or_method, comparison, object) -> None:

        ''' The method executes the atomic verification based on a established structure:

        »»»» object.property comparison compared_value

            Ex: door.height >= 2.1

            obs: The objects and properties refer to the PermitModel

            Then, the results are stored in a dictionary, containing information that will be used
            to produce the report. '''

        # Ensure that the comparison parameter is one of "=, >, >=, <, <="
        if comparison not in {'==', '>', '>=', '<', '<='}:
            raise ValueError("Invalid comparison operator")

        try:
            # Split the attribute_or_method into attribute and potential '__len__'
            property = attribute_or_method.rsplit(".")
            
            if len(property) > 1:
                attr, attr2 = property
            else:
                attr = property[0]
            
            # Get the attribute or method value from the object
            value = getattr(subject, attr)

            # If it's a callable (method), call it to get the value
            if callable(value):
                value = value()

            # Handle the special case of comparing the length
            if attribute_or_method.endswith('.__len__'):
                length = len(value)
                value = length
            else:
                length = None

            # Perform the specified comparison
            if comparison == '=':
                result = value == object
            elif comparison == '>':
                result = value > object
            elif comparison == '>=':
                result = value >= object
            elif comparison == '<':
                result = value < object
            elif comparison == '<=':
                result = value <= object
                
            if hasattr(subject,'GlobalId'):
                
                if subject.is_a('IfcSpatialStructureElement'):
                    
                    name = subject.LongName
                    
                else:
                    name= subject.Name
                
                result_dict ={
                    "id":self.num_checks_executed + 1,
                    "type":"check",
                    "result":result,
                    "object_id": subject.GlobalId,
                    "object_name": name,
                    "value":round(value,1)
                }
                
            else:
                
                result_dict ={
                    "id":self.num_checks_executed + 1,
                    "type":"check",
                    "result":result,
                    "object_name": subject.Name,
                    "value":round(value,1)
                }
                
            # Counts one more check
            self.num_checks_executed +=1
            
            # Append the dictionary with results to the execyted checks list to produce the report
            self.checks_executed.append(result_dict)
            
        except AttributeError:

            raise AttributeError(f"'{subject.__class__.__name__}' object has no attribute '{attribute_or_method}'")
        
    def add_alert(self, subject, attribute_or_method, comparison, object, message) -> None:

        ''' The method executes the atomic verification based on a established structure:

        »»»» object.property comparison compared_value

            Ex: door.height >= 2.1

            obs: The objects and properties refer to the PermitModel

            Then, the results are stored in a dictionary, containing information that will be used
            to produce the report. '''

        # Ensure that the comparison parameter is one of "=, >, >=, <, <="
        if comparison not in {'==', '>', '>=', '<', '<='}:
            raise ValueError("Invalid comparison operator")

        try:
            # Split the attribute_or_method into attribute and potential '__len__'
            property = attribute_or_method.rsplit(".")
            
            if len(property) > 1:
                attr, attr2 = property
            else:
                attr = property[0]
            
            # Get the attribute or method value from the object
            value = getattr(subject, attr)

            # If it's a callable (method), call it to get the value
            if callable(value):
                value = value()

            # Handle the special case of comparing the length
            if attribute_or_method.endswith('.__len__'):
                length = len(value)
                value = length
            else:
                length = None

            # Perform the specified comparison
            if comparison == '=':
                result = value == object
            elif comparison == '>':
                result = value > object
            elif comparison == '>=':
                result = value >= object
            elif comparison == '<':
                result = value < object
            elif comparison == '<=':
                result = value <= object
                
            if hasattr(subject,'GlobalId'):
                
                if subject.is_a('IfcSpatialStructureElement'):
                    
                    name = subject.LongName
                    
                else:
                    name= subject.Name
                
                result_dict ={
                    "id":self.num_checks_executed + 1,
                    "type":"alert",
                    "result":result,
                    "object_id": subject.GlobalId,
                    "object_name": name,
                    "value":round(value,1),
                    "message": message
                }
                
            else:
                
                result_dict ={
                    "id":self.num_checks_executed + 1,
                    "type":"alert",
                    "result":result,
                    "object_name": subject.Name,
                    "value":round(value,1),
                    "message": message
                }
                
            # Counts one more check
            self.num_checks_executed +=1
            
            # Append the dictionary with results to the execyted checks list to produce the report
            self.checks_executed.append(result_dict)
            
        except AttributeError:

            raise AttributeError(f"'{subject.__class__.__name__}' object has no attribute '{attribute_or_method}'")


        
    def addRef(self, ref, name):
        
        self.final_report.append({"id": self.final_report_num +1 ,"reference":ref,"name":name ,"checks":self.checks_executed})
        
        self.final_report_num +=1
        
        self.checks_executed = []


class ComplianceCheck:

    # Constructor
    def __init__(self, _rule_set, _building_path):
        
        # List of rule objects to be executed 
        self.rule_set = _rule_set

        # Creates a new report object to contain the results of the compliance check
        self.report = VerificationRecord()

        # Creates the PermitModel object that contains the mapping between IFC concepts and Permit concepts
        self.permit_model = PermitModel(CheckModel(_building_path))
        
        # Here is the namespace for the python code execution, which is extremely important 
        # cause controls what can accessed through the code execution method, helping preventing 
        # code injection risks.

        self.local_vars = {
            "add_check": self.report.add_check,
            "add_alert": self.report.add_alert,
            "my_permit_model": self.permit_model,
            "room_types": ROOM_TYPES
            }

    def execute(self) -> None:
        
        """ Iterates through every rule in the digital regulation and executes the rule code"""

        for rule in self.rule_set:

            self.exec_code(rule.code, self.local_vars)
            
            self.report.addRef(rule.external_reference, rule.name)
    

    def exec_code(self, _code, _local_vars) -> None:

        ''' Parse and execute the textual python code. Some local variables are defined to prevent code injection
        
        A disscussion about the security issues and the measures to mitigate it can be found
        at this link: https://realpython.com/python-exec/'''
        
        parsed_code = ast.parse(_code)

        exec(compile(parsed_code, filename="", mode="exec"), _local_vars)


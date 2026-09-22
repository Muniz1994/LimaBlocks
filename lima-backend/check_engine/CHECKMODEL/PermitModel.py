from ..CHECKIFC.GeomTools.Selector import get_classification
from ..CHECKIFC.GeomTools.GeometricFunctions import *
from ..CHECKIFC.GeomTools.CheckModel import CheckModel
from ifcopenshell.util.element import get_pset
import trimesh
from dataclasses import dataclass
from typing import Optional, List
import numpy as np
from scipy.spatial import cKDTree



# ------------------------------------------------------------------------------------------------------
#  Permit Object Model
# ------------------------------------------------------------------------------------------------------

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

# ------------------------------------------------------------------------------------------------------
# Parent class

@dataclass
class PermitObject:
    
    data: object
    model: object = None
    
    # This serves to give the class the attributes of the object assigned to the data attribute
    def __getattr__(self, attr):
        return PermitObject(getattr(self.data,attr)).data
    
    # This method provides a direct way to connect
    def get_connection(self, ifc_class, model_obj_type) -> List:
        
        query_result = self.model.select('@ #%s & .%s'%(str(self.data.ifc.GlobalId),ifc_class))

        if query_result:
            return [model_obj_type(obj, self.model) for obj in query_result]
        else:
            return []
        
    def get_property(self,pset,property):
        
        if get_pset(self.data.ifc,pset):
            if property in get_pset(self.data.ifc,pset):
                return get_pset(self.data.ifc,pset)[property]

        return None
    
    def get_class(self):
        
        classification = get_classification(self.data)
        if classification:
            
            return classification.Identification

# ------------------------------------------------------------------------------------------------------           
@dataclass
class Stair(PermitObject):
    
    def __init__(self,data,model):
        super().__init__(data,model)
        
        # Direct mapping attribute -> native IFC property
        self.treadLength = self.get_property("Pset_StairCommon","TreadLength")

        # Direct mapping attribute -> native IFC property
        self.riserHeight = self.get_property("Pset_StairCommon","RiserHeight")

# ------------------------------------------------------------------------------------------------------    
@dataclass
class Space(PermitObject):
    
    def __init__(self,data,model):
        super().__init__(data,model)
        
        self.objectClass: Optional[object] = self.get_class()
        
    # Calculated value
    def area(self):
        return get_footprint_area(self.data.mesh)
    
    # Calculated value
    def ceilingHeight(self):
        return self.data.mesh.bounding_box_oriented.extents[2]
    
# ------------------------------------------------------------------------------------------------------        
@dataclass
class Dwelling(PermitObject):
    
    def __init__(self,data,model):
        super().__init__(data,model)

        # Direct mapping attribute -> attribute
        self.name = self.data.LongName

        # Definition of relationship Dwelling -> related spaces 
        self.relatedSpaces: List[Space] = [Space(space, self.model) for space in self.model.select('.IfcSpace[PermitCheck.AssociatedDwelling="%s"]'%self.name)]

    # Calculated value
    def gross_area(self):
        return get_footprint_area(self.data.mesh) 
    
    # Calculated value
    def habitable_area(self):
        
        habitable_spaces = [space for space in self.relatedSpaces if space.objectClass not in [ROOM_TYPES["vestibulo"], ROOM_TYPES["corredor"],ROOM_TYPES["instalacaoSanitaria"]]] 
        
        return sum([space.area() for space in habitable_spaces])
    
    # Calculated value
    def num_of_bedrooms(self):
        
       return self.num_of_room_per_class([ROOM_TYPES["quartoCasal"],ROOM_TYPES["quartoSimples"],ROOM_TYPES["quartoDuplo"]])
    
    # Calculated value
    def num_of_kitchens(self):
        return self.num_of_room_per_class([ROOM_TYPES["cozinha"]])
    
    # Calculated value
    def num_of_living_rooms(self):
        return self.num_of_room_per_class([ROOM_TYPES["sala"]])
    
    # Auxiliary method
    def num_of_room_per_class(self, list_of_classes):
        num_of_rooms = 0
        for space in self.relatedSpaces:
                
                if space.objectClass in list_of_classes:
                    
                    num_of_rooms +=1
                    
        return num_of_rooms
        
# ------------------------------------------------------------------------------------------------------         
@dataclass
class BuildingStorey(PermitObject):
    
    def __init__(self,data,model):
        super().__init__(data,model)

        # Definition of relationship Building Storey -> related spaces
        self.spaces: List[Space] = self.get_connection('IfcSpace !(.ifcSpace[classification.Identification="SL_22_15"]|.ifcSpace[classification.Identification="SL_22_05"]|.ifcSpace[classification.Identification="SL_22_10"]|.ifcSpace[classification.Identification="SL_22_10_05"])',Space) 
        
        # Direct mapping attribute -> native IFC property
        self.isAboveGround: Optional[bool] = self.get_property("Pset_BuildingStoreyCommon","AboveGround")
   
    # Calculated value
    def gross_area(self):
        
        storey = self.model.select('@ #%s & (.IfcWall | .IfcSpace[classification.Identification!="SL_45_10_06"]) ! (.IfcSpace[classification.Identification="SL_22_05"] | .IfcSpace[classification.Identification="SL_22_15"]| .IfcSpace[classification.Identification="SL_22_10"]| .IfcSpace[classification.Identification="SL_22_10_05"])'%self.data.GlobalId)
        
        return get_projected_area_of_elements(storey)
# ------------------------------------------------------------------------------------------------------    
@dataclass
class Elevator:
    pass

# ------------------------------------------------------------------------------------------------------    
class Building(PermitObject):
    
    def __init__(self,data,model):
        
        super().__init__(data,model)
        
        # Direct mapping attribute -> custom property
        self.category: Optional[object] = self.get_property("PermitCheck","Category")

        # Direct mapping attribute -> custom property
        self.uses: Optional[object] = self.get_property("PermitCheck","Uses")

        # Direct mapping attribute -> custom property
        self.isNewConstruction: Optional[object] = self.get_property("PermitCheck","IsNewConstruction")

        # Definition of relationship and mapping class -> IFC class with a certain predefined type
        self.elevators: List[Elevator] = self.get_connection('IfcTransportElement[PredefinedType = "ELEVATOR"]', Elevator) 

        # Definition of relationship and direct mapping class -> IFC class
        self.buildingStoreys: List[BuildingStorey] = self.get_connection('IfcBuildingStorey', BuildingStorey) 

        # Definition of relationship and direct mapping class -> IFC class
        self.stairs: List[Stair] = self.get_connection('IfcStair', Stair) 

        # Definition of relationship and mapping class -> IFC class with a certain class in classification system 
        self.dwellings: List[Dwelling] = self.get_connection('IfcSpace[classification.Identification="SL_22_15"]', Dwelling)

        # Definition of relationship and mapping class -> IFC class with a certain class in classification system 
        self.thresholdLevel = self.model.select('.IfcBuildingStorey[classification.Identification="En_95_05"]')[0].Elevation

        # Auxiliary attribute to get value by calculation
        self.front_mesh = self.model.select('.IfcSpace[classification.Identification ="SL_22_10_05"]')[0].mesh

        self.above_ground_storeys = [storey for storey in self.buildingStoreys if storey.isAboveGround]

        # Auxiliary attribute to get value by calculation
        self.building_mesh = self.get_building_mesh()
        
    # Calculated value
    def floor_to_floor_height(self):
        
        storeys = self.buildingStoreys

        sorted_storeys= sorted(storeys, key=lambda x: x.Elevation)
            
        difference = []
        
        for i in range(len(sorted_storeys) - 1):
            # Calculate the difference between the current number and the next number
            diff = sorted_storeys[i + 1].Elevation - sorted_storeys[i].Elevation
            difference.append(diff)
            
        return min(difference)

    # Calculated value
    def depth(self):
        
        return self.get_empena().bounding_box.extents[0]

    # Calculated value
    def height(self):

        elements_highest_elevation = get_most_distant_point_in_axis(self.building_mesh,'Z')[2]
        
        return elements_highest_elevation - self.thresholdLevel
    
    # Calculated value
    def heighest_point(self):
        
        return get_most_distant_point_in_axis(self.building_mesh,'Z')[2]
    
    # Auxiliary method
    def get_building_mesh(self):
        building_elements = self.model.select('@ #%s ! (.IfcSpace[classification.Identification="SL_22_05"] | .IfcSpace[classification.Identification="SL_22_10_05"] |.IfcSpace[classification.Identification="SL_22_10"] | .IfcSite)'%str(self.data.ifc.GlobalId))

        return sum([b.mesh for b in building_elements])
    
    # auxiliary method
    def get_empena(self):
        building_elements = self.model.select('@ #%s & .IfcWall'%str(self.data.ifc.GlobalId))

        under_walls = []

        for wall in building_elements:
            # Access the y-coordinates (second column, index 1)
            y_coordinates = wall.mesh.vertices[:, 2]

            # Check if any y-coordinate is lower than 0
            if not np.any(y_coordinates < 0):
                # If so, remove the wall from the list
                under_walls.append(wall)

        return sum([b.mesh for b in under_walls])
    
# ------------------------------------------------------------------------------------------------------    
class FrontStreet(PermitObject):
    def __init__(self,data,model):
        super().__init__(data,model)

        # Calculated value
        self.axis:object = self.data.mesh.centroid
    
# ------------------------------------------------------------------------------------------------------    
class Parcel(PermitObject):
    
    def __init__(self,data,model):
        super().__init__(data,model)
        
        # Definition of relationship and direct mapping class -> IFC class
        self.buildings: List[Building] =  [Building(self.model.select('.IfcBuilding')[0],self.model)]

        # Definition of relationship and direct mapping class -> IFC class with a certain class in classification system
        self.frontStreet: FrontStreet = FrontStreet(self.model.select('.IfcSpace[classification.Identification ="SL_22_10_05"]')[0],self.model)

    # Calculated value
    def depth(self):
        
        return get_depth(self.data.mesh,self.frontStreet.mesh)

    # Calculated value
    def area(self):
        
        return(get_projected_area_of_element(self.data.mesh))

    # Calculated value
    def buildabilityIndex(self):
        
        all_gfa = 0
        
        for building in self.buildings:
            for bs in building.buildingStoreys:
                
                all_gfa += bs.gross_area()
                
        return all_gfa/self.area()        
                
    # Calculated value
    def grossFloorArea(self):
        
        gfa = 0
         
        for building in self.buildings:
            for bs in building.buildingStoreys:
                
                gfa += bs.gross_area()
                
        return gfa
    
    # Calculated value
    def alignment(self):
        
        terrainp = get_projected_meshes([self.data],self.frontStreet.mesh.vertices[np.argmax(self.frontStreet.mesh.vertices[:, 2])])

        streetp = get_projected_meshes([self.frontStreet],self.frontStreet.mesh.vertices[np.argmax(self.frontStreet.mesh.vertices[:, 2])])

        # Create a KD-Tree for the first mesh vertices
        tree = cKDTree(terrainp.vertices)

        # Initialize arrays to store closest points and distances
        closest_points = []
        distances = []

        # Loop through the vertices of the second mesh
        for vertex in streetp.vertices:
            # Query the KD-Tree to find the nearest point in the first mesh
            distance, index = tree.query(vertex)
            
            # Append the closest point and distance to the arrays
            closest_points.append(terrainp.vertices[index])
            distances.append(distance)

        # Convert lists to NumPy arrays
        closest_points = np.array(closest_points)
        distances = np.array(distances)

        segments = [(closest_points[i], closest_points[i + 1]) for i in range(len(closest_points) - 1)]

        line = trimesh.load_path(segments)
        
        return line
    
    # Calculated value
    def building_implantation_range(self):
        
        ranges = []
        
        for building in self.buildings:
            
            ranges.append(get_distance_object_to_point(self.alignment(),get_most_distant_point_in_axis(building.building_mesh,"Y")))
        return max(ranges)

# ------------------------------------------------------------------------------------------------------    
class PermitModel(PermitObject):
    
    def __init__(self, model):
        
        self.model:CheckModel = model
        self.parcels:List[Parcel] = [Parcel(site, self.model) for site in self.model.select('.IfcSpace[classification.Identification ="SL_22_05"]')]










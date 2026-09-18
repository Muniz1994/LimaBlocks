import ifcopenshell
from ifcopenshell.util.element import get_pset

ifc_file = ifcopenshell.open("/content/BuildingPaper.V8.ifc")

storeys = ifc_file.by_type("IfcBuildingStorey")

storeys_above_ground = []
for storey in storeys:
    if get_pset(storey,"Pset_BuildingStoreyCommon"):
        if "AboveGround" in get_pset(storey,"Pset_BuildingStoreyCommon"):
            get_pset(storey,"Pset_BuildingStoreyCommon")["AboveGround"]

            if get_pset(storey,"Pset_BuildingStoreyCommon")["AboveGround"] == True:
                storeys_above_ground.append(storey)

buildings = ifc_file.by_type("IfcBuilding")

for building in buildings:
    if get_pset(buildings,"Pset_BuildingCommon"):
        if "Category" in get_pset(buildings,"Pset_BuildingCommon"):
            if get_pset(buildings,"Pset_BuildingCommon")["Category"] == "Rural Hotel":
                if len(storeys_above_ground) <= 3:
                    print("passed!")
                else:
                    print("failed!")
            else:
                if len(storeys_above_ground) <= 2:
                    print("passed!")
                else:
                    print("failed!")
                    
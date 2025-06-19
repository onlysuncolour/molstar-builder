import { TStructureRef } from "../../interface";
import { StructureHierarchyManager } from "molstar/lib/mol-plugin-state/manager/structure/hierarchy";

export function getComponentGroupsByStructure(structureRef: TStructureRef) {
  if (!structureRef) return []
  return StructureHierarchyManager.getComponentGroups([structureRef]);
}
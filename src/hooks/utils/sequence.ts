import { Structure, StructureElement, StructureProperties } from "molstar/lib/mol-model/structure";
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects";
import { TMolstarPlugin } from "../../interface";

export function getStructure(plugin: TMolstarPlugin, ref: string) {
  const state = plugin.state.data;
  const cell = state.select(ref)[0];
  if (!ref || !cell || !cell.obj) return Structure.Empty;
  return (cell.obj as PluginStateObject.Molecule.Structure).data;
}

export function splitModelEntityId(modelEntityId: string) {
  const [modelIdx, entityId] = modelEntityId.split('|');
  return [parseInt(modelIdx), entityId];
}

export function opKey(l: StructureElement.Location) {
  const ids = StructureProperties.unit.pdbx_struct_oper_list_ids(l);
  const ncs = StructureProperties.unit.struct_ncs_oper_id(l);
  const hkl = StructureProperties.unit.hkl(l);
  const spgrOp = StructureProperties.unit.spgrOp(l);
  return `${ids.sort().join(',')}|${ncs}|${hkl}|${spgrOp}`;
}
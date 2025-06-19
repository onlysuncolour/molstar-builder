import { StructureElement } from "molstar/lib/mol-model/structure";
import { Interval } from "molstar/lib/mol-data/int";
import { TStructure } from "../interface";

export default function getLoci(seqIdx: number, structure: TStructure) {
  // 这个seqIndex是atom的index，不是氨基酸的index
  const { units } = structure;
  const lociElements: StructureElement.Loci['elements'][0][] = [];
  let offset = 0;
  for (let i = 0, il = units.length; i < il; ++i) {
    const unit = units[i];
    if (seqIdx < offset + unit.elements.length) {
      lociElements.push({ unit, indices: Interval.ofSingleton(seqIdx - offset) });
      break;
    }
    offset += unit.elements.length;
  }
  return StructureElement.Loci(structure, lociElements);
}
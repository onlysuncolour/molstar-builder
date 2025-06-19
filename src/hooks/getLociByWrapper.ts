import { TLociChainInfo, TStructure, TWrapper } from "../interface";
import { SequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/wrapper";
import { getWrapperAsymId, getWrapperSequence, getWrapperUnit } from "./utils/wrapper";
import { Interval } from "molstar/lib/mol-data/int";
import { StructureElement } from "molstar/lib/mol-model/structure";

export default function getLociByWrapper({
  structure,
  // structureKey,
  lociInfo,
  wrappers,
}: {
  structure: TStructure,
  // structureKey: string,
  lociInfo: TLociChainInfo,
  wrappers: TWrapper[]
}) {
    const _wrapper = wrappers.find(w => getWrapperAsymId(w.wrapper) === (lociInfo.chain || 'A'))
    if (!_wrapper) return undefined;

    const wrapper = _wrapper.wrapper as SequenceWrapper.Any;
    const unit = getWrapperUnit(wrapper)!;
    const sequence = getWrapperSequence(wrapper)!;
    const index = lociInfo.index;
    const realIndex = sequence.get(index)!;
    if (realIndex === undefined) {
      return undefined
    }
    const eleIndex = unit.polymerElements[realIndex] - unit.polymerElements[0];
    const lociElements = [{ unit, indices: Interval.ofSingleton(eleIndex) }]
    return StructureElement.Loci(structure, lociElements);
}
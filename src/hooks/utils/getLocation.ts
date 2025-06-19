import { Unit } from "molstar/lib/mol-model/structure";
import { Loci } from "molstar/lib/mol-model/structure/structure/element/loci";
import { SequenceWrapper as TSequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/wrapper";

import { TLocation, TWrapper, TStructure, EProteinStatus, TProtein } from "../../interface";
import { Stats } from "../loci-stats";
import { isEmpty } from "../../utils";

export function getLocationByChainIndex({
  protein,
  chainIndexInfo
}: {
  protein: TProtein,
  chainIndexInfo: {
    index: number;
    chain?: string;
  }
}): TLocation | undefined {
  if (protein.status !== EProteinStatus.LOADED) {
    return
  }
  const chain = chainIndexInfo.chain || 'A';
  const chainIndex = chainIndexInfo.index;

  const molData = protein.molData;
  const structureWrappers = molData.wrappers;
  const structure = molData.structure;

  let chainStartIndex = -1, chainEndIndex = -1, chainIndexArray: number[] = [], asmIdArray: string[] = [], compIdList: string[] = [], compIdList2: string[] = [], atomIdList: number[] = [];
  try {
    // @ts-ignore
    const groupList = structure.model.sourceData.data.db.atom_site.group_PDB.toArray() as string[]
    // @ts-ignore
    chainIndexArray = structure.model.sourceData.data.db.atom_site.auth_seq_id.toArray() as number[]
    // @ts-ignore
    asmIdArray = structure.model.sourceData.data.db.atom_site.auth_asym_id.toArray() as string[]
    // @ts-ignore
    compIdList = structure.model.sourceData.data.db.atom_site.auth_comp_id.toArray() as string[]
    // @ts-ignore
    compIdList2 = structure.model.sourceData.data.db.atom_site.label_comp_id.toArray() as string[]
    // @ts-ignore
    atomIdList = structure.model.sourceData.data.db.atom_site.id.toArray() as number[]

    chainStartIndex = asmIdArray.indexOf(chain), chainEndIndex = asmIdArray.lastIndexOf(chain);
  } catch (error) {

  }

  const elements: number[] = [];
  const arraySample = Array.from({ length: chainIndexArray.length });
  const eleStart = arraySample.findIndex((e, i) => asmIdArray[i] === chainIndexInfo.chain && chainIndexArray[i] === chainIndexInfo.index),
    // @ts-ignore
    eleEnd = arraySample.findLastIndex((e, i) => asmIdArray[i] === chainIndexInfo.chain && chainIndexArray[i] === chainIndexInfo.index);

  for (let i = eleStart; i <= eleEnd; i++) {
    elements.push(atomIdList[i])
  }

  let atomIndex = elements[0] - 1, chainGroupId: number | undefined, wrapperKey, loci;

  const chainStartPosition = chainIndexArray[chainStartIndex]
  const seqIdx = chainIndexInfo.index - chainStartPosition;

  if (structure?.units && atomIndex !== undefined) {
    for (let i = 0; i < structure?.units.length; i++) {
      const unit = structure?.units[i];
      const unitElements = Array.from(unit.elements);
      const elementStart = unitElements[0] as number, elementEnd = unitElements[unitElements.length - 1] as number;

      if (atomIndex >= elementStart && atomIndex <= elementEnd) {
        chainGroupId = unit.chainGroupId;

        break
      }
    }
  }

  let wrapper;

  if (chainGroupId !== undefined && !!structureWrappers) {
    wrapper = structureWrappers.find(w => w.chainGroupId === chainGroupId);
    wrapperKey = wrapper?.key;
    if (typeof wrapper?.wrapper !== 'string' && seqIdx !== -1 && seqIdx !== undefined) {
      loci = wrapper!.wrapper.getLoci(seqIdx as number)
    }
  }

  return {
    loci,
    chainType: wrapper?.chainType,
    // @ts-ignore
    chainName: wrapper?.wrapper?.asymId || asmIdArray[atomIndex],
    structureKey: molData.structureKey!,
    wrapperKey,
    chainGroupId: chainGroupId!,
    atomIndex,
    elements,
    seqIdx,
    chainIndex,
    molecule: compIdList[atomIndex] || compIdList2[atomIndex],
  }
}

function getLocationByAtomIndex({
  atomIndex,
  structure,
  unit,
  proteins,
  loci
}: {
  atomIndex: number,
  structure: TStructure,
  unit: Unit,
  proteins: TProtein[],
  loci?: Loci
}): TLocation | undefined {
  const elements: number[] = [];
  const chainGroupId = unit.chainGroupId;

  const protein = proteins.find(p => p.status === EProteinStatus.LOADED && p.molData?.modelId === structure.model.id) as TProtein
  if (!protein) {
    return undefined
  }

  const molData = protein.molData;
  const wrappers = molData.wrappers;
  if (!wrappers) {
    return undefined
  }

  const wrapper = wrappers.find(w => w.chainGroupId === chainGroupId);

  if (!wrapper) {
    return undefined
  }

  let chainIndex = -1, asmIdArray: string[] = [], compIdList: string[] = [], compIdList2: string[] = [];
  try {
    // @ts-ignore
    chainIndex = structure?.model.sourceData.data.db.atom_site.auth_seq_id.toArray()[atomIndex] as number
    // @ts-ignore
    asmIdArray = structure.model.sourceData.data.db.atom_site.auth_asym_id.toArray() as string[]
    // @ts-ignore
    compIdList = structure.model.sourceData.data.db.atom_site.auth_comp_id.toArray() as string[]
    // @ts-ignore
    compIdList2 = structure.model.sourceData.data.db.atom_site.label_comp_id.toArray() as string[]

  } catch (error) {

  }

  // 获取在当前unit中的相对索引
  const unitElements = Array.from(unit.elements) as number[];
  const unitIndex = unitElements.indexOf(atomIndex);
  // 使用相对索引获取seqIdx
  // @ts-ignore
  const seqIdx = unitIndex !== -1 ? unit?.residueIndex[atomIndex] : undefined;
  
  // @ts-ignore
  const residueIndex = Array.from(unit.residueIndex);

  for (let i = atomIndex; i < residueIndex.length; i++) {
    const value = residueIndex[i];
    if (value === seqIdx) {
      elements.push(i);
    } else {
      break
    }
  }

  const wrapperKey = wrapper.key;
  if (!loci && typeof wrapper.wrapper !== 'string') {
    // @ts-ignore
    loci = wrapper.wrapper.getLoci(seqIdx)
  }

  return {
    // @ts-ignore
    loci,
    chainType: wrapper?.chainType,
    // @ts-ignore
    chainName: wrapper?.wrapper?.asymId || asmIdArray[atomIndex],
    structureKey: molData.structureKey!,
    wrapperKey,
    elements,
    chainGroupId,
    atomIndex,
    seqIdx,
    chainIndex,
    molecule: compIdList[atomIndex] || compIdList2[atomIndex],
  }
}

export function getLocationByStats({
  stats,
  loci,
  proteins,
}: {
  stats: Stats,
  loci?: Loci
  proteins: TProtein[]
}): TLocation[] | undefined {

  if (stats.chainCount >= 1 || stats.structureCount >= 1 || stats.unitCount >= 1) {
    const structure = stats.firstChainLoc.structure || stats.firstUnitLoc.structure || stats.firstStructureLoc.structure;
    let units: Unit[] = []
    if (stats.unitCount >= 1 || stats.unitCount >= 1) {
      units = stats.unitLocs.map(loc => loc.unit);
    } else {
      // @ts-ignore
      units = stats.firstStructureLoc.structure.units;
    }
    const locations: TLocation[] = [];
    units.forEach(unit => {
      let elements: number[] = []
      if (!isEmpty(unit.polymerElements)) {
        elements = Array.from(unit.polymerElements)
      } else {
        let lastResidue = -1
        // @ts-ignore
        unit.residueIndex = unit.residueIndex || []
        Array.from(unit.elements).forEach((element) => {
          // @ts-ignore
          if (lastResidue !== unit.residueIndex[element]) {
            elements.push(element)
            // @ts-ignore
            lastResidue = unit.residueIndex[element]
          }
        })
      }
      elements.forEach(atomIndex => {
        const location = getLocationByAtomIndex({
          atomIndex,
          // @ts-ignore
          structure,
          unit,
          proteins,
        })
        if (location) {
          locations.push(location)
        }
      })
    });
    return locations;
  }

  const atomIndex = stats.firstElementLoc.element
  const structure = stats.firstElementLoc.structure || stats.firstStructureLoc.structure;
  const unit = stats.firstElementLoc.unit || stats.firstStructureLoc.unit;

  const location = getLocationByAtomIndex({
    atomIndex,
    // @ts-ignore
    structure,
    unit,
    proteins,
    loci
  })
  if (!location) return [];
  if (stats.residueCount > 1) {
    let result = [location]
    const protein = proteins.find(p => p.key === location.structureKey) as TProtein
    for (let i = 1; i < stats.residueCount; i++) {
      const _location = getLocationByChainIndex({
        protein,
        chainIndexInfo: {
          chain: location.chainName,
          index: location.chainIndex + i
        }
      })
      if (_location) {
        result.push(_location)
      }
    }
    return result
  }

  return [location]
}

export function getLocationBySeqIdx({
  seqIdx,
  protein,
}: {
  seqIdx: number,
  protein: TProtein
}): TLocation | undefined {
  if (protein.status !== EProteinStatus.LOADED) {
    return undefined
  }
  const molData = protein.molData;
  const structure = molData.structure as TStructure;
  // @ts-ignore
  const units = structure.units as Unit.Atomic[];
  const residueIndex = Array.from(units[0]?.residueIndex) as number[];
  const atomIndex = residueIndex.indexOf(seqIdx);
  const elements: number[] = [];

  if (atomIndex === -1) return;
  const targetUnit = units.find(u => (Array.from(u.elements) as number[]).includes(atomIndex));
  if (!targetUnit) return;

  const chainGroupId = targetUnit.chainGroupId;
  const wrapper = molData.wrappers?.find(w => w.chainGroupId === chainGroupId) as TWrapper;
  if (!wrapper) return;
  const wrapperKey = wrapper.key;
  for (let i = atomIndex; i < residueIndex.length; i++) {
    const value = residueIndex[i];
    if (value === seqIdx) {
      elements.push(i);
    } else {
      break
    }
  }

  let chainIndex = -1, asmIdArray: string[] = [], compIdList: string[] = [], compIdList2: string[] = [];
  try {
    // @ts-ignore
    chainIndex = structure?.model.sourceData.data.db.atom_site.auth_seq_id.toArray()[atomIndex] as number
    // @ts-ignore
    asmIdArray = structure.model.sourceData.data.db.atom_site.auth_asym_id.toArray() as string[]
    // @ts-ignore
    compIdList = structure.model.sourceData.data.db.atom_site.auth_comp_id.toArray() as string[]
    // @ts-ignore
    compIdList2 = structure.model.sourceData.data.db.atom_site.label_comp_id.toArray() as string[]

  } catch (error) {

  }

  // @ts-ignore
  const loci = (wrapper.wrapper as TSequenceWrapper.Any).getLoci(seqIdx);

  return {
    // @ts-ignore
    loci,
    chainType: wrapper?.chainType,
    // @ts-ignore
    chainName: wrapper?.wrapper?.asymId || asmIdArray[atomIndex],
    structureKey: molData.structureKey!,
    wrapperKey,
    chainGroupId: chainGroupId!,
    atomIndex,
    elements,
    seqIdx,
    chainIndex,
    molecule: compIdList[atomIndex] || compIdList2[atomIndex],
  }
}

export function isLocationListEqual(a: TLocation[], b: TLocation[]) {
  if (a.length !== b.length) return false;
  const aArr = a.map(item => `${item.chainName}${item.chainIndex}`).sort();
  const bArr = b.map(item => `${item.chainName}${item.chainIndex}`).sort();
  return aArr.every((item, index) => item === bArr[index])
}


// export function getMoleculeByWrapper(wrapper?: TWrapper, index?: number) {
//   if (!wrapper || index === undefined) {
//     return ''
//   }
//   if (typeof wrapper.wrapper === 'string') {
//     return 'ERR'
//   }
//   // @ts-ignore
//   if (isArray(wrapper.wrapper.sequence)) {
//     // const index = wrapper.wrapper.sequenceIndices
//     // const indices = Array.from(wrapper.wrapper?.sequenceIndices as Set<[number, number]>)
//     // const index = indices.find(d => d[0] === index)?.[1]
//     // if (index === undefined) {
//     //   return 'X'
//     // }
//     return wrapper.wrapper.sequence[index]
//   }
//   return wrapper.wrapper.residueLabel(index)
// }

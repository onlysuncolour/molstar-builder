import { StructureSelectionQueries } from "molstar/lib/mol-plugin-state/helpers/structure-selection-query";
import { EProteinStatus, TLocation, TProtein, TStructure } from "../../interface";
import { QueryContext, StructureSelection, Unit } from "molstar/lib/mol-model/structure";
import { SortedArray } from "molstar/lib/mol-data/int";
import { compile } from "molstar/lib/mol-script/runtime/query/compiler";
import { getLocationBySeqIdx } from "./getLocation";


const surroundingQuery = StructureSelectionQueries.surroundings;
type Props = {
  // plugin: TMolstarPlugin;
  residues: TLocation[];
  proteins: TProtein[];
  radius?: number
}
export default async function getSurrounding({
  // plugin,
  residues,
  proteins,
  radius = 5,
}: Props) {
  const proteinResidureMapping:{protein: TProtein, residues: TLocation[]}[] = [];
  residues.forEach(residure => {
    const protein = proteins.find(p => residure.structureKey === p.molData?.structureKey);
    if (!protein || protein.status !== EProteinStatus.LOADED) return;
    let mapping = proteinResidureMapping.find(d => d.protein === protein);
    if (!mapping) {
      mapping = {
        protein,
        residues: []
      }
      proteinResidureMapping.push(mapping);
    }
    mapping.residues.push(residure);
  });

  const mockSelectionParams = proteinResidureMapping.map(({protein, residues}) => {
    const structure = protein.molData?.structure!,
    // @ts-ignore
    units = structure.units as Unit.Atomic[],
    currentStructure = {
      ...structure,
      state: {
        hashCode: -1,
        transformHash: -1,
        elementCount: 0,
        bondCount: -1,
        uniqueElementCount: -1,
        atomicResidueCount: -1,
        polymerResidueCount: -1,
        polymerGapCount: -1,
        polymerUnitCount: -1,
        dynamicBonds: false,
        // @ts-ignore
        coordinateSystem: structure.state.coordinateSystem,
        label: ""
      },
      unitIndexMap: new Map(),
      unitMap: new Map(),
      units: [] as Unit.Atomic[]
    },
    residureChainMapping: {[chainId: number | string] : TLocation[]} = {};
    let elementCount = 0;
    residues.forEach(r => {
      const chainId = r.chainGroupId;
      if (!residureChainMapping[chainId]) {
        residureChainMapping[chainId] = [];
      }
      residureChainMapping[chainId].push(r);
    });

    Object.keys(residureChainMapping).forEach((chainIdS, i) => {
      const residues = residureChainMapping[chainIdS],
      chainId = parseInt(chainIdS);

      const elements:number[] = []
      residues.forEach((residure) => {
        elements.push(...residure.elements)
      })
      const unit = {
        ...units[chainId],
        elements: SortedArray.ofSortedArray(elements.sort((a,b)=>a-b))
      };
      elementCount += elements.length;
      currentStructure.units.push(unit as Unit.Atomic);
      (currentStructure.unitMap as Map<number, Unit.Atomic>).set(chainId, unit as Unit.Atomic);
      (currentStructure.unitIndexMap as Map<number, number>).set(chainId, i);
    })

    currentStructure.state.elementCount = elementCount

    // @ts-ignore
    const currentSelection = StructureSelection.Sequence(structure, [currentStructure as unknown as TStructure]);

    return {
      structure,
      currentSelection
    };
  })

  try {
    // @ts-ignore
    surroundingQuery.expression.args[0].args[0].args.radius = radius
  } catch (error) {
    console.error(error)
  }
  const _query = compile<StructureSelection>(surroundingQuery.expression);

  const lociSelections = await Promise.all(mockSelectionParams.map(({
    structure, currentSelection
  }) => {
    // @ts-ignore
    return _query(new QueryContext(structure, { currentSelection }));
  }))

  const locis = lociSelections.flatMap((selection, i) => {
    // @ts-ignore
    const lociStructure = (selection?.structures?.[0] as TStructure);
    const protein = proteins.find(p => mockSelectionParams[i].structure === p.molData?.structure)!;
    if (!lociStructure) return [];

    // @ts-ignore
    const units = lociStructure.units as Unit.Atomic[];
    const residueIndex = Array.from(units[0].residueIndex);
    const seqIdxs:number[] = [];
    units.forEach(unit => {
      const elements = Array.from(unit.elements);
      elements.forEach(element => {
        const seqIdx = residueIndex[element];
        if (seqIdxs[0] !== seqIdx) {
          seqIdxs.unshift(seqIdx);
        }
      })
    })
    return seqIdxs.sort((a,b)=>a-b).map(seqIdx => getLocationBySeqIdx({seqIdx, protein})).filter(t => !!t);
  })

  return locis;
}
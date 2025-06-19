import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDebounceFn, useLatest } from "ahooks"

import { PolymerSequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/polymer"
import { HeteroSequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/hetero"
import { MarkerAction } from "molstar/lib/mol-util/marker-action"
import { StructureSelectionModifier } from "molstar/lib/mol-plugin-state/manager/structure/selection"
import { StructureElement } from "molstar/lib/mol-model/structure"
import { Loci } from "molstar/lib/mol-model/structure/structure/element/loci"

import { TLocation, TMolstarPlugin, } from "../interface"
import { isEmpty } from "../utils"
import { getLocationByStats } from "./utils/getLocation"
import { Stats } from "./loci-stats"
import { TProtein } from "../interface"

type Props = {
  molstarPlugin: TMolstarPlugin
  proteins: TProtein[]
}

function mapLociStatToLociInfo(loci: Loci, stat: StructureElement.Stats) {
  const { firstElementLoc } = stat;
  const { element, unit, structure } = firstElementLoc;

  const chainIndex = Array.from(unit.elements).indexOf(element);
  const chainGroupId = unit.chainGroupId;
  const modelId = structure.model.id;
  // @ts-ignore
  const atomIndex = unit?.residueIndex?.[element]
  const elementIndex = element;
  return {
    loci,
    chainIndex,
    chainGroupId,
    modelId,
    atomIndex,
    elementIndex
  }
}

export function useGetSelection({
  molstarPlugin,
  proteins,
}: Props) {
  const [selections, setSelections] = useState<TLocation[]>([])
  const proteinsLatestRef = useLatest(proteins)
  const selectionLatestRef = useLatest(selections)
  const tempSelectionsRef = useRef<{ add: TLocation[], remove: TLocation[] }>({ add: [], remove: [] })
  const [markerUpdateStatus, setMarkerUpdateStatus] = useState<{[wrapperKey: string]: boolean}>({})
  const syncDebounce = useDebounceFn(sync, { wait: 200 })
  const latestMarkerUpdateStatusRef = useLatest(markerUpdateStatus)

  const markerUpdateQueueRef = useRef<{[wrapperKey: string]: boolean}>({})

  function sync() {
    const { add, remove } = tempSelectionsRef.current
    if (isEmpty(add) && isEmpty(remove)) return selectionLatestRef.current;
    let _selections = [...selectionLatestRef.current, ...add]
    remove.forEach(r => {
      let _index = _selections.findIndex(s => {
        if (s.structureKey === r.structureKey && s.chainGroupId === r.chainGroupId && (s.atomIndex === r.atomIndex || s.chainIndex === r.chainIndex || s.seqIdx === r.seqIdx)) {
          return true
        }
      })
      if (_index !== -1) {
        _selections.splice(_index, 1)
      }
    })
    _selections = _selections.filter((s, index, arr) => {
      return arr.findIndex(s2 => s.structureKey === s2.structureKey && s.chainName === s2.chainName && s.chainIndex === s2.chainIndex) === index
    })
    tempSelectionsRef.current = { add: [], remove: [] }
    setSelections(_selections)
    return _selections
  }

  const modifyRe = useCallback((modifier: StructureSelectionModifier, loci: Loci, callback: Function) => {
    const stats = Stats.ofLoci(loci);
    const location = getLocationByStats({
      stats,
      proteins: proteinsLatestRef.current,
      loci
    })
    if (!location) return;
    if (modifier === 'add') {
      tempSelectionsRef.current.add.push(...location)
    } else if (modifier === 'remove') {
      tempSelectionsRef.current.remove.push(...location)
    }
    syncDebounce.run()
    return callback(modifier, loci)
  }, [])

  const clearRe = useCallback((callback: Function) => {
    setSelections([])
    tempSelectionsRef.current = { add: [], remove: [] };
    return callback()
  }, [])

  useEffect(() => {
    if (!molstarPlugin) {
      return;
    }
    molstarPlugin.behaviors.interaction.selectionMode.next(true)
    const modifyCb = molstarPlugin.managers.structure.selection.modify;
    // @ts-ignore
    molstarPlugin.managers.structure.selection.modify = function (modifier: StructureSelectionModifier, loci: Loci) {
      modifyRe(modifier, loci, modifyCb.bind(molstarPlugin.managers.structure.selection))
    }
    const clearCb = molstarPlugin.managers.structure.selection.clear;
    molstarPlugin.managers.structure.selection.clear = () => {
      return clearRe(clearCb.bind(molstarPlugin.managers.structure.selection))
    }
  }, [molstarPlugin])

  const handleRangeSelection = useCallback((wrapper: PolymerSequenceWrapper | HeteroSequenceWrapper, _start: number, _end: number) => {
    const [start, end] = [_start, _end].sort((a, b) => a - b);
    const _selections = sync();
    const range = Array.from({ length: end - start + 1 }).map((_, i) => start + i), _range = [...range];
    _selections.forEach(({
      wrapperKey, seqIdx
    }) => {
      if (wrapperKey === wrapperKey && seqIdx! >= start && seqIdx! <= end) {
        let index = range.indexOf(seqIdx!);
        if (index !== -1) {
          range[index] = -1
        }
      }
    });
    let outs = range.filter(v => v !== -1);
    if (outs.length === 0) {
      outs = _range
    }
    outs.forEach(seqIdx => {
      const loci = wrapper.getLoci(seqIdx);
      if (StructureElement.Loci.isEmpty(loci)) return;
      const ev = { current: { loci }, buttons: 1, button: 1, modifiers: { shift: false, alt: false, control: false, meta: false } };
      // @ts-ignore
      molstarPlugin.behaviors.interaction.click.next(ev);
    })
  }, [molstarPlugin])

  const handleUpdateMarker = useCallback(() => {
    setMarkerUpdateStatus({
      ...latestMarkerUpdateStatusRef.current,
      ...markerUpdateQueueRef.current
    })
    markerUpdateQueueRef.current = {}
  }, [])

  const handleUpdateMarkerDebounce = useDebounceFn(handleUpdateMarker, { wait: 50 })

  function handleMarkerChange(wrapperKey: string, status: boolean) {
    markerUpdateQueueRef.current[wrapperKey] = status;
    handleUpdateMarkerDebounce.run()
  }

  const handleMarkerChangeNow = useCallback((wrapperKey: string, status: boolean) => {
    markerUpdateQueueRef.current[wrapperKey] = status;
    handleUpdateMarker()
  }, [handleUpdateMarker])

  const handleClearAllSelections = useCallback(() => {
    molstarPlugin.managers.interactivity.lociSelects.deselectAll()
  }, [molstarPlugin])

  const handleHighlightByLocations = useCallback((locations: TLocation[]) => {
    locations.forEach(({
      loci,
      structureKey,
      wrapperKey,
      seqIdx,
    }) => {
      const protein = proteins.find(p => p.molData?.structureKey === structureKey);
      if (!protein) return;
      const molData = protein.molData;
      const wrapper = molData?.wrappers?.find?.(w => w.key === wrapperKey);
      if (!wrapper) return;
      // @ts-ignore
      if (wrapper.wrapper?.mark && loci) {
        // @ts-ignore
        (wrapper.wrapper as PolymerSequenceWrapper)?.markResidue(loci, MarkerAction.Highlight)
        handleMarkerChange(wrapper.key, true)
        molstarPlugin.canvas3d?.mark({ loci: loci }, MarkerAction.Highlight);
      }
    })
  }, [proteins])

  const handleDehighlightByLocations = useCallback((locations: TLocation[]) => {
    locations.forEach(({
      loci,
      structureKey,
      wrapperKey,
      seqIdx,
    }) => {
      const protein = proteins.find(p => p.molData?.structureKey === structureKey);
      if (!protein) return;
      const molData = protein.molData;
      const wrapper = molData?.wrappers?.find?.(w => w.key === wrapperKey);
      if (!wrapper) return;
      // @ts-ignore
      if (wrapper.wrapper?.mark && loci) {
        // @ts-ignore
        (wrapper.wrapper as PolymerSequenceWrapper)?.mark(loci, MarkerAction.RemoveHighlight)
        handleMarkerChange(wrapper.key, true)
        molstarPlugin.canvas3d?.mark({ loci: loci }, MarkerAction.RemoveHighlight);
      }
    })
  }, [proteins])

  const handleSelectByLocations = useCallback((locations: TLocation[]) => {
    locations.forEach(({
      loci,
      structureKey,
      wrapperKey,
      seqIdx,
    }) => {
      if (!loci) return;
      const ev = { current: {loci}, buttons: 1, button: 1, modifiers: { shift: false, alt: false, control: false, meta: false }, seqIdx: undefined };
      // @ts-ignore
      molstarPlugin.behaviors.interaction.click.next(ev);
    });
  }, [molstarPlugin])

  const handleDeselectByLocations = useCallback((locations: TLocation[]) => {
    locations.forEach(({
      loci,
      structureKey,
      wrapperKey,
      seqIdx,
    }) => {
      if (!loci) return;
      const ev = { current: {loci}, buttons: 1, button: 1, modifiers: { shift: false, alt: false, control: false, meta: false }, seqIdx: undefined };
      // @ts-ignore
      molstarPlugin.behaviors.interaction.click.next(ev);
    });
  }, [proteins])

  const handleZoomInByLocation = useCallback((location: TLocation) => {
    const { loci } = location;
    if (!loci) return;
    const ev = { current: { loci }, buttons: 1, button: 1, modifiers: { shift: false, alt: false, control: true, meta: false }, seqIdx: undefined };
    molstarPlugin.behaviors.interaction.click.next(ev);
  }, [molstarPlugin])

  return useMemo(() => ({
    selections,
    handleRangeSelection,
    handleHighlightByLocations,
    handleDehighlightByLocations,
    handleSelectByLocations,
    handleClearAllSelections,
    handleDeselectByLocations,
    handleMarkerChange,
    handleMarkerChangeNow,
    markerUpdateStatus,
    handleZoomInByLocation,
  }), [selections, handleRangeSelection,
    handleHighlightByLocations,
    handleDehighlightByLocations,
    handleSelectByLocations,
    handleClearAllSelections,
    handleDeselectByLocations,
    markerUpdateStatus,
  ])
}
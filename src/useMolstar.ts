import React, { RefObject, useCallback, useMemo, useState } from "react";
import { useCreatePluginUI } from "./hooks/useCreatePluginUI";
import { useLatest } from "ahooks";
import { cloneDeep } from "./utils";
import { TLocation, TMolstarPlugin, TProtein, TProteinMolData, TState } from "./interface";
import { useGetSelection } from "./hooks/useGetSelection";
import useGetProteins from "./hooks/useGetProteins";
import useGetMeasurement from "./hooks/useGetMesurements";
import { PolymerSequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/polymer";
import { HeteroSequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/hetero";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { useTransformRepres } from "./hooks/useTransformRepres";
import { Viewport } from "molstar/lib/mol-canvas3d/camera/util";


type TMolstarContext = {
  molstarPlugin: TMolstarPlugin;
  reset: () => void
proteins: TProtein[]
visibleProteins: string[]
  handleSetProteinsVisible: (structureKeys: string[]) => void
  handleLoadProteinByUrl: (url: string, name?: string) => Promise<string>
  handleLoadProteinByFile: (file: File) => Promise<string>
  handleUpdateProteinMolData: (protein: TProtein, molData: TProteinMolData, type: 'update') => void
  handleRemoveProtein: (protein: TProtein) => void
  handleZoom: (type: 'in' | 'out') => void
  selections: TLocation[]
  handleRangeSelection: (wrapper: PolymerSequenceWrapper | HeteroSequenceWrapper, _start: number, _end: number) => void
  handleHighlightByLocations: (locations: TLocation[]) => void
  handleDehighlightByLocations: (locations: TLocation[]) => void
  handleSelectByLocations: (locations: TLocation[]) => void
  handleClearAllSelections: () => void
  handleDeselectByLocations: (locations: TLocation[]) => void
  handleMarkerChange: (wrapperKey: string, status: boolean) => void
  markerUpdateStatus: { [key: string]: boolean }
  handleMarkerChangeNow: (wrapperKey: string, status: boolean) => void
  handleZoomInByLocation: (location: TLocation) => void
  aaDistance: number
  setAaDistance: (distance: number) => void
  handleSetAaDistance: (distance: number) => void
  visibleLoadedStructureSelections: TLocation[]
  distanceDatas: {state: any, parent: any, ref: string, visible: boolean, structureKey: string, locations: TLocation[]}[]
  getDistance: (location1: TLocation, location2: TLocation, structureKey: string) => void
  handleToggleDistanceVisible: () => void
  transformRepres: (locations: TLocation[], repreType: string) => void
  handleTransformRepres: (repreType: string) => Promise<true | undefined>
  handleToggleTransformVisible: () => void
}

export const MolstarContext = React.createContext<TMolstarContext | undefined>(undefined)

export function useMolstarContext({
  viewContainerRef,
}: { viewContainerRef: RefObject<HTMLDivElement> }): TMolstarContext {
  const { molstarPlugin } = useCreatePluginUI(viewContainerRef)

  const molstarPluginLatestRef = useLatest(molstarPlugin)

  const reset = useCallback(() => {
    if (!molstarPluginLatestRef.current) return;
    molstarPluginLatestRef.current!.canvas3d?.requestCameraReset({
      snapshot: (scene: any, camera: any) => {
        // @ts-ignore
        return camera.getInvariantFocus(scene.boundingSphereVisible.center, scene.boundingSphereVisible.radius, [0, 0, 1], [-1, 0, 0])
      }
    })
    // // @ts-ignore
    // PluginCommands.Camera.Reset(molstarPluginLatestRef.current!, {});
    // // @ts-ignore
    // PluginCommands.Camera.ResetAxes(molstarPluginLatestRef.current!, {});
  }, [])

  const {
    proteins,
    visibleProteins,
    handleSetProteinsVisible,
    handleLoadProteinByUrl,
    handleLoadProteinByFile,
    handleUpdateProteinMolData,
    handleRemoveProtein,
  } = useGetProteins({
    molstarPlugin: molstarPlugin!,
    reset
  })

  const proteinsLatestRef = useLatest(proteins)

  const handleZoom = useCallback((type: 'in' | 'out') => {
    if (!molstarPluginLatestRef.current?.canvas3d) return;
    const viewport = Viewport.clone(molstarPluginLatestRef.current!.canvas3d?.camera!.viewport!);
    // @ts-ignore
    molstarPluginLatestRef.current!.canvas3dContext?.input.wheel.next({
      spinY: type === 'in' ? -1 : 1,
      spinX: 0,
      dz: 0,
      buttons: 4,
      modifiers: {
        shift: false,
        alt: false,
        control: false,
        meta: false
      },
      x: viewport.x,
      y: viewport.y,
    })
  }, [])

  const {
    selections,
    handleRangeSelection,
    handleHighlightByLocations,
    handleDehighlightByLocations,
    handleSelectByLocations,
    handleClearAllSelections,
    handleDeselectByLocations,
    handleMarkerChange,
    markerUpdateStatus,
    handleMarkerChangeNow,
    handleZoomInByLocation
  } = useGetSelection({ molstarPlugin: molstarPlugin!, proteins: proteins })

  const [aaDistance, setAaDistance] = useState(5)

  const handleSetAaDistance = useCallback((distance: number) => {
    setAaDistance(distance)
  }, [])

  const visibleLoadedStructureSelections = useMemo(() => {
    return selections.filter(selection => selection.structureKey && visibleProteins.includes(selection.structureKey))
  }, [selections, visibleProteins])

  const {
    distanceDatas,
    getDistance,
    handleToggleDistanceVisible,
  } = useGetMeasurement({
    molstarPlugin: molstarPlugin!,
    visibleProteins
  })

  const {
    transformRepres,
    handleTransformRepres,
    handleToggleTransformVisible
  } = useTransformRepres({
    proteins,
    molstarPlugin: molstarPlugin! ,
    selections: visibleLoadedStructureSelections
  })

  return {
    molstarPlugin: molstarPlugin!,
    reset,
    proteins,
    visibleProteins,
    handleSetProteinsVisible,
    handleLoadProteinByUrl,
    handleLoadProteinByFile,
    handleUpdateProteinMolData,
    handleRemoveProtein,
    handleZoom,
    selections,
    handleRangeSelection,
    handleHighlightByLocations,
    handleDehighlightByLocations,
    handleSelectByLocations,
    handleClearAllSelections,
    handleDeselectByLocations,
    handleMarkerChange,
    markerUpdateStatus,
    handleMarkerChangeNow,
    handleZoomInByLocation,
    aaDistance,
    setAaDistance,
    handleSetAaDistance,
    visibleLoadedStructureSelections,
    distanceDatas,
    getDistance,
    handleToggleDistanceVisible,
    transformRepres,
    handleTransformRepres,
    handleToggleTransformVisible,
  }
}
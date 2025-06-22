import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounceFn, useLatest } from "ahooks";

import { getFileNameInfo } from "molstar/lib/mol-util/file-info"
import { StructureElement, StructureProperties } from "molstar/lib/mol-model/structure";
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects";
import { Asset } from "molstar/lib/mol-util/assets"
import { elementLabel } from "molstar/lib/mol-theme/label";
import { getSequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { StateSelection } from "molstar/lib/mol-state";

import { TWrapper, TChainGroup, TModelEntity, TOperator, TStructure, EProteinStatus, TMolstarPlugin, TState, TProtein, TProteinMolData } from "../interface";
import { isEmpty, getFilenameWithoutType, getFileType, getFilenameFromUrl } from "../utils";
import { getStructure, opKey, splitModelEntityId } from "./utils/sequence";
import { useSubscribe } from "./useSubscribe";
import { getComponentGroupsByStructure } from "./utils/updateRepresentation";

type Props = {
  molstarPlugin: TMolstarPlugin;
  reset: () => void;
}

type TSyncQueue = {
  type: 'create' | 'update' | 'remove' | 'placeholder' |
  'updateMolData'
  protein: TProtein;
  data?: any;
}

export default function useGetProteins({
  molstarPlugin,
  reset
}: Props) {

  const [proteins, setProteins] = useState<TProtein[]>([]);
  const proteinsLatestRef = useLatest(proteins)
  const pluginLatestRef = useLatest(molstarPlugin)
  const syncQueueRef = useRef<TSyncQueue[]>([])
  const { subscribe, subsRef } = useSubscribe()
  const [visibleProteins, setVisibleProteins] = useState<string[]>([]);
  // 1 - show, 2 - hide, -1 - show pending, -2 - hide pending
  const proteinDisplayStatusRef = useRef<Record<string, 1 | 2 | -1 | -2>>({})
  // an early update of visible proteins
  const proteinVisibleStatusRef = useRef<string[]>([])

  const molstarSync = useCallback(() => {
    if (!pluginLatestRef.current) {
      return;
    }
    const plugin = pluginLatestRef.current,
      currentProteins = proteinsLatestRef.current,
      unsettledKeys: string[] = currentProteins
        .filter(protein => protein.status === EProteinStatus.LOADING)
        .map(protein => protein.key!),
      structureInfos: any[] = [];
    if (isEmpty(unsettledKeys)) return;
    // @ts-ignore
    const datas = plugin.state.data.select(StateSelection.Generators.rootsOfType(PluginStateObject.Molecule.Structure));
    for (const s of datas) {
      if (!s.obj?.data) continue;
      if (unsettledKeys.indexOf(s.transform.ref) !== -1) {
        structureInfos.push({
          key: s.transform.ref,
          label: s.obj!.data.label,
          version: s.paramsNormalizedVersion,
        })
      }
    }
    if (isEmpty(structureInfos)) return;
    syncStructures(structureInfos)
  }, [])

  const molstarSyncDebouncd = useDebounceFn(molstarSync, { wait: 200 })

  const syncWorks = useCallback(() => {
    const _proteins = [...proteinsLatestRef.current]
    syncQueueRef.current.forEach(({ type, protein, data }) => {
      if (type === 'placeholder') {
        _proteins.push(protein)
      } else if (type === 'create') {
        const index = _proteins.findIndex(p => p.key === protein.key)
        if (index === -1) {
          _proteins.push(protein)
        } else {
          _proteins[index] = protein
        }
      } else if (type === 'update') {
        const index = _proteins.findIndex(p => p.key === protein.key)
        if (index !== -1) {
          _proteins[index] = {
            ..._proteins[index],
            ...data
          }
        }
      } else if (type === 'remove') {
        const index = _proteins.findIndex(p => p.key === protein.key)
        if (index !== -1) {
          _proteins.splice(index, 1)
        }
      } else if (type === 'updateMolData') {
        const index = _proteins.findIndex(p => p.key === protein.key);
        if (index !== -1) {
          _proteins[index] = {
            ..._proteins[index],
            molData: {
              ..._proteins[index].molData,
              ...data
            }
          }
        }
      }
    })
    syncQueueRef.current = [];
    setProteins(_proteins)

    molstarSyncDebouncd.run()
  }, [])

  const syncProteinsDebounce = useDebounceFn(syncWorks, { wait: 200 })

  useEffect(() => {
    if (molstarPlugin) {
      molstarSyncDebouncd.run();
      subscribe(molstarPlugin.state.events.object.updated, molstarSyncDebouncd.run);
      subscribe(molstarPlugin.state.events.object.created, molstarSyncDebouncd.run);
      subscribe(molstarPlugin.state.events.object.removed, molstarSyncDebouncd.run);
    }
    return () => {
      for (const s of subsRef.current) s.unsubscribe();
    }
  }, [molstarPlugin])

  const handleLoadProteinByUrl = useCallback<(url: string, name?: string) => Promise<string>>((url: string, name?: string) => {
    return new Promise(res => {
      let filename = ""
      fetch(url).then(res => {
        const contentDisposition = res.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename\*?=["']?(.*?)(["';]|$)/i);
          const _filename = filenameMatch ? filenameMatch[1] : null;

          if (_filename) {
            filename = decodeURIComponent(_filename);
          }
        }
        if (!filename) {
          filename = getFilenameFromUrl(url) || ""
        }
        return res.blob()
      }).then(blob => {
        const file = new File([blob], filename || name || "unknown")
        return handleLoadProteinByFile(file, name || filename) 
      })
    })
  }, [])

  const handleLoadProteinByFile = useCallback(async (file: File, name?: string) => {
    const _file = Asset.File(file)
    _file.name = _file.name.replace('.pdb', '')
    const info = getFileNameInfo(file?.name ?? '');
    const isBinary = pluginLatestRef.current.dataFormats.binaryExtensions.has(info.ext);
    const { data } = await pluginLatestRef.current.builders.data.readFile({ file: _file, isBinary });
    const provider =
      pluginLatestRef.current.dataFormats.auto(info, data.cell?.obj!);

    const parsed = await provider?.parse(pluginLatestRef.current, data);

    let result = await provider?.visuals?.(pluginLatestRef.current, parsed);

    const structureKey = result.structure.ref;

    const mosProtein: TProtein = {
      key: structureKey,
      name: getFilenameWithoutType(name || file.name || 'unknown protein'),
      filename: file.name,
      filetype: getFileType(file.name),
      status: EProteinStatus.LOADING,
      molData: {
        structureKey,
      }
    }
    syncQueueRef.current.push({ type: 'create', protein: mosProtein })
    syncProteinsDebounce.run()

    return structureKey
  }, [])

  const handleUpdateProteinMolData = useCallback((protein: TProtein, molData: TState, type: 'update') => {
    syncQueueRef.current.push({ type: 'updateMolData', protein, data: molData })
    syncProteinsDebounce.run()
  }, [])

  const handleRemoveProtein = useCallback((protein: TProtein) => {
    if (protein.status === EProteinStatus.LOADED) {
      const molData = protein.molData as TProteinMolData;
      // @ts-ignore
      PluginCommands.State.RemoveObject(pluginLatestRef.current, { state: molData.cell!.parent!, ref: molData.structureKey!, removeParentGhosts: true });
    }
    syncQueueRef.current.push({ type: 'remove', protein })
    syncProteinsDebounce.run()
  }, [])

  function syncStructures(structureInfos: { key: string, label: string, version: string }[]) {
    const currentProteins = proteinsLatestRef.current;

    const plugin = pluginLatestRef.current;
    const structureRefs = plugin.managers.structure.hierarchy.current.structures;

    const state = plugin.state.data;
    const ref = state.tree.root.ref;
    const rootCell = state.cells.get(ref)!;

    structureInfos.forEach(({ key, label, version }) => {
      const structure = getStructure(plugin, key);
      const modelId = structure.model.id;
      // @ts-ignore
      const modelEntities = getModelEntities(structure)
      const structureRef = structureRefs.find((ref: any) => ref.version === version);
      modelEntities.forEach(entity => {
        // @ts-ignore
        entity.chainGroups = getChainOptions(structure, entity.key)
        entity.chainGroups.forEach((chainGroup: any) => {
          // @ts-ignore
          chainGroup.operators = getOperatorOptions(structure, entity.key, chainGroup.id)
        })
      })
      const treeSet = rootCell.parent!.tree.children.get(structureRef!.cell.transform.ref);
      const cell = [...treeSet.map((c: any) => rootCell.parent!.cells.get(c!)!)][0];

      const curProtein = currentProteins.find(protein => (protein.molData as TProteinMolData)?.structureKey === key)

      const componentGroups = getComponentGroupsByStructure(structureRef!).map(d => d[0]);
      const componentRepresentations = componentGroups.map(group => group?.representations)

      const molDataUpdates = {
        structureRef: structureRef!,
        structure,
        // @ts-ignore
        wrappers: getSequenceWrappers(plugin, modelEntities, structure, key),
        structureLabel: label,
        structureVersion: version,
        modelEntities,
        componentGroups,
        componentRepresentations,
        modelId,
        cell,
      }
      if (curProtein) {
        syncQueueRef.current.push({ type: 'updateMolData', protein: curProtein, data: molDataUpdates })
        syncQueueRef.current.push({ type: 'update', protein: curProtein, data: { status: EProteinStatus.LOADED } })
        syncProteinsDebounce.run()
        proteinVisibleCheck(curProtein.key, { ...curProtein, molData: { ...curProtein.molData, ...molDataUpdates }, status: EProteinStatus.LOADED })
      } else {
        // @ts-ignore
        PluginCommands.State.ToggleVisibility(pluginLatestRef.current!, {
          state: cell!.parent!, ref: key!
        });
      }
    })
  }

  function proteinVisibleCheck(proteinKey: string, protein: TProtein) {
    const curProteinVisibleStatus = proteinVisibleStatusRef.current.length === 0 ? 1 : (
      proteinVisibleStatusRef.current.includes(proteinKey) ? 1 : 2
    )
    const curProteinDisplayStatus = proteinDisplayStatusRef.current[proteinKey] === undefined ? 1 : (
      proteinDisplayStatusRef.current[proteinKey] > 0 ? proteinDisplayStatusRef.current[proteinKey] : -1
    )

    if (curProteinDisplayStatus > 0 && curProteinDisplayStatus !== curProteinVisibleStatus) {
      const molData = protein.molData as TProteinMolData;
      proteinDisplayStatusRefUpdate(protein.key)
      // @ts-ignore
      PluginCommands.State.ToggleVisibility(pluginLatestRef.current!, {
        state: molData.cell!.parent!, ref: molData.structureKey!
      }).then(() => {
        proteinDisplayStatusRefUpdate(protein.key)
        reset()
      });
    }
  }

  function updateVisibleProteins(proteinKeys: string[]) {
    proteinVisibleStatusRef.current = proteinKeys
    setVisibleProteins(proteinKeys)
    if (proteinKeys.length === 0) {
      proteinKeys = proteinsLatestRef.current.map(p => p.key)
    }
    const promises: Promise<boolean>[] = []
    proteinsLatestRef.current.forEach(p => {
      if (
        p.status === EProteinStatus.LOADED &&
        (proteinDisplayStatusRef.current[p.key] > 0 || !proteinDisplayStatusRef.current[p.key])
      ) {
        if (proteinKeys.includes(p.key) && (proteinDisplayStatusRef.current[p.key] === 1 || !proteinDisplayStatusRef.current[p.key])) {
          return
        } else if (!proteinKeys.includes(p.key) && proteinDisplayStatusRef.current[p.key] === 2) {
          return
        }
        const molData = p.molData as TProteinMolData;
        proteinDisplayStatusRefUpdate(p.key)
        // @ts-ignore
        promises.push(PluginCommands.State.ToggleVisibility(pluginLatestRef.current!, {
          state: molData.cell!.parent!, ref: molData.structureKey!
        }).then(() => {
          proteinDisplayStatusRefUpdate(p.key)
          return true
        }));
      }
    })
    Promise.all(promises).then(() => {
      reset()
    })
  }

  // 1(& undefined) - show, 2 - hide, -1 - show pending, -2 - hide pending
  function proteinDisplayStatusRefUpdate(key: string) {
    if (proteinDisplayStatusRef.current[key] === undefined) {
      proteinDisplayStatusRef.current[key] = -2
    } else if (proteinDisplayStatusRef.current[key] === -1) {
      proteinDisplayStatusRef.current[key] = 1
    } else if (proteinDisplayStatusRef.current[key] === -2) {
      proteinDisplayStatusRef.current[key] = 2
    } else if (proteinDisplayStatusRef.current[key] === 1) {
      proteinDisplayStatusRef.current[key] = -2
    } else if (proteinDisplayStatusRef.current[key] === 2) {
      proteinDisplayStatusRef.current[key] = -1
    }

    proteinVisibleCheck(key, proteinsLatestRef.current.find(p => p.key === key)!)
  }

  const handleSetProteinsVisible = useCallback((proteinKeys: string[]) => {
    updateVisibleProteins(proteinKeys)
  }, [])

  return useMemo(() => ({
    proteins,
    visibleProteins,
    handleSetProteinsVisible,
    handleLoadProteinByUrl,
    handleLoadProteinByFile,
    handleUpdateProteinMolData,
    handleRemoveProtein,
  }), [proteins, visibleProteins])
}

function getModelEntities(structure: TStructure, polymersOnly?: string) {
  const options: TModelEntity[] = [];
  // @ts-ignore
  const l = StructureElement.Location.create(structure);
  const seen = new Set<string>();

  for (const unit of structure.units) {
    // @ts-ignore
    StructureElement.Location.set(l, structure, unit, unit.elements[0]);
    const id = StructureProperties.entity.id(l);
    const type = StructureProperties.entity.type(l);
    const modelIdx = structure.getModelIndex(unit.model);
    const key = `${modelIdx}|${id}`;
    if (seen.has(key)) continue;
    if (polymersOnly && StructureProperties.entity.type(l) !== 'polymer') continue;

    let description = StructureProperties.entity.pdbx_description(l).join(', ');
    if (structure.models.length) {
      if (structure.representativeModel) { // indicates model trajectory
        description += ` (Model ${structure.models[modelIdx].modelNum})`;
      } else if (description.startsWith('Polymer ')) { // indicates generic entity name
        description += ` (${structure.models[modelIdx].entry})`;
      }
    }
    const label = `${id}: ${description}`;
    options.push({ key, label, model: structure.models?.[modelIdx], type });
    seen.add(key);

  }

  return options;
}

function getChainOptions(structure: TStructure, modelEntityId: string): TChainGroup[] {
  const options: TChainGroup[] = [];
  // @ts-ignore
  const l = StructureElement.Location.create(structure);
  const seen = new Set<number>();
  const [modelIdx, entityId] = splitModelEntityId(modelEntityId);

  for (const unit of structure.units) {
    // @ts-ignore
    StructureElement.Location.set(l, structure, unit, unit.elements[0]);
    if (structure.getModelIndex(unit.model) !== modelIdx) continue;
    if (StructureProperties.entity.id(l) !== entityId) continue;

    const id = unit.chainGroupId;
    if (seen.has(id)) continue;

    const label = elementLabel(l, { granularity: 'chain', hidePrefix: true, htmlStyling: false });

    options.push({ id, label });
    seen.add(id);
  }
  return options;
}

function getOperatorOptions(structure: TStructure, modelEntityId: string, chainGroupId: number): TOperator[] {
  const options: TOperator[] = [];
  // @ts-ignore
  const l = StructureElement.Location.create(structure);
  const seen = new Set<string>();
  const [modelIdx, entityId] = splitModelEntityId(modelEntityId);

  for (const unit of structure.units) {
    // @ts-ignore
    StructureElement.Location.set(l, structure, unit, unit.elements[0]);
    if (structure.getModelIndex(unit.model) !== modelIdx) continue;
    if (StructureProperties.entity.id(l) !== entityId) continue;
    if (unit.chainGroupId !== chainGroupId) continue;

    const id = opKey(l);
    if (seen.has(id)) continue;

    const label = unit.conformation.operator.name;
    options.push({ id, label });
    seen.add(id);
  }

  return options;
}

function getSequenceWrappers(plugin: TMolstarPlugin, modelEntities: TModelEntity[], structure: TStructure, key: string) {
  const structureWrappers: TWrapper[] = [];
  modelEntities?.forEach(entity => {
    const {
      chainGroups,
      label: entityLabel,
      key: entityKey,
      type: chainType,
    } = entity
    chainGroups?.forEach((group: any) => {
      const {
        operators,
        label: groupLabel,
        id: groupId
      } = group
      operators?.forEach((operator: any) => {
        const {
          label: operatorLabel,
          id: operatorId
        } = operator
        const wrapper = getSequenceWrapper({
          // @ts-ignore
          structure,
          modelEntityId: entityKey,
          chainGroupId: groupId,
          operatorKey: operatorId
        }, plugin.managers.structure.selection);

        structureWrappers.push({
          // @ts-ignore
          wrapper: wrapper,
          chainGroupId: groupId,
          chainType,
          key: `${key}__${entityKey}__${groupId}__${operatorId}`,
          label: `${entityLabel}|${groupLabel}`
          // label: `${entityLabel}|${groupLabel}|${operatorLabel}`
        });
      })
    })
  })
  return structureWrappers;
}

import { useLatest } from "ahooks"
import { EProteinStatus, TLocation, TMolstarPlugin, TProtein, TProteinMolData } from "../interface"
import { StructureComponentParams } from "molstar/lib/mol-plugin-state/helpers/structure-component"
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects"
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms"
import { PluginCommands } from "molstar/lib/mol-plugin/commands"
import { StateObjectRef, StateObjectSelector } from "molstar/lib/mol-state"
import { StateTreeSpine } from "molstar/lib/mol-state/tree/spine"
import { UUID } from "molstar/lib/mol-util"
import { useCallback, useState } from "react"

type Props = {
  proteins: TProtein[],
  molstarPlugin: TMolstarPlugin,
  selections: TLocation[]
}

const typeParams = {
  "ignoreHydrogens": false,
  "ignoreHydrogensVariant": "all",
  "quality": "auto",
  "ignoreLight": false,
  "material": {
    "metalness": 0,
    "roughness": 1,
    "bumpiness": 0
  },
  "clip": {
    "variant": "pixel",
    "objects": []
  }
}

export const useTransformRepres = ({
  proteins,
  molstarPlugin,
  selections,
}: Props) => {

  const [transforms, setTransforms] = useState<{ [key: string]: { ref: string, parent: any, repreType: string, visible: boolean, childTransform: any } }>({});
  const transformsLatestRef = useLatest(transforms);
  const [transformVisible, setTransformVisible] = useState(true);

  const transformVisibleLatestRef = useLatest(transformVisible);

  const handleToggleTransformVisible = useCallback(() => {
    const newTransforms = { ...transformsLatestRef.current };
    Object.values(newTransforms).forEach((data: any) => {
      if (data.visible === transformVisibleLatestRef.current) {
        // @ts-ignore
        PluginCommands.State.ToggleVisibility(molstarPlugin!, { state: data.parent, ref: data.ref });
        data.visible = !data.visible;
      }
    })
    setTransforms(newTransforms);
    setTransformVisible(!transformVisibleLatestRef.current);
  }, [molstarPlugin])

  const handleTransformRepres = useCallback(async (repreType: string) => {
    if (!molstarPlugin) return;
    if (!molstarPlugin) return undefined;
    let groupsObj: { [structureKey: string]: TLocation[] } = {};

    const newTransforms = { ...transformsLatestRef.current };

    selections.forEach(location => {
      groupsObj[location.structureKey] = groupsObj[location.structureKey] || [];
      groupsObj[location.structureKey].push(location);
    })

    const groups = Object.values(groupsObj);

    const type = molstarPlugin.representation.structure.registry.get(repreType);
    const promises: Promise<StateObjectSelector<PluginStateObject.Molecule.Structure> | undefined>[] = [], keys: string[] = []

    groups.forEach(group => {
      const {
        structureKey
      } = group[0];

      const protein = proteins.find(protein => protein.status === EProteinStatus.LOADED && protein.key === structureKey);
      const molData = protein?.molData;
      const structureRef = molData?.structureRef!;
      const componentKey = UUID.create22();

      group.forEach(location => {
        const key = `${structureKey}--${location.atomIndex}`;
        if (newTransforms[key]) {
          if (newTransforms[key].repreType === repreType) {
            return;
          }
          removeTransform(molstarPlugin, newTransforms[key].ref, newTransforms[key].parent);
        }
        promises.push(getTransformRepreComponent(molstarPlugin, structureRef.cell, [location], molData!, componentKey, {
          label: 'Custom Selection',
        }));
        keys.push(key);
      })
    })

    promises.forEach((promise, index) => {
      if (!promise) {
        // @ts-ignore
        delete newTransforms[keys[index]]
        return
      }
      promise.then((component) => {
        if (!component) {
          // @ts-ignore
          delete newTransforms[keys[index]]
          return
        }
        const decoratorChain = StateTreeSpine.getDecoratorChain(component?.cell?.parent!, component?.ref);
        newTransforms[keys[index]] = {
          ref: component?.ref || '',
          parent: component?.cell?.parent,
          repreType,
          visible: true,
          childTransform: decoratorChain[0]?.transform
        }
        // @ts-ignore
        molstarPlugin.builders.structure.representation.addRepresentation(component!, {
          type,
          typeParams
        });
      })
    })
    await Promise.all(promises);
    setTransforms(newTransforms);

    return true;
  }, [proteins, molstarPlugin, selections])

  const transformRepres = useCallback(async (locations: TLocation[], repreType: string) => {
    if (!molstarPlugin) return undefined;
    let groupsObj: { [structureKey: string]: TLocation[] } = {};

    locations.forEach(location => {
      groupsObj[location.structureKey] = groupsObj[location.structureKey] || [];
      groupsObj[location.structureKey].push(location);
    })

    const groups = Object.values(groupsObj);

    const type = molstarPlugin.representation.structure.registry.get(repreType);

    groups.forEach(async group => {
      const {
        structureKey
      } = group[0];
      const protein = proteins.find(protein => protein.status === EProteinStatus.LOADED && protein.key === structureKey);
      const molData = protein?.molData;
      const structureRef = molData?.structureRef!;
      const componentKey = UUID.create22();
      const component = await getTransformRepreComponent(molstarPlugin, structureRef.cell, group, molData!, componentKey, {
        label: 'Custom Selection',
      });

      // @ts-ignore
      await molstarPlugin.builders.structure.representation.addRepresentation(component, {
        type,
        typeParams
      });
    })

    return true;

  }, [proteins, molstarPlugin])

  return {
    transformRepres,
    handleTransformRepres,
    handleToggleTransformVisible
  }
}

export function removeTransform(molstarPlugin: TMolstarPlugin, ref: string, parent: any) {
  // @ts-ignore
  PluginCommands.State.RemoveObject(molstarPlugin, { state: parent, ref: ref, removeParentGhosts: true });
}

export async function getTransformRepreComponent(molstarPlugin: TMolstarPlugin, cell: any, selections: TLocation[], molData: TProteinMolData, componentKey: string, params: any,) {
  let { label, tags } = params || {};
  label = (label || '').trim();

  // @ts-ignore
  const structureData = StateObjectRef.resolveAndCheck(molstarPlugin.state.data, cell)?.obj?.data;
  if (!structureData) return;

  const groups: { [chainId: string]: TLocation[] } = {};

  selections.forEach(selection => {
    const chainId = selection.chainGroupId;
    groups[chainId] = groups[chainId] || [];
    groups[chainId].push(selection);
  });

  Object.keys(groups).forEach(chainId => {
    groups[chainId] = groups[chainId]
      .filter((item, i, arr) => i === arr.findIndex(t => t.chainIndex === item.chainIndex))
      .sort((a, b) => a.chainIndex - b.chainIndex);
  })

  const elements = Object.values(groups).map(group => {
    const chainId = group[0].chainGroupId;
    const unit = molData.structure?.units.find(unit => unit.chainGroupId === chainId);
    const element: {
      groupedUnits: number[][],
      ranges: number[],
      set: number[]
    } = {
      groupedUnits: [[chainId]],
      ranges: [],
      set: []
    };

    if (!unit) return element;

    const unitElements: number[] = Array.from(unit.elements);
    group.forEach(location => {
      const elementStart = location.elements[0], elementEnd = location.elements[location.elements.length - 1];
      const elementStartIndex = unitElements.indexOf(elementStart)
      const elementEndIndex = unitElements.indexOf(elementEnd)
      element.ranges.push(elementStartIndex, elementEndIndex)
    })
    return element;
  })

  const transformParamsParams = {
    hash: molData.structure?.hashCode,
    elements: elements,
  }

  const transformParams: StructureComponentParams = {
    type: {
      name: 'bundle',
      // @ts-ignore
      params: transformParamsParams
    },
    nullIfEmpty: true,
    label: label
  }

  return tryCreateComponent(molstarPlugin, cell, transformParams, componentKey, tags);
}

export async function tryCreateComponent(molstarPlugin: TMolstarPlugin, structure: any, params: StructureComponentParams, key: string, tags?: string[]): Promise<StateObjectSelector<PluginStateObject.Molecule.Structure> | undefined> {
  const state = molstarPlugin.state.data;

  const root = state.build().to(structure);

  const keyTag = `structure-component-${key}`;
  // @ts-ignore
  const component = root.applyOrUpdateTagged(keyTag, StateTransforms.Model.StructureComponent, params, {
    tags: tags ? [...tags, keyTag] : [keyTag]
  });

  await component.commit();

  const selector = component.selector;

  if (!selector.isOk || selector.cell?.obj?.data.elementCount === 0) {
    await state.build().delete(selector.ref).commit();
    return;
  }

  // @ts-ignore
  return selector;
}
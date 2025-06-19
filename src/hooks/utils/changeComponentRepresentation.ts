import { createStructureRepresentationParams } from "molstar/lib/mol-plugin-state/helpers/structure-representation-params";
import { TMolstarPlugin, TProtein } from "../../interface";
import { TRepresentationType } from "../../interface";

type Props = {
  plugin: TMolstarPlugin
  type: TRepresentationType
  protein: TProtein;
  componentIndex: number
}
export default function changeComopnentRepresentation({
  plugin,
  type,
  protein,
  componentIndex,
}: Props) {
  const params = createStructureRepresentationParams(plugin, undefined, { type });
  const { componentGroups, componentRepresentations } = protein.molData
  const targetGroup = componentGroups?.[componentIndex]
  const targetGroupRepresentation = componentRepresentations?.[componentIndex]
  if (!targetGroup || !targetGroupRepresentation) {
    throw new Error('repre-change-failed')
  }
  targetGroupRepresentation.forEach(representation => {
    plugin.managers.structure.component.updateRepresentations([targetGroup], representation, params)
  })
}
import { Loci } from "molstar/lib/mol-model/structure/structure/element/loci";
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms";
import { Overpaint } from "molstar/lib/mol-theme/overpaint";
import { Structure, StructureElement } from "molstar/lib/mol-model/structure";
import { StateSelection } from "molstar/lib/mol-state";
import { Color } from "molstar/lib/mol-util/color";
import { isEmpty } from "../utils";
import { TStructureRef, TMolstarPlugin } from "../interface";

type TProps = {
  plugin: TMolstarPlugin;
  loci?: Loci, color?: Color
  colorLociMap?: {color: Color, loci: Loci}[]
  structureRef: TStructureRef
}

function getFilteredBundle(layers: Overpaint.BundleLayer[], structure: Structure) {
  const overpaint = Overpaint.ofBundle(layers, structure.root);
  const merged = Overpaint.merge(overpaint);
  return Overpaint.filter(merged, structure) as Overpaint<StructureElement.Loci>;
}

const OverpaintManagerTag = 'overpaint-controls';
export default async function handleChangeColor({
  plugin,
  loci,
  color,
  colorLociMap,
  structureRef,
}: TProps) {
  if (!loci && isEmpty(colorLociMap)) {
    return
  }
  color = color || 16711680 as Color;
  // return;
  for (let i = 0; i < structureRef!.components.length; i++) {
    const componentRef = structureRef!.components[i];
    for (let j = 0; j < componentRef.representations.length; j++) {
      const repr = componentRef.representations[j];
      const r = repr.cell!;
      const overpaint = plugin.state.data.select(StateSelection.Generators.ofTransformer(StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle, repr.cell.transform.ref).withTag(OverpaintManagerTag));
      const overpaintCell = overpaint[0];
      const _structure = r.obj!.data.sourceData;
      const layers = [];
      if (loci) {
        layers.push({ bundle: StructureElement.Bundle.fromLoci(loci), color: color as Color, clear: false })
      } else {
        layers.push(...colorLociMap!.map(({loci, color}) => ({ bundle: StructureElement.Bundle.fromLoci(loci), color, clear: false })))
      }

      if (overpaintCell) {
        const bundleLayers = [...overpaintCell.params!.values.layers, ...layers];
        const filtered = getFilteredBundle(bundleLayers, _structure);
        if (filtered.layers.length === 0) {
          continue
        }
        const updateFn = plugin.state.data.build();

        updateFn.to(overpaintCell).update(Overpaint.toBundle(filtered));
        await updateFn.commit({ doNotUpdateCurrent: true });

      } else {
        const filtered = getFilteredBundle(layers, _structure!);
        if (filtered.layers.length === 0) {
          continue
        }
        const updateFn = plugin.state.data.build();

        updateFn.to(repr.cell.transform.ref).apply(StateTransforms.Representation.OverpaintStructureRepresentation3DFromBundle, Overpaint.toBundle(filtered), { tags: OverpaintManagerTag });
        await updateFn.commit({ doNotUpdateCurrent: true });

      }
    }
  }

}
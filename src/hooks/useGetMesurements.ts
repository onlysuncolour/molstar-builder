import { useCallback, useEffect, useState } from "react"
import { TLocation, TMolstarPlugin } from "../interface"
import { Color } from "molstar/lib/mol-util/color";
import { useLatest } from "ahooks";
import { PluginCommands } from "molstar/lib/mol-plugin/commands"

type Props = {
  molstarPlugin: TMolstarPlugin
  visibleProteins: string[]
}
export default function useGetMeasurement({
  molstarPlugin,
  visibleProteins
}: Props) {
  const [distanceDatas, setDistanceDatas] = useState<{state: any, parent: any, ref: string, visible: boolean, structureKey: string, locations: TLocation[]}[]>([]);
  const [visible, setVisible] = useState<boolean>(true);
  const distanceDataLatestRef = useLatest(distanceDatas);
  const visibleLatestRef = useLatest(visible);

  const getDistance = useCallback(async (location1: TLocation, location2: TLocation, structureKey: string) => {
    const result = await molstarPlugin.managers.structure.measurement.addDistance(location1.loci!, location2.loci!, {
      visualParams: {
        borderColor: Color(0),
        textColor: Color(16777215),
        textSize: 2
      }
    });
    const representation = result?.representation;
    if (!representation) {
      return
    }
    const ref = representation.ref;
    const state = representation.state;
    const parent = representation.cell!.parent;
    setDistanceDatas(prev => [...prev, {state, parent, ref, visible: true, structureKey, locations: [location1, location2]}]);
  }, [molstarPlugin])

  const handleToggleDistanceVisible = useCallback(() => {
    const newDistanceDatas = [...distanceDataLatestRef.current];
    newDistanceDatas.forEach((data) => {
      if (data.visible === visibleLatestRef.current) {
        // @ts-ignore
        PluginCommands.State.ToggleVisibility(molstarPlugin!, { state: data.state, ref: data.ref });
        data.visible = !data.visible;
      }
    })
    setDistanceDatas(newDistanceDatas);
    setVisible(!visibleLatestRef.current);
  }, [molstarPlugin])

  useEffect(() => {
    let newDistanceDatas = [...distanceDataLatestRef.current];
    const needToToggle = [];
    if (!visibleLatestRef.current) {
      needToToggle.push(...newDistanceDatas.filter(d => d.visible))
    } else {
      if (!visibleProteins.length) {
        needToToggle.push(...newDistanceDatas.filter(d => !d.visible))
      } else {
        needToToggle.push(...newDistanceDatas.filter(d => {
          if (d.visible && !visibleProteins.includes(d.structureKey)) {
            return true;
          }
          if (!d.visible && visibleProteins.includes(d.structureKey)) {
            return true;
          }
          return false;
        }))
      }
    }
    needToToggle.forEach((data) => {
      // @ts-ignore
      PluginCommands.State.ToggleVisibility(molstarPlugin!, { state: data.state, ref: data.ref });
      data.visible = !data.visible;
    })
    setDistanceDatas(newDistanceDatas);
  }, [visibleProteins])

  return {
    distanceDatas,
    getDistance,
    handleToggleDistanceVisible
  }
}
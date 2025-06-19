import { RefObject, useEffect, useState } from "react";
import { createPluginUI } from "molstar/lib/mol-plugin-ui";
import { renderReact18 } from "molstar/lib/mol-plugin-ui/react18";
import { MySpec } from "./molstar-spec";
import { TMolstarPlugin } from "../interface";

export function useCreatePluginUI(containerRef: RefObject<HTMLDivElement>) {
  const [molstarPlugin, setPluin] = useState<TMolstarPlugin>()
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!containerRef.current || !!molstarPlugin || loading) {
      return;
    }
    async function init() {
      setLoading(true)
      const molstarPlugin = await createPluginUI({
        target: containerRef.current as HTMLDivElement,
        render: renderReact18,
        spec: MySpec,
      });
      setPluin(molstarPlugin)
      setLoading(false)
    }
    init()
  }, [containerRef.current])
  return {
    molstarPlugin
  }
}
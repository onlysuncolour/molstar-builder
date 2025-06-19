import {
  DefaultPluginUISpec,
  PluginUISpec,
} from "molstar/lib/mol-plugin-ui/spec";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import "molstar/lib/mol-plugin-ui/skin/light.scss";

export const MySpec: PluginUISpec = {
  ...DefaultPluginUISpec(),
  layout: {
    initial: {
      // isExpanded: false,

      // uncomment this if all no need for the controls panel, which contains the controls for the plugin
      // showControls: false,
      // controlsDisplay configures the visibility of the controls panel, defines the relationship between canvas and controls panel
      controlsDisplay: "reactive",
    },
  },
  // components defines the components that are used in the plugin, this gonna be the main layout of the plugin
  components: {
    controls: { left: "none" },
  },
  config: [[PluginConfig.VolumeStreaming.Enabled, false]],
};

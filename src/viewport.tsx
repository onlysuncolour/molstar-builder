import { PluginUIComponent } from "molstar/lib/mol-plugin-ui/base";
import React from "react";

interface ViewportCanvasState {
  noWebGl: boolean;
  showLogo: boolean;
}
interface ViewportCanvasParams {
  plugin: any
}

export class MolStarViewport extends PluginUIComponent<ViewportCanvasParams, ViewportCanvasState> {
  private container = React.createRef<HTMLDivElement>();

  state: ViewportCanvasState = {
    noWebGl: false,
    showLogo: true
  };

  constructor(props: any) {
    super(props, props.plugin);
  }

  private handleLogo = () => {
    this.setState({ showLogo: !this.plugin.canvas3d?.reprCount.value });
  };

  componentDidMount() {
    if (!this.container.current || !this.plugin.mount(this.container.current!, { checkeredCanvasBackground: true })) {
      this.setState({ noWebGl: true });
      return;
    }
    this.handleLogo();
    this.subscribe(this.plugin.canvas3d!.reprCount, this.handleLogo);
    // this.plugin.canvas3d.
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    this.plugin.unmount(); 
  }

  renderMissing() {

    return <div className='msp-no-webgl'>
      <div>
        <p><b>WebGL does not seem to be available.</b></p>
        <p>This can be caused by an outdated browser, graphics card driver issue, or bad weather. Sometimes, just restarting the browser helps. Also, make sure hardware acceleration is enabled in your browser.</p>
        <p>For a list of supported browsers, refer to <a href='http://caniuse.com/#feat=webgl' target='_blank'>http://caniuse.com/#feat=webgl</a>.</p>
      </div>
    </div>;
  }

  render() {
    if (this.state.noWebGl) return this.renderMissing();
    return <div className={'msp-viewport'} ref={this.container} key="viewport">
    </div>;
  }
}


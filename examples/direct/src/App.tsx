import { MolstarContext, useMolstarContext } from './molstarBuilder';
import { useRef } from "react";
import "./App.css"
import ProteinList from './components/protein-list';

function App() {
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const molstarContext = useMolstarContext({ viewContainerRef })
  
  return <div className="app">
    <MolstarContext.Provider value={molstarContext}>
      <div style={{ display: 'none' }} ref={viewContainerRef}></div>
      <ProteinList />
    </MolstarContext.Provider>
  </div>
}

export default App;
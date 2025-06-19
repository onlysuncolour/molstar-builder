import { useMolstar, Test } from 'molstar-builder';
import "./App.css"

function App() {
  const [value, setValue] = useMolstar('demo');
  return <div>Current value: {value}
  <Test />
  </div>;
}

export default App;
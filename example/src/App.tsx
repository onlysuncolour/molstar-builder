import { useMolstar } from 'molstar-builder';
import "./App.css"

function App() {
  const [value, setValue] = useMolstar('demo');
  return <div>Current value: {value}</div>;
}

export default App;
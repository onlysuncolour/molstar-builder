import "./App.css"
import { useMolstar, Test } from '../../../src/index';

function App() {
  const [value, setValue] = useMolstar('demo');
  return <div>Current value: {value}
  <Test />
  </div>;
}

export default App;
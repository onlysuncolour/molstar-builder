import './index.css'
import { useContext } from "react"
import { MolstarContext, MolStarViewport } from "../../molstarBuilder"

export default function StructureView() {
  const { molstarPlugin } = useContext(MolstarContext)!
  return <div className="structure-view">
    <div>Structure View</div>
    <div className="molstar-viewport">
      {
        !!molstarPlugin && <MolStarViewport plugin={molstarPlugin} />
      }
    </div>
  </div>
}
import './index.css'
import { useContext, useRef } from "react"
import { MolstarContext } from "../../molstarBuilder"

export default function ProteinList() {
  const { proteins, handleLoadProteinByUrl, handleLoadProteinByFile } = useContext(MolstarContext)!

  const uploadEleRef = useRef<HTMLLabelElement>(null)
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLoadProteinByFile(file)
    }
  }

  return <div className="protein-list">
    <div>
      <div>New Protein</div>
      <div>
        <button onClick={() => uploadEleRef.current?.click?.()} >
          <label htmlFor="file-fdfdfd" className="sr-only" ref={uploadEleRef} onClick={e => { e.stopPropagation() }}>
            upload file
          </label>
        </button>
        <input id="file-fdfdfd" type="file" onChange={handleUploadFile} style={{ display: 'none' }} multiple accept=".pdb,.sdf,.cif" />
      </div>
      <div>
        <div>From RCSB</div>
        <a onClick={() => {
          handleLoadProteinByUrl('https://files.rcsb.org/download/3PMZ.pdb')
        }}>
          3PMZ.pdb
        </a>
      </div>
    </div>
    <div>
      <div>Protein List</div>
      <div>
        {proteins.map(protein => <div key={protein.key}>{protein.name}</div>)}
      </div>
    </div>
  </div>
}
import { formatFloat, getUniqueNameFromArr } from "../../utils";
import { TMolstarPlugin, TModelEntity, TStructure } from "../../interface";

export default async function splitStructure(structure:TStructure, modelEntities: TModelEntity[], label: string, plugin: TMolstarPlugin) {

  if (structure!.units.length === 1) {
    return "oneChain";
  }
  const structureLabel = structure.label;

  const chainInfos: any = {}
  modelEntities!.forEach(entity => {
    const type = entity.type;
    entity.chainGroups?.forEach(({
      id, label
    }) => {
      label = label.split(' ')[0].split('_')[0]
      chainInfos[id] = {label: `${structureLabel}_${label}_${type}`, type};
    })
  })
  const units = structure!.units.map(unit => {
    return {
      label: chainInfos[unit.chainGroupId]?.label,
      type: chainInfos[unit.chainGroupId]?.type,
      start: unit.elements[0],
      end: unit.elements[unit.elements.length - 1],
    }
  })
  try {
    // @ts-ignore
    const rowCount = structure.model.sourceData.data.db.atom_site._rowCount as number;
    // @ts-ignore
    const groupList = structure.model.sourceData.data.db.atom_site.group_PDB.toArray() as string[]
    // @ts-ignore
    const idList = structure.model.sourceData.data.db.atom_site.id.toArray() as number[]
    // @ts-ignore
    const atomIdList = structure.model.sourceData.data.db.atom_site.auth_atom_id.toArray() as string[]
    // @ts-ignore
    const labelAltIdList = structure.model.sourceData.data.db.atom_site.label_alt_id.toArray() as string[]
    // @ts-ignore
    const compIdList = structure.model.sourceData.data.db.atom_site.auth_comp_id.toArray() as string[]
    // @ts-ignore
    const asymIdList = structure.model.sourceData.data.db.atom_site.auth_asym_id.toArray() as string[]
    // @ts-ignore
    const seqIdList = structure.model.sourceData.data.db.atom_site.auth_seq_id.toArray() as number[]
    // @ts-ignore
    const xList = structure.model.sourceData.data.db.atom_site.Cartn_x.toArray() as number[]
    // @ts-ignore
    const yList = structure.model.sourceData.data.db.atom_site.Cartn_y.toArray() as number[]
    // @ts-ignore
    const zList = structure.model.sourceData.data.db.atom_site.Cartn_z.toArray() as number[]
    // @ts-ignore
    const occupancyList = structure.model.sourceData.data.db.atom_site.occupancy.toArray() as number[]
    // @ts-ignore
    const bList = structure.model.sourceData.data.db.atom_site.B_iso_or_equiv.toArray() as number[]
    // @ts-ignore
    const typeSymbolList = structure.model.sourceData.data.db.atom_site.type_symbol.toArray() as string[]
    // @ts-ignore
    const anisotropFlag = structure.model.sourceData.data.db.atom_site_anisotrop._rowCount > 0 as boolean
    // @ts-ignore
    const anisotropUList = structure.model.sourceData.data.db.atom_site_anisotrop.U.toArray() as number[][]


    // @ts-ignore
    const helixFlag = structure.model.sourceData.data.db.struct_conf._rowCount > 0 as boolean

    // @ts-ignore
    const helixCount = structure.model.sourceData.data.db.struct_conf._rowCount as number

    // @ts-ignore
    const helixIdList = structure.model.sourceData.data.db.struct_conf.pdbx_PDB_helix_id.toArray() as string[]
    // @ts-ignore
    const helixAuthCompIdList = structure.model.sourceData.data.db.struct_conf.beg_auth_comp_id.toArray() as string[]
    // @ts-ignore
    const helixAuthAsymIdList = structure.model.sourceData.data.db.struct_conf.beg_auth_asym_id.toArray() as string[]
    // @ts-ignore
    const helixAuthSeqIdList = structure.model.sourceData.data.db.struct_conf.beg_auth_seq_id.toArray() as string[]
    // @ts-ignore
    const helixEndAuthCompIdList = structure.model.sourceData.data.db.struct_conf.end_auth_comp_id.toArray() as string[]
    // @ts-ignore
    const helixEndAuthSeqIdList = structure.model.sourceData.data.db.struct_conf.end_auth_seq_id.toArray() as string[]
    // @ts-ignore
    const helixClassList = structure.model.sourceData.data.db.struct_conf.pdbx_PDB_helix_class.toArray() as string[]
    // @ts-ignore
    const helixLengthList = structure.model.sourceData.data.db.struct_conf.pdbx_PDB_helix_length.toArray() as string[]

    // @ts-ignore
    const sheetFlag = structure.model.sourceData.data.db.struct_sheet_range._rowCount > 0 as boolean
    // @ts-ignore
    const sheetCount = structure.model.sourceData.data.db.struct_sheet_range._rowCount as number

    // @ts-ignore
    const sheetIdList = structure.model.sourceData.data.db.struct_sheet_range.id.toArray() as string[]
    // @ts-ignore
    const sheetIdIdList = structure.model.sourceData.data.db.struct_sheet_range.sheet_id.toArray() as string[]
    // @ts-ignore
    const sheetAuthCompIdList = structure.model.sourceData.data.db.struct_sheet_range.beg_auth_comp_id.toArray() as string[]
    // @ts-ignore
    const sheetAsymIdList = structure.model.sourceData.data.db.struct_sheet_range.end_label_asym_id.toArray()  as string[]
    // @ts-ignore
    const sheetAuthSeqIdList = structure.model.sourceData.data.db.struct_sheet_range.beg_auth_seq_id.toArray() as string[]
    // @ts-ignore
    const sheetEndAuthCompIdList = structure.model.sourceData.data.db.struct_sheet_range.end_auth_comp_id.toArray()  as string[]
    // @ts-ignore
    const sheetEndCompIdList = structure.model.sourceData.data.db.struct_sheet_range.end_label_comp_id.toArray() as string[]
    // @ts-ignore
    const sheetEndAuthSeqIdList = structure.model.sourceData.data.db.struct_sheet_range.end_auth_seq_id.toArray()  as string[]

    // @ts-ignore
    const connectFlag = structure.model.sourceData.data.db.struct_conn._rowCount > 0 as boolean

    // @ts-ignore
    const connectCount = structure.model.sourceData.data.db.struct_conn._rowCount as number

    // @ts-ignore
    const connectP1AsymIdList =  structure.model.sourceData.data.db.struct_conn.ptnr1_label_asym_id.toArray() as string[]
    // @ts-ignore
    const connectP1AtomIdList =  structure.model.sourceData.data.db.struct_conn.ptnr1_label_atom_id.toArray() as string[]
    // @ts-ignore
    const connectP1SeqIdList =  structure.model.sourceData.data.db.struct_conn.ptnr1_auth_seq_id.toArray() as number[]
    // @ts-ignore
    const connectP2AsymIdList =  structure.model.sourceData.data.db.struct_conn.ptnr2_label_asym_id.toArray() as string[]
    // @ts-ignore
    const connectP2AtomIdList =  structure.model.sourceData.data.db.struct_conn.ptnr2_label_atom_id.toArray() as string[]
    // @ts-ignore
    const connectP2SeqIdList =  structure.model.sourceData.data.db.struct_conn.ptnr2_auth_seq_id.toArray() as number[]

    let helixContent = '', sheetContent = '', connectResult: [number, number][] = []
    if (helixFlag) {
      let i = 0;
      while (i < helixCount) {
        const helixId = helixIdList[i],
        helixAuthCompId = helixAuthCompIdList[i],
        helixAuthAsymId = helixAuthAsymIdList[i],
        helixAuthSeqId = `${helixAuthSeqIdList[i]}`,
        helixEndAuthCompId = helixEndAuthCompIdList[i],
        helixEndAuthSeqId = `${helixEndAuthSeqIdList[i]}`,
        helixClass = helixClassList[i],
        helixLength = `${helixLengthList[i]}`;

        helixContent += 'HELIX'
          + helixId.padStart(5, ' ')
          + helixId.padStart(4, ' ')
          + helixAuthCompId.padStart(4, ' ')
          + ' '
          + helixAuthAsymId
          + helixAuthSeqId.padStart(5, ' ')
          + helixEndAuthCompId.padStart(5, ' ')
          + ' '
          + helixAuthAsymId
          + helixEndAuthSeqId.padStart(5, ' ')
          + helixClass.padStart(3, ' ')
          + '                                 '
          + helixLength.padStart(3, ' ')
          + '\n';
        i++
      }
    }
    if (sheetFlag) {
      let i = 0;
      while (i < sheetCount) {
        const sheetId = sheetIdList[i],
        sheetIdId = sheetIdIdList[i],
        sheetAuthCompId = sheetAuthCompIdList[i],
        sheetAsymId = sheetAsymIdList[i],
        sheetAuthSeqId = `${sheetAuthSeqIdList[i]}`,
        sheetEndAuthCompId = sheetEndAuthCompIdList[i],
        sheetEndCompId = sheetEndCompIdList[i],
        sheetEndAuthSeqId = `${sheetEndAuthSeqIdList[i]}`;
        sheetContent += 'SHEET'
          + sheetId.padStart(5, ' ')
          + sheetIdId.padStart(4, ' ')
          + ' '
          + 4 // something wrong here
          + sheetAuthCompId.padStart(4, ' ')
          + ' '
          + sheetAsymId
          + sheetAuthSeqId.padStart(4, ' ')
          + sheetEndAuthCompId.padStart(5, ' ')
          + ' '
          + sheetEndCompId
          + sheetEndAuthSeqId.padStart(4, ' ')
          + '\n';
        i++
      }
    }
    if (connectFlag) {
      function getIndexByParams({ asymId, atomId, seqId }: { asymId: string, atomId: string, seqId: number }) {
        const range1 = asymIdList.findIndex(_asymId => _asymId === asymId), range2 = asymIdList.findLastIndex(_asymId => _asymId === asymId);
        if (range1 === -1 || range2 === -1) return undefined
        let _range1 = range1, _range2 = range2, flag = 0, index = -1;
        while (_range1 <= range2) {
          if (seqIdList[_range1] === seqId) {flag ++; break;}
            _range1 ++
        }
        while (_range2 >= _range1) {
          if (seqIdList[_range2] === seqId) {flag ++; break}
            _range2 --
        }
        if (flag !== 2) return undefined;
        let i = _range1;
        while (i <= _range2) {
          if (atomIdList[i] === atomId) {index = i; break}
          i++
        }
        if (index === -1) return undefined;
        return index
      }
      let i = 0;
      while (i < connectCount) {
        const p1 = getIndexByParams({asymId: connectP1AsymIdList[i], atomId: connectP1AtomIdList[i], seqId: connectP1SeqIdList[i]}),
        p2 = getIndexByParams({asymId: connectP2AsymIdList[i], atomId: connectP2AtomIdList[i], seqId: connectP2SeqIdList[i]});
        if (p1 !== undefined && p2 !== undefined) {
          connectResult.push([p1, p2])
        }
        i++
      }
    }
    const result: {label: string, content: string}[] = [];
    const labels: string[] = []
    units.forEach(({
      label, type, start, end
    }) => {
      let content = '', connectContent = ''
      if (['polymer'].includes(type) ) {
        if (helixFlag) content += helixContent
        if (sheetFlag) content += sheetContent
      }
      let i = start;
      while(i <= end) {
        const group = groupList[i],
          id = `${idList[i]}`,
          atomId = atomIdList[i],
          compId = `${labelAltIdList[i]}${compIdList[i]}`,
          asymId = asymIdList[i],
          seqId = `${seqIdList[i]}`,
          x = `${formatFloat(xList[i], 3)}`,
          y = `${formatFloat(yList[i], 3)}`,
          z = `${formatFloat(zList[i], 3)}`,
          occupancy = `${formatFloat(occupancyList[i], 2)}`,
          b = `${formatFloat(bList[i], 2)}`,
          typeSymbol = typeSymbolList[i];
          
        {
          content += group.padEnd(6, ' ') +
          id.padStart(5, ' ') +
          ' ' +
          atomIdPad(atomId) +
          compId.padStart(4, ' ') +
          ' ' +
          asymId +
          seqId.padStart(4, ' ') +
          '    ' +
          x.padStart(8, ' ') +
          // ' ' +
          y.padStart(8, ' ') +
          // ' ' +
          z.padStart(8, ' ') +
          ' ' +
          occupancy.padStart(5, ' ') +
          '' +
          b.padStart(6, ' ') +
          '           ' +
          typeSymbol +
          '  ' +
          '\n';
        }

        if (anisotropFlag && anisotropUList[i]) {
          const anisotropU = anisotropUList[i] as number[];
          const a = `${formatFloat(anisotropU[0]*10000, 0)}`, b = `${formatFloat(anisotropU[4]*10000, 0)}`, c = `${formatFloat(anisotropU[8]*10000, 0)}`, d = `${formatFloat(anisotropU[3]*10000, 0)}`, e = `${formatFloat(anisotropU[6]*10000, 0)}`, f = `${formatFloat(anisotropU[7]*10000, 0)}`;
          if (!(a === '0' && b === '0' && c === '0' && d === '0' && e === '0' && f === '0')) {

            const groupName = 'ANISOU';
  
            content += groupName.padEnd(6, ' ') +
              id.padStart(5, ' ') +
              '  ' +
              atomId.padEnd(3, ' ') +
              compId.padStart(4, ' ') +
              ' ' +
              asymId +
              seqId.padStart(4, ' ') +
              '  ' + 
              a.padStart(7, ' ') +
              b.padStart(7, ' ') +
              c.padStart(7, ' ') +
              d.padStart(7, ' ') +
              e.padStart(7, ' ') +
              f.padStart(7, ' ') +
              '       ' +
              typeSymbol + 
              '  ' +
              '\n';
          }
        }

        i++
      }
      if (connectFlag) {
        connectResult.forEach(([p1, p2]) => {
          if (p1 >= start && p1 <= end && p2 >= start && p2 <= end) {
            const id1 = `${idList[p1]}`, id2 = `${idList[p2]}`;
            connectContent += `CONECT`
              + id1.padStart(5, ' ')
              + id2.padStart(5, ' ')
              + '\n';
          }
        })
      }
      if (connectContent) content += connectContent;
      const _label = getUniqueNameFromArr(labels, label)
      result.push({
        label: _label, content
      })
      labels.push(_label)
    })
    return result
    
  } catch (error) {
    throw error
  }
}

function atomIdPad(input: string) {
    // 初始化变量
    let num1 = null;
    let letter1 = null;
    let letter2 = null;
    let num2 = null;
  
    // 解析输入字符串
    for (let char of input) {
      if (/\d/.test(char)) { // 检查是否是数字
        if (num1 === null) {
          num1 = char;
        } else {
          num2 = char;
        }
      } else if (/[a-zA-Z]/.test(char)) { // 检查是否是字母
        if (letter1 === null) {
          letter1 = char;
        } else {
          letter2 = char;
        }
      }
    }
  
    // 构建结果字符串
    let result = [' ', ' ', ' ', ' ']; // 初始化为四个空格
  
    if (num1 !== null) {
      result[0] = num1;
    }
  
    result[1] = letter1 || ' '; // 字母1必须存在
  
    if (letter2 !== null) {
      result[2] = letter2;
      if (num2 !== null) {
        result[3] = num2;
      }
    } else {
      if (num2 !== null) {
        result[2] = num2; // 如果字母2不存在，数字2代替字母2的位置
      }
    }
  
    return result.join('');
}
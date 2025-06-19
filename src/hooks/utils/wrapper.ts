import { Unit } from "molstar/lib/mol-model/structure";
import { SequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/wrapper";

export function getWrapperSequence(wrapper: SequenceWrapper.Any | string):Map<number, number> | undefined {
  if (typeof wrapper === 'string') {
    return undefined
  }
  // @ts-ignore
  return wrapper.sequence?.indexMap || wrapper.sequenceIndices
}

export function getWrapperUnit(wrapper: SequenceWrapper.Any | string): Unit.Atomic | undefined {
  if (typeof wrapper === 'string') {
    return undefined
  }
  // @ts-ignore
  return [...(wrapper.unitMap as Map<number, Unit.Atomic>).values()][0]
}
export function getWrapperAsymId(wrapper: SequenceWrapper.Any | string): string | undefined {
  if (typeof wrapper === 'string') {
    return undefined
  }
  // @ts-ignore
  return wrapper.asymId
}
import type { Model, Structure } from "molstar/lib/mol-model/structure";
import type { StructureRef } from "molstar/lib/mol-plugin-state/manager/structure/hierarchy-state";
import type { StateObjectCell } from "molstar/lib/mol-state"
import type { StructureComponentRef } from 'molstar/lib/mol-plugin-state/manager/structure/hierarchy-state';
import type { StructureRepresentationRef } from 'molstar/lib/mol-plugin-state/manager/structure/hierarchy-state';
import type { SequenceWrapper } from "molstar/lib/mol-plugin-ui/sequence/wrapper"
import type { Loci as ElementLoci } from "molstar/lib/mol-model/structure/structure/element/loci";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

export type TStructure = Structure;
export type TStructureRef = StructureRef;
export type TStateObjectCell = StateObjectCell;
export type TStructureComponentRef = StructureComponentRef;
export type TStructureRepresentationRef = StructureRepresentationRef;

export type TWrapper = {
  wrapper: (string | SequenceWrapper.Any),
  label: string,
  key: string
  chainType: string
  chainGroupId: number;
}

export type TModelEntity = {
  key: string;
  label: string;
  chainGroups?: TChainGroup[]
  model: Model
  type: string
}
export type TChainGroup = {
  id: number;
  label: string;
  operators?: TOperator[]
}
export type TOperator = {
  id: string;
  label: string;
}

export type TRepresentationType = "cartoon" | "backbone" | "ball-and-stick" | "carbohydrate" | "ellipsoid" | "gaussian-surface" | "gaussian-volume" | "label" | "line" | "molecular-surface" | "orientation" | "point" | "putty" | "spacefill" | undefined

export type TLocation = {
  loci?: ElementLoci,
  structureKey: string,
  wrapperKey?: string,
  chainGroupId: number
  atomIndex?: number;
  seqIdx?: number;
  chainIndex: number
  elements: number[]
  chainType?: string,
  chainName?: string
  molecule?: string;
}

export type TMolstarPlugin = PluginUIContext

export type TState = {
  [key: string]: any
}

export type TProtein = {
  key: string;
  name: string;
  filename: string;
  filetype: string;
  status: 'loading' | 'loaded' | 'error';
  molData: TProteinMolData
}

export type TProteinMolData = {
  structureKey?: string;
  structure?: TStructure;
  wrappers?: TWrapper[];
  structureLabel?: string;
  structureVersion?: string;
  modelEntities?: TModelEntity[];
  modelId?: string;
  structureRef?: TStructureRef;
  cell?: TStateObjectCell;
  componentGroups?: TStructureComponentRef[]
  componentRepresentations?: TStructureRepresentationRef[][]
}

export type TProteinDataSelectionData = {chain: string, chainIndex: number, molecule: string}

export type TProteinPositionAnnotation = {
  id: string;
  type: 'position-annotation';
  positionList: TProteinDataSelectionData[];
  title: string;
  description: string;
  username: string;
  date: number
}

export type TFileInfo = {
  filename: string;
  filetype: string
}


export enum EProteinStatus {
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}


export type TLociChainInfo = {
  index: number;
  chain?: string;
}

export enum PinType {
  EXECUTION = 'EXECUTION',
  DATA = 'DATA',
}

export enum DataType {
  BOOLEAN = 'BOOLEAN',
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  STRING = 'STRING',
  ANY = 'ANY',
}

export enum PinDirection {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

export type NodeId = string;
export type PinId = string;
export type ConnectionId = string;
export type VariableId = string;

export interface Pin {
  id: PinId;
  nodeId: NodeId;
  name: string;
  type: PinType;
  dataType: DataType;
  direction: PinDirection;
  value?: any; // For literal nodes or inputs with default values
}

export interface Node {
  id: NodeId;
  type: string; // e.g., 'EVENT_BEGIN_PLAY', 'ACTION_PRINT_STRING'
  name: string;
  position: { x: number; y: number };
  inputs: Pin[];
  outputs: Pin[];
}

export interface Connection {
  id: ConnectionId;
  from: { nodeId: NodeId; pinId: PinId };
  to: { nodeId: NodeId; pinId: PinId };
}

export interface Variable {
  id: VariableId;
  name: string;
  type: DataType;
  value: any;
}

export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
}

export interface PendingConnection {
  from: { nodeId: NodeId; pinId: PinId };
  endPos: { x: number; y: number };
}

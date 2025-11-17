
import type { Node, Pin } from './types';
import { PinType, DataType, PinDirection, NodeCategory } from './types';
import { v4 as uuidv4 } from 'uuid';

export const PIN_SIZE = 16;
export const NODE_HEADER_HEIGHT = 30;
export const NODE_WIDTH = 220;

export const DATA_TYPE_COLORS: { [key in DataType]: string } = {
  [DataType.BOOLEAN]: 'bg-red-500',
  [DataType.INTEGER]: 'bg-cyan-400',
  [DataType.FLOAT]: 'bg-green-500',
  [DataType.STRING]: 'bg-purple-500',
  [DataType.ANY]: 'bg-gray-400',
};

export const DATA_TYPE_COLORS_SVG: { [key in DataType]: string } = {
  [DataType.BOOLEAN]: '#ef4444',
  [DataType.INTEGER]: '#22d3ee',
  [DataType.FLOAT]: '#22c55e',
  [DataType.STRING]: '#a855f7',
  [DataType.ANY]: '#9ca3af',
};

export const NODE_CATEGORY_COLORS: { [key in NodeCategory]: string } = {
  [NodeCategory.EVENT]: 'bg-red-800',
  [NodeCategory.ACTION]: 'bg-blue-800',
  [NodeCategory.FLOW_CONTROL]: 'bg-gray-600',
  [NodeCategory.DATA]: 'bg-green-800',
  [NodeCategory.COMMENT]: 'bg-black bg-opacity-40',
};

export type NodeTemplate = Omit<Node, 'id' | 'position' | 'inputs' | 'outputs'> & {
  inputs: Omit<Pin, 'id' | 'nodeId'>[];
  outputs: Omit<Pin, 'id' | 'nodeId'>[];
};

export const createNodeFromTemplate = (template: NodeTemplate, position: {x: number, y: number}): Node => {
    const nodeId = uuidv4();
    const node: Node = {
        ...template,
        id: nodeId,
        position,
        inputs: template.inputs.map(pin => ({...pin, id: uuidv4(), nodeId})),
        outputs: template.outputs.map(pin => ({...pin, id: uuidv4(), nodeId})),
    }

    if (template.type === 'COMMENT') {
        node.width = 300;
        node.height = 100;
        node.commentText = 'A descriptive comment';
    }

    return node;
}

export const NODE_TEMPLATES: { [key: string]: NodeTemplate } = {
  // Events
  EVENT_BEGIN_PLAY: {
    type: 'EVENT_BEGIN_PLAY',
    name: 'Event BeginPlay',
    category: NodeCategory.EVENT,
    inputs: [],
    outputs: [
      { name: '', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.OUTPUT },
    ],
  },
  // Actions
  ACTION_PRINT_STRING: {
    type: 'ACTION_PRINT_STRING',
    name: 'Print String',
    category: NodeCategory.ACTION,
    inputs: [
      { name: '', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.INPUT },
      { name: 'In String', type: PinType.DATA, dataType: DataType.STRING, direction: PinDirection.INPUT, value: 'Hello' },
    ],
    outputs: [
      { name: '', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.OUTPUT },
    ],
  },
  // Flow Control
  BRANCH: {
    type: 'BRANCH',
    name: 'Branch',
    category: NodeCategory.FLOW_CONTROL,
    inputs: [
      { name: '', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.INPUT },
      { name: 'Condition', type: PinType.DATA, dataType: DataType.BOOLEAN, direction: PinDirection.INPUT },
    ],
    outputs: [
      { name: 'True', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.OUTPUT },
      { name: 'False', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.OUTPUT },
    ],
  },
  FLOW_LOOP: {
    type: 'FLOW_LOOP',
    name: 'For Loop',
    category: NodeCategory.FLOW_CONTROL,
    inputs: [
      { name: '', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.INPUT },
      { name: 'First Index', type: PinType.DATA, dataType: DataType.INTEGER, direction: PinDirection.INPUT, value: 0 },
      { name: 'Last Index', type: PinType.DATA, dataType: DataType.INTEGER, direction: PinDirection.INPUT, value: 9 },
    ],
    outputs: [
      { name: 'Loop Body', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.OUTPUT },
      { name: 'Index', type: PinType.DATA, dataType: DataType.INTEGER, direction: PinDirection.OUTPUT },
      { name: 'Completed', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.OUTPUT },
    ],
  },
  // Math
  MATH_ADD_INT: {
    type: 'MATH_ADD_INT',
    name: 'Add (Integer)',
    category: NodeCategory.DATA,
    inputs: [
      { name: 'A', type: PinType.DATA, dataType: DataType.INTEGER, direction: PinDirection.INPUT, value: 0 },
      { name: 'B', type: PinType.DATA, dataType: DataType.INTEGER, direction: PinDirection.INPUT, value: 0 },
    ],
    outputs: [
      { name: 'Return Value', type: PinType.DATA, dataType: DataType.INTEGER, direction: PinDirection.OUTPUT },
    ],
  },
  // Literals
  LITERAL_STRING: {
    type: 'LITERAL_STRING',
    name: 'String Literal',
    category: NodeCategory.DATA,
    inputs: [
        { name: '', type: PinType.DATA, dataType: DataType.STRING, direction: PinDirection.INPUT, value: "My String" }
    ],
    outputs: [
      { name: '', type: PinType.DATA, dataType: DataType.STRING, direction: PinDirection.OUTPUT },
    ],
  },
  LITERAL_INTEGER: {
    type: 'LITERAL_INTEGER',
    name: 'Integer Literal',
    category: NodeCategory.DATA,
    inputs: [
        { name: '', type: PinType.DATA, dataType: DataType.INTEGER, direction: PinDirection.INPUT, value: 123 }
    ],
    outputs: [
      { name: '', type: PinType.DATA, dataType: DataType.INTEGER, direction: PinDirection.OUTPUT },
    ],
  },
  LITERAL_BOOLEAN: {
    type: 'LITERAL_BOOLEAN',
    name: 'Boolean Literal',
    category: NodeCategory.DATA,
    inputs: [
        { name: '', type: PinType.DATA, dataType: DataType.BOOLEAN, direction: PinDirection.INPUT, value: true }
    ],
    outputs: [
      { name: '', type: PinType.DATA, dataType: DataType.BOOLEAN, direction: PinDirection.OUTPUT },
    ],
  },
  // Misc
  COMMENT: {
    type: 'COMMENT',
    name: 'Comment',
    category: NodeCategory.COMMENT,
    inputs: [],
    outputs: [],
  },
};

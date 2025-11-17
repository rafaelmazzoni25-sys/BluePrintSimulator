
import { useState, useCallback } from 'react';
import type { Node, Connection, Variable, Pin, NodeId, PinId } from '../types';
import { DataType, PinDirection, PinType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createNodeFromTemplate, NODE_TEMPLATES } from '../constants';

export const useBlueprintState = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    let nodeToAdd: Node | null = null;
    if (type.startsWith('GET_VAR_')) {
        const varId = type.replace('GET_VAR_', '');
        const variable = variables.find(v => v.id === varId);
        if (variable) {
            nodeToAdd = createNodeFromTemplate({
                type: type,
                name: `Get ${variable.name}`,
                inputs: [],
                outputs: [{ name: variable.name, type: PinType.DATA, dataType: variable.type, direction: PinDirection.OUTPUT }]
            }, position);
        }
    } else if (type.startsWith('SET_VAR_')) {
        const varId = type.replace('SET_VAR_', '');
        const variable = variables.find(v => v.id === varId);
        if (variable) {
            nodeToAdd = createNodeFromTemplate({
                type: type,
                name: `Set ${variable.name}`,
                inputs: [
                    { name: '', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.INPUT },
                    { name: variable.name, type: PinType.DATA, dataType: variable.type, direction: PinDirection.INPUT }
                ],
                outputs: [{ name: '', type: PinType.EXECUTION, dataType: DataType.ANY, direction: PinDirection.OUTPUT }]
            }, position);
        }
    } else {
        const template = NODE_TEMPLATES[type];
        if (template) {
            nodeToAdd = createNodeFromTemplate(template, position);
        }
    }
    
    if (nodeToAdd) {
        setNodes((prev) => [...prev, nodeToAdd!]);
    }
  }, [variables]);

  const updateNodePosition = useCallback((nodeId: string, delta: { x: number; y: number }) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
          : node
      )
    );
  }, []);

  const updateNodeInputValue = useCallback((nodeId: NodeId, pinId: PinId, value: any) => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          inputs: node.inputs.map(pin => pin.id === pinId ? {...pin, value} : pin)
        };
      }
      return node;
    }));
  }, []);

  const getPin = useCallback((nodeId: NodeId, pinId: PinId): Pin | undefined => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return undefined;
    return [...node.inputs, ...node.outputs].find(p => p.id === pinId);
  }, [nodes]);

  const addConnection = useCallback((fromPin: Pin, toPin: Pin) => {
    if (fromPin.direction === toPin.direction) return;

    const from = fromPin.direction === PinDirection.OUTPUT ? fromPin : toPin;
    const to = fromPin.direction === PinDirection.INPUT ? fromPin : toPin;

    if (from.type !== to.type) return;

    if (from.type === PinType.DATA && from.dataType !== to.dataType) return;

    // Data inputs can only have one connection
    if (to.type === PinType.DATA) {
        setConnections(prev => prev.filter(c => !(c.to.nodeId === to.nodeId && c.to.pinId === to.id)));
    }

    setConnections((prev) => [
      ...prev,
      {
        id: uuidv4(),
        from: { nodeId: from.nodeId, pinId: from.id },
        to: { nodeId: to.nodeId, pinId: to.id },
      },
    ]);
  }, []);
  
  const addVariable = useCallback(() => {
    const newVar: Variable = {
      id: uuidv4(),
      name: `NewVar_${variables.length}`,
      type: DataType.BOOLEAN,
      value: false,
    };
    setVariables((prev) => [...prev, newVar]);
  }, [variables.length]);

  const updateVariable = useCallback((id: string, newVar: Partial<Variable>) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...newVar } : v))
    );
  }, []);
  
  const removeVariable = useCallback((id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return {
    nodes,
    connections,
    variables,
    addNode,
    updateNodePosition,
    updateNodeInputValue,
    addConnection,
    getPin,
    addVariable,
    updateVariable,
    removeVariable,
  };
};

export type BlueprintState = ReturnType<typeof useBlueprintState>;

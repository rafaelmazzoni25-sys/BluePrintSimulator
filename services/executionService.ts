
import type { Node, Connection, Variable, Pin, NodeId, PinId } from '../types';
import { PinType, PinDirection } from '../types';

type VariableMap = Map<string, Variable>;
type NodesMap = Map<NodeId, Node>;
type ConnectionsMap = {
    byFrom: Map<string, Connection[]>;
    byTo: Map<string, Connection | undefined>;
};
type ExecutionContext = {
    loopNodeId: NodeId;
    currentIndex: number;
};

function buildMaps(nodes: Node[], connections: Connection[]) {
    const nodesMap: NodesMap = new Map(nodes.map(n => [n.id, n]));
    const connectionsMap: ConnectionsMap = { byFrom: new Map(), byTo: new Map() };

    for (const conn of connections) {
        const fromKey = `${conn.from.nodeId}-${conn.from.pinId}`;
        if (!connectionsMap.byFrom.has(fromKey)) {
            connectionsMap.byFrom.set(fromKey, []);
        }
        connectionsMap.byFrom.get(fromKey)!.push(conn);

        const toKey = `${conn.to.nodeId}-${conn.to.pinId}`;
        connectionsMap.byTo.set(toKey, conn);
    }
    return { nodesMap, connectionsMap };
}

function evaluatePin(nodeId: NodeId, pinId: PinId, nodesMap: NodesMap, connectionsMap: ConnectionsMap, variables: VariableMap, contexts: ExecutionContext[]): any {
    const node = nodesMap.get(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const pin = [...node.inputs, ...node.outputs].find(p => p.id === pinId);
    if (!pin) throw new Error(`Pin ${pinId} on node ${nodeId} not found`);

    if (pin.direction === PinDirection.INPUT) {
        const connection = connectionsMap.byTo.get(`${nodeId}-${pinId}`);
        if (connection) {
            return evaluatePin(connection.from.nodeId, connection.from.pinId, nodesMap, connectionsMap, variables, contexts);
        }
        return pin.value; // Return default value if not connected
    }

    // Pin is an OUTPUT, so we calculate its value based on the node's logic
    switch (node.type) {
        case 'LITERAL_STRING':
        case 'LITERAL_INTEGER':
        case 'LITERAL_BOOLEAN':
            const inputPin = node.inputs[0];
            const connection = connectionsMap.byTo.get(`${node.id}-${inputPin.id}`);
             if (connection) {
                return evaluatePin(connection.from.nodeId, connection.from.pinId, nodesMap, connectionsMap, variables, contexts);
            }
            return inputPin.value;
        case 'MATH_ADD_INT':
            const a = evaluatePin(nodeId, node.inputs[0].id, nodesMap, connectionsMap, variables, contexts);
            const b = evaluatePin(nodeId, node.inputs[1].id, nodesMap, connectionsMap, variables, contexts);
            return parseInt(a, 10) + parseInt(b, 10);
        case 'FLOW_LOOP':
             if (pin.name === 'Index') {
                const context = contexts.find(c => c.loopNodeId === nodeId);
                return context?.currentIndex ?? 0;
            }
            return;
        case (node.type.startsWith('GET_VAR_') ? node.type : ''): {
            const varId = node.type.replace('GET_VAR_', '');
            const variable = variables.get(varId);
            if (!variable) throw new Error(`Variable with ID ${varId} not found.`);
            return variable.value;
        }
        default:
            return pin.value;
    }
}


function* executeFrom(
    nodeId: NodeId, 
    execPinId: PinId, 
    nodesMap: NodesMap, 
    connectionsMap: ConnectionsMap, 
    variables: VariableMap,
    contexts: ExecutionContext[]
): Generator<{type: string, message: string}, void, unknown> {
    const connections = connectionsMap.byFrom.get(`${nodeId}-${execPinId}`);
    if (!connections || connections.length === 0) {
        return; // End of path
    }

    for (const connection of connections) {
        const nextNode = nodesMap.get(connection.to.nodeId);
        if (!nextNode) continue;
        
        switch (nextNode.type) {
            case 'ACTION_PRINT_STRING': {
                const inStringPin = nextNode.inputs.find(p => p.name === 'In String')!;
                const message = evaluatePin(nextNode.id, inStringPin.id, nodesMap, connectionsMap, variables, contexts);
                yield { type: 'log', message: String(message) };
                
                const nextExecPin = nextNode.outputs.find(p => p.type === PinType.EXECUTION);
                if (nextExecPin) {
                    yield* executeFrom(nextNode.id, nextExecPin.id, nodesMap, connectionsMap, variables, contexts);
                }
                break;
            }
            case 'BRANCH': {
                const conditionPin = nextNode.inputs.find(p => p.name === 'Condition')!;
                const condition = evaluatePin(nextNode.id, conditionPin.id, nodesMap, connectionsMap, variables, contexts);
                const outputPinName = condition ? 'True' : 'False';
                const nextExecPin = nextNode.outputs.find(p => p.name === outputPinName);
                if (nextExecPin) {
                    yield* executeFrom(nextNode.id, nextExecPin.id, nodesMap, connectionsMap, variables, contexts);
                }
                break;
            }
            case (nextNode.type.startsWith('SET_VAR_') ? nextNode.type : ''): {
                const varId = nextNode.type.replace('SET_VAR_', '');
                const variable = variables.get(varId);
                if(variable) {
                    const dataInputPin = nextNode.inputs.find(p => p.type === PinType.DATA)!;
                    const value = evaluatePin(nextNode.id, dataInputPin.id, nodesMap, connectionsMap, variables, contexts);
                    variable.value = value;
                    variables.set(varId, variable);
                }
                const nextExecPin = nextNode.outputs.find(p => p.type === PinType.EXECUTION);
                if (nextExecPin) {
                    yield* executeFrom(nextNode.id, nextExecPin.id, nodesMap, connectionsMap, variables, contexts);
                }
                break;
            }
            case 'FLOW_LOOP': {
                const firstIndexPin = nextNode.inputs.find(p => p.name === 'First Index')!;
                const lastIndexPin = nextNode.inputs.find(p => p.name === 'Last Index')!;
                
                const firstIndex = evaluatePin(nextNode.id, firstIndexPin.id, nodesMap, connectionsMap, variables, contexts);
                const lastIndex = evaluatePin(nextNode.id, lastIndexPin.id, nodesMap, connectionsMap, variables, contexts);

                const loopBodyPin = nextNode.outputs.find(p => p.name === 'Loop Body')!;
                const completedPin = nextNode.outputs.find(p => p.name === 'Completed')!;

                for (let i = firstIndex; i <= lastIndex; i++) {
                    const newContexts = contexts.filter(c => c.loopNodeId !== nextNode.id);
                    newContexts.push({ loopNodeId: nextNode.id, currentIndex: i });
                    yield* executeFrom(nextNode.id, loopBodyPin.id, nodesMap, connectionsMap, variables, newContexts);
                }

                yield* executeFrom(nextNode.id, completedPin.id, nodesMap, connectionsMap, variables, contexts);
                break;
            }
            default:
                break;
        }
    }
}

export function* executeGraph(nodes: Node[], connections: Connection[], variables: VariableMap) {
    const { nodesMap, connectionsMap } = buildMaps(nodes, connections);

    const startNode = nodes.find(n => n.type === 'EVENT_BEGIN_PLAY');
    if (!startNode) {
        yield { type: 'log', message: 'No BeginPlay event found.' };
        return;
    }

    const startExecPin = startNode.outputs.find(p => p.type === PinType.EXECUTION);
    if (startExecPin) {
        yield* executeFrom(startNode.id, startExecPin.id, nodesMap, connectionsMap, variables, []);
    }
}

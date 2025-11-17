
import type { Node, Connection, Variable, Pin, NodeId, PinId } from '../types';
import { PinType, PinDirection } from '../types';

type VariableMap = Map<string, Variable>;
type NodesMap = Map<NodeId, Node>;
type ConnectionsMap = {
    byFrom: Map<string, Connection[]>;
    byTo: Map<string, Connection | undefined>;
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

function evaluatePin(nodeId: NodeId, pinId: PinId, nodesMap: NodesMap, connectionsMap: ConnectionsMap, variables: VariableMap): any {
    const node = nodesMap.get(nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const pin = [...node.inputs, ...node.outputs].find(p => p.id === pinId);
    if (!pin) throw new Error(`Pin ${pinId} on node ${nodeId} not found`);

    if (pin.direction === PinDirection.INPUT) {
        const connection = connectionsMap.byTo.get(`${nodeId}-${pinId}`);
        if (connection) {
            return evaluatePin(connection.from.nodeId, connection.from.pinId, nodesMap, connectionsMap, variables);
        }
        return pin.value; // Return default value if not connected
    }

    // Pin is an OUTPUT, so we calculate its value based on the node's logic
    switch (node.type) {
        case 'LITERAL_STRING':
        case 'LITERAL_INTEGER':
        case 'LITERAL_BOOLEAN':
            // The value is stored in the corresponding input pin
            return node.inputs[0].value;
        case 'MATH_ADD_INT':
            const a = evaluatePin(nodeId, node.inputs[0].id, nodesMap, connectionsMap, variables);
            const b = evaluatePin(nodeId, node.inputs[1].id, nodesMap, connectionsMap, variables);
            return parseInt(a, 10) + parseInt(b, 10);
        case 'GET_VAR':
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

export function* executeGraph(nodes: Node[], connections: Connection[], variables: VariableMap) {
    const { nodesMap, connectionsMap } = buildMaps(nodes, connections);

    const startNode = nodes.find(n => n.type === 'EVENT_BEGIN_PLAY');
    if (!startNode) {
        yield { type: 'log', message: 'No BeginPlay event found.' };
        return;
    }

    let currentNode: Node | undefined = startNode;
    let execPinId: PinId | undefined = startNode.outputs.find(p => p.type === PinType.EXECUTION)!.id;

    while (currentNode && execPinId) {
        const currentExecPin = currentNode.outputs.find(p => p.id === execPinId);
        
        // Find next connection from the *current* execution output pin
        const execConnections = connectionsMap.byFrom.get(`${currentNode.id}-${execPinId}`);
        
        let nextNodeId: NodeId | undefined = undefined;
        let nextExecPinId: PinId | undefined = undefined;

        if (execConnections && execConnections.length > 0) {
            const nextConnection = execConnections[0]; // Assuming one exec path for now
            const nextNode = nodesMap.get(nextConnection.to.nodeId);
            if(nextNode){
                 // Now we process the *next* node, which is the one connected to our current exec output
                currentNode = nextNode;

                switch (currentNode.type) {
                    case 'ACTION_PRINT_STRING': {
                        const inStringPin = currentNode.inputs.find(p => p.name === 'In String')!;
                        const message = evaluatePin(currentNode.id, inStringPin.id, nodesMap, connectionsMap, variables);
                        yield { type: 'log', message: String(message) };
                        // Find the exec output of this print string node to continue
                        nextExecPinId = currentNode.outputs.find(p => p.type === PinType.EXECUTION)?.id;
                        break;
                    }
                    case 'BRANCH': {
                        const conditionPin = currentNode.inputs.find(p => p.name === 'Condition')!;
                        const condition = evaluatePin(currentNode.id, conditionPin.id, nodesMap, connectionsMap, variables);
                        const outputPinName = condition ? 'True' : 'False';
                        nextExecPinId = currentNode.outputs.find(p => p.name === outputPinName)?.id;
                        break;
                    }
                     case (currentNode.type.startsWith('SET_VAR_') ? currentNode.type : ''): {
                        const varId = currentNode.type.replace('SET_VAR_', '');
                        const variable = variables.get(varId);
                        if(variable) {
                            const dataInputPin = currentNode.inputs.find(p => p.type === PinType.DATA)!;
                            const value = evaluatePin(currentNode.id, dataInputPin.id, nodesMap, connectionsMap, variables);
                            variable.value = value;
                            variables.set(varId, variable);
                        }
                        nextExecPinId = currentNode.outputs.find(p => p.type === PinType.EXECUTION)?.id;
                        break;
                     }
                    default:
                        // For nodes without special logic, just find their exec output
                        nextExecPinId = currentNode.outputs.find(p => p.type === PinType.EXECUTION)?.id;
                        break;
                }
                
                execPinId = nextExecPinId;
            } else {
                 currentNode = undefined;
                 execPinId = undefined;
            }
        } else {
             // End of execution path
             currentNode = undefined;
             execPinId = undefined;
        }
    }
}

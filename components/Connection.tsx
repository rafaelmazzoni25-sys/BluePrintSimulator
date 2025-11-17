
import React from 'react';
import type { Node, Connection as ConnectionType, PendingConnection } from '../types';
import { PinDirection, PinType } from '../types';
import { DATA_TYPE_COLORS_SVG, NODE_HEADER_HEIGHT, NODE_WIDTH, PIN_SIZE } from '../constants';

interface ConnectionProps {
  connection: ConnectionType | PendingConnection;
  nodes: Node[];
  isPending?: boolean;
}

function getPinPosition(node: Node, pinId: string, editorRect: DOMRect): { x: number; y: number; pinType: PinType, dataType: string } | null {
  const pin = [...node.inputs, ...node.outputs].find(p => p.id === pinId);
  if (!pin) return null;

  const pinIndex = pin.direction === PinDirection.INPUT
    ? node.inputs.findIndex(p => p.id === pinId)
    : node.outputs.findIndex(p => p.id === pinId);

  const x = pin.direction === PinDirection.INPUT
    ? node.position.x
    : node.position.x + NODE_WIDTH;
  
  const y = node.position.y + NODE_HEADER_HEIGHT + 20 + (pinIndex * 24);

  return { x, y, pinType: pin.type, dataType: pin.dataType };
}

export const Connection: React.FC<ConnectionProps> = ({ connection, nodes, isPending = false }) => {
  const fromNode = nodes.find(n => n.id === connection.from.nodeId);
  if (!fromNode) return null;

  const fromPinInfo = getPinPosition(fromNode, connection.from.pinId, document.body.getBoundingClientRect());
  if (!fromPinInfo) return null;

  let toPos, toPinInfo;

  if (isPending) {
    toPos = (connection as PendingConnection).endPos;
  } else {
    const toNode = nodes.find(n => n.id === (connection as ConnectionType).to.nodeId);
    if (!toNode) return null;
    toPinInfo = getPinPosition(toNode, (connection as ConnectionType).to.pinId, document.body.getBoundingClientRect());
    if (!toPinInfo) return null;
    toPos = { x: toPinInfo.x, y: toPinInfo.y };
  }
  
  const startPos = {x: fromPinInfo.x, y: fromPinInfo.y};

  const path = `M ${startPos.x} ${startPos.y} C ${startPos.x + 100} ${startPos.y} ${toPos.x - 100} ${toPos.y} ${toPos.x} ${toPos.y}`;

  const strokeColor = fromPinInfo.pinType === PinType.EXECUTION
    ? 'white'
    : DATA_TYPE_COLORS_SVG[fromPinInfo.dataType as keyof typeof DATA_TYPE_COLORS_SVG] || 'grey';

  return (
    <path
      d={path}
      stroke={strokeColor}
      strokeWidth="2"
      fill="none"
      strokeDasharray={fromPinInfo.pinType === PinType.EXECUTION ? "0" : "0"}
    />
  );
};

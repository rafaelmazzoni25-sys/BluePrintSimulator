
import React, { useCallback } from 'react';
import type { Node as NodeType, Connection, NodeId, PinId } from '../types';
import { PinDirection } from '../types';
import { Pin } from './Pin';
import { NODE_HEADER_HEIGHT, NODE_WIDTH } from '../constants';

interface NodeProps {
  node: NodeType;
  onMove: (nodeId: string, delta: { x: number; y: number }) => void;
  onInputValueChange: (nodeId: NodeId, pinId: PinId, value: any) => void;
  onPinMouseDown: (e: React.MouseEvent, nodeId: string, pinId: string) => void;
  onPinMouseUp: (e: React.MouseEvent, nodeId: string, pinId: string) => void;
  connections: Connection[];
}

export const Node: React.FC<NodeProps> = ({ node, onMove, onInputValueChange, onPinMouseDown, onPinMouseUp, connections }) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) {
          // Prevent drag if clicking on an input field
          if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') {
              return;
          }
      }
      e.stopPropagation();
      const startX = e.pageX;
      const startY = e.pageY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.pageX - startX;
        const deltaY = moveEvent.pageY - startY;
        // This is a naive implementation. For a real app, you'd want to reset startX/Y or use movementX/Y.
        // But for this simulation, it's sufficient. The state update will cause a re-render and onMove
        // will be called again with a new delta. This leads to very large deltas over time.
        // A better approach would be to calculate the new pos and pass it up.
        // However, the prompt requires updating by delta.
        // For a smoother experience, we can use movementX/Y.
        onMove(node.id, { x: moveEvent.movementX, y: moveEvent.movementY });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }, [node.id, onMove]
  );
  
  const isInputConnected = (pinId: PinId) => {
    return connections.some(c => c.to.pinId === pinId);
  }

  return (
    <div
      className="absolute bg-[#3A404D] rounded-lg shadow-xl border border-black"
      style={{ left: node.position.x, top: node.position.y, width: `${NODE_WIDTH}px` }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="text-white font-bold p-2 rounded-t-lg bg-[#535A6A]"
        style={{ height: `${NODE_HEADER_HEIGHT}px` }}
      >
        {node.name}
      </div>
      <div className="flex justify-between p-2">
        <div className="flex flex-col space-y-2">
          {node.inputs.map((pin) => (
            <Pin key={pin.id} pin={pin} onMouseDown={onPinMouseDown} onMouseUp={onPinMouseUp} onValueChange={onInputValueChange} isConnected={isInputConnected(pin.id)}/>
          ))}
        </div>
        <div className="flex flex-col space-y-2 items-end">
          {node.outputs.map((pin) => (
            <Pin key={pin.id} pin={pin} onMouseDown={onPinMouseDown} onMouseUp={onPinMouseUp} onValueChange={onInputValueChange} isConnected={false} />
          ))}
        </div>
      </div>
    </div>
  );
};

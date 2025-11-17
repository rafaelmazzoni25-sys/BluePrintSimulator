
import React, { useCallback } from 'react';
import type { Node as NodeType, Connection, NodeId, PinId } from '../types';
import { PinDirection } from '../types';
import { Pin } from './Pin';
import { NODE_HEADER_HEIGHT, NODE_WIDTH } from '../constants';

interface NodeProps {
  node: NodeType;
  onMove: (nodeId: string, delta: { x: number; y: number }) => void;
  onInputValueChange: (nodeId: NodeId, pinId: PinId, value: any) => void;
  onUpdateDetails: (nodeId: NodeId, details: Partial<NodeType>) => void;
  onPinMouseDown: (e: React.MouseEvent, nodeId: string, pinId: string) => void;
  onPinMouseUp: (e: React.MouseEvent, nodeId: string, pinId: string) => void;
  connections: Connection[];
}

export const Node: React.FC<NodeProps> = ({ node, onMove, onInputValueChange, onUpdateDetails, onPinMouseDown, onPinMouseUp, connections }) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
          return;
      }
      // Allow drag if clicking on the drag handle of a comment or the header
      if (target.dataset.dragHandle) {
          // fall through to drag logic
      } else if (e.currentTarget !== e.target) {
          return;
      }
      
      e.stopPropagation();

      const handleMouseMove = (moveEvent: MouseEvent) => {
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
  
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.pageX;
    const startY = e.pageY;
    const startWidth = node.width || 300;
    const startHeight = node.height || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.pageX - startX);
      const newHeight = startHeight + (moveEvent.pageY - startY);
      onUpdateDetails(node.id, { 
          width: Math.max(150, newWidth),
          height: Math.max(80, newHeight) 
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [node.id, node.width, node.height, onUpdateDetails]);

  const isInputConnected = (pinId: PinId) => {
    return connections.some(c => c.to.pinId === pinId);
  }

  if (node.type === 'COMMENT') {
    return (
        <div
          className="absolute bg-black bg-opacity-30 rounded-lg shadow-xl border border-gray-500 flex flex-col"
          style={{ left: node.position.x, top: node.position.y, width: `${node.width}px`, height: `${node.height}px`, minWidth: '150px', minHeight: '80px' }}
          onMouseDown={handleMouseDown}
        >
          <div
            data-drag-handle="true"
            className="text-white p-1 rounded-t-lg bg-black bg-opacity-40 cursor-move"
            style={{ height: '28px' }}
          >
             <input 
                type="text" 
                value={node.name} 
                onChange={(e) => onUpdateDetails(node.id, { name: e.target.value })} 
                className="bg-transparent w-full h-full focus:outline-none p-1"
                placeholder="Comment Title"
             />
          </div>
          <textarea
            value={node.commentText}
            onChange={(e) => onUpdateDetails(node.id, { commentText: e.target.value })}
            className="w-full flex-grow bg-transparent text-gray-300 p-2 resize-none focus:outline-none"
            placeholder="Comment text..."
          />
          <div 
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0V16H0L16 0Z' fill='%236b7280'/%3E%3C/svg%3E%0A")`}}
            onMouseDown={handleResizeMouseDown}
          />
        </div>
    );
  }

  return (
    <div
      className="absolute bg-[#3A404D] rounded-lg shadow-xl border border-black"
      style={{ left: node.position.x, top: node.position.y, width: `${NODE_WIDTH}px` }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="text-white font-bold p-2 rounded-t-lg bg-[#535A6A] cursor-move"
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

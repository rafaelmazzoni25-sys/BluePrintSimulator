
import React from 'react';
import type { Node as NodeType, Connection, NodeId, PinId, Pin as PinType } from '../types';
import { NodeCategory } from '../types';
import { Pin } from './Pin';
import { NODE_HEADER_HEIGHT, NODE_WIDTH, NODE_CATEGORY_COLORS } from '../constants';

interface NodeProps {
  node: NodeType;
  onInputValueChange: (nodeId: NodeId, pinId: PinId, value: any) => void;
  onUpdateDetails: (nodeId: NodeId, details: Partial<NodeType>) => void;
  connections: Connection[];
  sourcePinForPendingConnection: PinType | null;
  isSelected: boolean;
}

export const Node: React.FC<NodeProps> = ({ node, onInputValueChange, onUpdateDetails, connections, sourcePinForPendingConnection, isSelected }) => {
  
  const isPinConnected = (pinId: PinId) => {
    return connections.some(c => c.from.pinId === pinId || c.to.pinId === pinId);
  }

  if (node.type === 'COMMENT') {
    return (
        <div
          className={`absolute bg-black bg-opacity-30 rounded-lg shadow-xl flex flex-col border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-500'}`}
          style={{ left: node.position.x, top: node.position.y, width: `${node.width}px`, height: `${node.height}px`, minWidth: '150px', minHeight: '80px' }}
          data-node-id={node.id}
        >
          <div
            data-drag-handle="true"
            className={`text-white p-1 rounded-t-lg ${NODE_CATEGORY_COLORS[NodeCategory.COMMENT]} cursor-move`}
            style={{ height: '28px' }}
          >
             <input 
                type="text" 
                value={node.name} 
                onChange={(e) => onUpdateDetails(node.id, { name: e.target.value })} 
                className="bg-transparent w-full h-full focus:outline-none p-1 pointer-events-auto"
                placeholder="Comment Title"
                onMouseDown={(e) => e.stopPropagation()} // Prevent editor from handling mousedown on this interactive element
             />
          </div>
          <textarea
            value={node.commentText}
            onChange={(e) => onUpdateDetails(node.id, { commentText: e.target.value })}
            className="w-full flex-grow bg-transparent text-gray-300 p-2 resize-none focus:outline-none pointer-events-auto"
            placeholder="Comment text..."
            onMouseDown={(e) => e.stopPropagation()} // Prevent editor from handling mousedown on this interactive element
          />
          <div 
            data-resize-handle="true"
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize pointer-events-auto"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 0V16H0L16 0Z' fill='%236b7280'/%3E%3C/svg%3E%0A")`}}
          />
        </div>
    );
  }

  return (
    <div
      className={`absolute bg-[#3A404D] rounded-lg shadow-xl border ${isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-black'}`}
      style={{ left: node.position.x, top: node.position.y, width: `${NODE_WIDTH}px` }}
      data-node-id={node.id}
    >
      <div
        data-drag-handle="true"
        className={`text-white font-bold p-2 rounded-t-lg ${NODE_CATEGORY_COLORS[node.category]} cursor-move`}
        style={{ height: `${NODE_HEADER_HEIGHT}px` }}
      >
        {node.name}
      </div>
      <div className="flex justify-between p-3">
        <div className="flex flex-col space-y-3">
          {node.inputs.map((pin) => (
            <Pin
              key={pin.id}
              pin={pin}
              onValueChange={onInputValueChange}
              isConnected={isPinConnected(pin.id)}
              sourcePinForPendingConnection={sourcePinForPendingConnection}
            />
          ))}
        </div>
        <div className="flex flex-col space-y-3 items-end">
          {node.outputs.map((pin) => (
            <Pin
              key={pin.id}
              pin={pin}
              onValueChange={onInputValueChange}
              isConnected={isPinConnected(pin.id)}
              sourcePinForPendingConnection={sourcePinForPendingConnection} />
          ))}
        </div>
      </div>
    </div>
  );
};

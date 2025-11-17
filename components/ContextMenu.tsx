
import React from 'react';
import { NODE_TEMPLATES } from '../constants';
import type { Variable } from '../types';

interface ContextMenuProps {
  position: { x: number; y: number };
  onSelect: (type: string) => void;
  variables: Variable[];
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, onSelect, variables }) => {
  const nodeTypes = Object.keys(NODE_TEMPLATES).filter(t => t !== 'COMMENT');
  const hasComment = 'COMMENT' in NODE_TEMPLATES;

  return (
    <div
      className="absolute bg-[#3A404D] border border-gray-700 rounded-md shadow-lg p-2 z-50 text-white w-64"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-sm font-bold border-b border-gray-600 pb-1 mb-1">Add Node</div>
      <ul className="max-h-80 overflow-y-auto">
        {nodeTypes.map((type) => (
          <li
            key={type}
            onClick={() => onSelect(type)}
            className="p-1 hover:bg-blue-600 rounded cursor-pointer text-sm"
          >
            {NODE_TEMPLATES[type].name}
          </li>
        ))}
         {hasComment && <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">Utilities</div>}
         {hasComment && (
            <li
                key="COMMENT"
                onClick={() => onSelect('COMMENT')}
                className="p-1 hover:bg-blue-600 rounded cursor-pointer text-sm"
            >
                {NODE_TEMPLATES['COMMENT'].name}
            </li>
         )}
        {variables.length > 0 && <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-600">Variables</div>}
        {variables.map(v => (
             <li key={`get-${v.id}`} onClick={() => onSelect(`GET_VAR_${v.id}`)} className="p-1 hover:bg-blue-600 rounded cursor-pointer text-sm">Get {v.name}</li>
        ))}
        {variables.map(v => (
             <li key={`set-${v.id}`} onClick={() => onSelect(`SET_VAR_${v.id}`)} className="p-1 hover:bg-blue-600 rounded cursor-pointer text-sm">Set {v.name}</li>
        ))}
      </ul>
    </div>
  );
};

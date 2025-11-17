
import React from 'react';

interface ToolbarProps {
  onExecute: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onExecute }) => {
  return (
    <div className="w-full bg-[#3A404D] p-2 flex items-center border-b border-gray-700">
      <button
        onClick={onExecute}
        className="px-4 py-1 bg-green-600 hover:bg-green-700 rounded text-white font-semibold flex items-center space-x-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
        <span>Execute</span>
      </button>
    </div>
  );
};

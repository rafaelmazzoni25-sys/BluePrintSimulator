
import React from 'react';
import type { Variable, VariableId } from '../types';
import { DataType } from '../types';

interface VariablesPanelProps {
  variables: Variable[];
  addVariable: () => void;
  updateVariable: (id: VariableId, newVar: Partial<Variable>) => void;
  removeVariable: (id: VariableId) => void;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({ variables, addVariable, updateVariable, removeVariable }) => {
  
  const handleValueChange = (id: VariableId, type: DataType, value: string) => {
    let parsedValue: any = value;
    if (type === DataType.INTEGER) parsedValue = parseInt(value, 10) || 0;
    if (type === DataType.FLOAT) parsedValue = parseFloat(value) || 0.0;
    updateVariable(id, { value: parsedValue });
  }

  return (
    <div className="bg-[#2A2F3A] h-full p-2 flex flex-col">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-600">
        <h2 className="text-lg font-bold text-white">Variables</h2>
        <button onClick={addVariable} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white">+</button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {variables.map((variable) => (
          <div key={variable.id} className="p-2 mb-2 bg-[#3A404D] rounded">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={variable.name}
                onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                className="bg-transparent text-white font-semibold w-2/3"
              />
               <button onClick={() => removeVariable(variable.id)} className="text-red-500 hover:text-red-400 font-bold">X</button>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <select
                value={variable.type}
                onChange={(e) => updateVariable(variable.id, { type: e.target.value as DataType })}
                className="bg-gray-700 text-white text-xs p-1 rounded w-full"
              >
                {Object.values(DataType).filter(t => t !== DataType.ANY).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
             <div className="mt-2">
                <label className="text-xs text-gray-400">Default Value</label>
                {variable.type === DataType.BOOLEAN ? (
                   <input type="checkbox" checked={!!variable.value} onChange={e => updateVariable(variable.id, { value: e.target.checked })} className="mt-1" />
                ) : (
                     <input
                      type={variable.type === DataType.STRING ? "text" : "number"}
                      value={variable.value}
                      onChange={e => handleValueChange(variable.id, variable.type, e.target.value)}
                      className="bg-gray-700 text-white text-xs p-1 rounded w-full mt-1"
                      />
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

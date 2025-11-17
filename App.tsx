
import React, { useState, useCallback } from 'react';
import { BlueprintEditor } from './components/BlueprintEditor';
import { VariablesPanel } from './components/VariablesPanel';
import { OutputLog } from './components/OutputLog';
import { Toolbar } from './components/Toolbar';
import { useBlueprintState } from './hooks/useBlueprintState';
import { executeGraph } from './services/executionService';
import type { Variable } from './types';

const App: React.FC = () => {
  const blueprintState = useBlueprintState();
  const [logs, setLogs] = useState<string[]>([]);

  const handleExecute = useCallback(() => {
    setLogs(['[Execution Started]']);
    try {
      const variableMap = new Map<string, Variable>();
      blueprintState.variables.forEach(v => variableMap.set(v.id, { ...v }));
      
      const executionGenerator = executeGraph(
        blueprintState.nodes,
        blueprintState.connections,
        variableMap
      );
      
      const run = () => {
        const result = executionGenerator.next();
        if (result.done) {
           setLogs(prev => [...prev, '[Execution Finished]']);
        } else {
          // FIX: The type of `result.value` was not being correctly narrowed after checking `result.done`. Assigning it to a new variable helps TypeScript's control flow analysis.
          const yieldedValue = result.value;
          if (yieldedValue && yieldedValue.type === 'log') {
            setLogs(prev => [...prev, yieldedValue.message]);
          }
          // For now, synchronous execution. Could add timeout for async feel.
          run();
        }
      };
      run();

    } catch (error) {
      if (error instanceof Error) {
        setLogs(prev => [...prev, `[ERROR] ${error.message}`]);
      } else {
        setLogs(prev => [...prev, `[ERROR] An unknown error occurred.`]);
      }
    }
  }, [blueprintState.nodes, blueprintState.connections, blueprintState.variables]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#202328] text-gray-200 font-sans select-none">
      <Toolbar onExecute={handleExecute} />
      <div className="flex flex-grow overflow-hidden">
        <div className="w-1/4 max-w-sm flex flex-col border-r border-gray-700">
          <VariablesPanel
            variables={blueprintState.variables}
            addVariable={blueprintState.addVariable}
            updateVariable={blueprintState.updateVariable}
            removeVariable={blueprintState.removeVariable}
          />
        </div>
        <div className="flex-grow flex flex-col">
          <div className="flex-grow relative">
            <BlueprintEditor {...blueprintState} />
          </div>
          <div className="h-48 border-t border-gray-700">
            <OutputLog logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

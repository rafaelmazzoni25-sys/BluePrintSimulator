
import React, { useRef, useEffect } from 'react';

interface OutputLogProps {
  logs: string[];
}

export const OutputLog: React.FC<OutputLogProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-[#2A2F3A] h-full p-2 flex flex-col">
      <h2 className="text-md font-bold text-white border-b border-gray-600 pb-1 mb-1">Output Log</h2>
      <div ref={logContainerRef} className="flex-grow overflow-y-auto font-mono text-sm">
        {logs.map((log, index) => (
          <div key={index} className="text-gray-300">{`> ${log}`}</div>
        ))}
      </div>
    </div>
  );
};

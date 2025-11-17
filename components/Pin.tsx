
import React, { useRef } from 'react';
import type { Pin as PinType, NodeId, PinId } from '../types';
import { PinDirection, PinType as PinTypeEnum, DataType } from '../types';
import { PIN_SIZE, DATA_TYPE_COLORS } from '../constants';

interface PinProps {
  pin: PinType;
  onMouseDown: (e: React.MouseEvent, nodeId: string, pinId: string) => void;
  onMouseUp: (e: React.MouseEvent, nodeId: string, pinId: string) => void;
  onValueChange: (nodeId: NodeId, pinId: PinId, value: any) => void;
  isConnected: boolean;
}

const ExecutionPinIcon: React.FC = () => (
  <svg width={PIN_SIZE} height={PIN_SIZE} viewBox="0 0 24 24" fill="white" className="stroke-current stroke-1">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const DataPinIcon: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ width: PIN_SIZE, height: PIN_SIZE }} className={`rounded-full ${color}`} />
);

export const Pin: React.FC<PinProps> = ({ pin, onMouseDown, onMouseUp, onValueChange, isConnected }) => {
  const pinRef = useRef<HTMLDivElement>(null);
  
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: any = e.target.value;
    if (pin.dataType === DataType.INTEGER) value = parseInt(value, 10) || 0;
    if (pin.dataType === DataType.FLOAT) value = parseFloat(value) || 0.0;
    if (pin.dataType === DataType.BOOLEAN) value = e.target.checked;
    onValueChange(pin.nodeId, pin.id, value);
  };
  
  const renderInput = () => {
    if (isConnected || pin.type === PinTypeEnum.EXECUTION) return null;
    
    // For literal nodes
    if (pin.name === '' && pin.direction === PinDirection.INPUT) {
        if(pin.dataType === DataType.STRING) {
            return <input type="text" defaultValue={pin.value} onChange={handleValueChange} className="bg-gray-700 text-white w-24 text-xs rounded-sm p-1" />;
        }
        if(pin.dataType === DataType.INTEGER || pin.dataType === DataType.FLOAT) {
            return <input type="number" defaultValue={pin.value} onChange={handleValueChange} className="bg-gray-700 text-white w-16 text-xs rounded-sm p-1" />;
        }
        if(pin.dataType === DataType.BOOLEAN) {
            return <input type="checkbox" defaultChecked={pin.value} onChange={handleValueChange} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600" />;
        }
    }

    // For regular data inputs with default values
    if (pin.direction === PinDirection.INPUT && pin.type === PinTypeEnum.DATA) {
      if (pin.dataType === DataType.STRING) {
        return <input type="text" defaultValue={pin.value} onChange={handleValueChange} className="bg-gray-700 text-white w-20 text-xs rounded-sm p-1" />;
      }
    }

    return null;
  }

  const pinElement = (
    <div
      ref={pinRef}
      className="cursor-pointer"
      onMouseDown={(e) => onMouseDown(e, pin.nodeId, pin.id)}
      onMouseUp={(e) => onMouseUp(e, pin.nodeId, pin.id)}
    >
      {pin.type === PinTypeEnum.EXECUTION ? (
        <ExecutionPinIcon />
      ) : (
        <DataPinIcon color={DATA_TYPE_COLORS[pin.dataType]} />
      )}
    </div>
  );

  return (
    <div className="flex items-center space-x-2 h-6">
      {pin.direction === PinDirection.INPUT ? (
        <>
          {pinElement}
          <span className="text-sm text-gray-300">{pin.name}</span>
          {renderInput()}
        </>
      ) : (
        <>
          <span className="text-sm text-gray-300">{pin.name}</span>
          {pinElement}
        </>
      )}
    </div>
  );
};

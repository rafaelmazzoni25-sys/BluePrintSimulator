
import React, { useRef, useMemo } from 'react';
import type { Pin as PinType, NodeId, PinId } from '../types';
import { PinDirection, PinType as PinTypeEnum, DataType } from '../types';
import { PIN_SIZE, DATA_TYPE_COLORS } from '../constants';

interface PinProps {
  pin: PinType;
  onValueChange: (nodeId: NodeId, pinId: PinId, value: any) => void;
  isConnected: boolean;
  sourcePinForPendingConnection: PinType | null;
}

const ExecutionPinIcon: React.FC<{ isConnected: boolean }> = ({ isConnected }) => (
  <svg width={PIN_SIZE} height={PIN_SIZE} viewBox="0 0 24 24" fill={isConnected ? "white" : "transparent"} className="stroke-white stroke-2">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const DataPinIcon: React.FC<{ color: string; isConnected: boolean }> = ({ color, isConnected }) => (
  <div style={{ width: PIN_SIZE, height: PIN_SIZE }} className={`rounded-full ${color} relative`}>
    {isConnected && <div className="absolute inset-0 rounded-full ring-2 ring-white ring-inset"></div>}
  </div>
);

export const Pin: React.FC<PinProps> = ({ pin, onValueChange, isConnected, sourcePinForPendingConnection }) => {
  const pinRef = useRef<HTMLDivElement>(null);
  
  // For inputs that are connected, we don't show the default value input
  const isInputAndConnected = pin.direction === PinDirection.INPUT && isConnected;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: any = e.target.value;
    if (pin.dataType === DataType.INTEGER) value = parseInt(value, 10) || 0;
    if (pin.dataType === DataType.FLOAT) value = parseFloat(value) || 0.0;
    if (pin.dataType === DataType.BOOLEAN) value = e.target.checked;
    onValueChange(pin.nodeId, pin.id, value);
  };
  
  const renderInput = () => {
    if (isInputAndConnected || pin.type === PinTypeEnum.EXECUTION) return null;
    
    const inputProps = {
        className: "bg-gray-700 text-white text-xs rounded-sm p-1 pointer-events-auto",
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    };

    // For literal nodes
    if (pin.name === '' && pin.direction === PinDirection.INPUT) {
        if(pin.dataType === DataType.STRING) {
            return <input type="text" defaultValue={pin.value} onChange={handleValueChange} {...inputProps} className={`${inputProps.className} w-24`} />;
        }
        if(pin.dataType === DataType.INTEGER || pin.dataType === DataType.FLOAT) {
            return <input type="number" defaultValue={pin.value} onChange={handleValueChange} {...inputProps} className={`${inputProps.className} w-16`} />;
        }
        if(pin.dataType === DataType.BOOLEAN) {
            return <input type="checkbox" defaultChecked={pin.value} onChange={handleValueChange} className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 pointer-events-auto" onMouseDown={(e) => e.stopPropagation()} />;
        }
    }

    // For regular data inputs with default values
    if (pin.direction === PinDirection.INPUT && pin.type === PinTypeEnum.DATA) {
      if (pin.dataType === DataType.STRING) {
        return <input type="text" defaultValue={pin.value} onChange={handleValueChange} {...inputProps} className={`${inputProps.className} w-20`} />;
      }
       if (pin.dataType === DataType.INTEGER || pin.dataType === DataType.FLOAT) {
        return <input type="number" defaultValue={pin.value} onChange={handleValueChange} {...inputProps} className={`${inputProps.className} w-16`} />;
      }
    }

    return null;
  }

  const isSelf = sourcePinForPendingConnection?.id === pin.id;

  const isCompatible = useMemo(() => {
    const sourcePin = sourcePinForPendingConnection;
    const targetPin = pin;

    if (!sourcePin || isSelf) return false;
    if (sourcePin.nodeId === targetPin.nodeId) return false;
    if (sourcePin.direction === targetPin.direction) return false;
    if (sourcePin.type !== targetPin.type) return false;

    if (sourcePin.type === PinTypeEnum.DATA) {
      const fromType = sourcePin.direction === PinDirection.OUTPUT ? sourcePin.dataType : targetPin.dataType;
      const toType = sourcePin.direction === PinDirection.OUTPUT ? targetPin.dataType : sourcePin.dataType;
      if (fromType !== DataType.ANY && toType !== DataType.ANY && fromType !== toType) {
        return false;
      }
    }

    return true;
  }, [pin, sourcePinForPendingConnection, isSelf]);

  const interactionStyles = useMemo(() => {
    if (!sourcePinForPendingConnection) return '';
    if (isSelf) return 'opacity-50'; // Dim the source pin
    if (isCompatible) return 'ring-2 ring-yellow-400 rounded-full scale-125 transition-transform z-10';
    return 'opacity-30';
  }, [sourcePinForPendingConnection, isCompatible, isSelf]);

  const pinElement = (
    <div
      ref={pinRef}
      data-pin="true"
      data-pin-id={pin.id}
      className={`cursor-pointer transition-all ${interactionStyles}`}
    >
      {pin.type === PinTypeEnum.EXECUTION ? (
        <ExecutionPinIcon isConnected={isConnected} />
      ) : (
        <DataPinIcon color={DATA_TYPE_COLORS[pin.dataType]} isConnected={isConnected} />
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

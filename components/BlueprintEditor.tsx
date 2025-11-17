
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Node as NodeType, Connection as ConnectionType, Pin as PinType, ContextMenuState, PendingConnection, NodeId, PinId } from '../types';
import { PinDirection } from '../types';
import type { BlueprintState } from '../hooks/useBlueprintState';
import { Node } from './Node';
import { Connection } from './Connection';
import { ContextMenu } from './ContextMenu';

type BlueprintEditorProps = BlueprintState;

export const BlueprintEditor: React.FC<BlueprintEditorProps> = ({
  nodes,
  connections,
  addNode,
  updateNodePosition,
  updateNodeInputValue,
  addConnection,
  getPin,
  variables,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isOpen: false, position: { x: 0, y: 0 } });
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX - rect.left, y: e.clientY - rect.top },
    });
  }, []);

  const handleAddNode = useCallback((type: string) => {
    addNode(type, contextMenu.position);
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
  }, [addNode, contextMenu.position]);

  const handleMouseDownOnPin = useCallback((e: React.MouseEvent, nodeId: NodeId, pinId: PinId) => {
    e.stopPropagation();
    if (!editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    setPendingConnection({
      from: { nodeId, pinId },
      endPos: { x: e.clientX - rect.left, y: e.clientY - rect.top },
    });
  }, []);

  const handleMouseUpOnPin = useCallback((e: React.MouseEvent, nodeId: NodeId, pinId: PinId) => {
    e.stopPropagation();
    if (pendingConnection) {
      const fromPin = getPin(pendingConnection.from.nodeId, pendingConnection.from.pinId);
      const toPin = getPin(nodeId, pinId);
      if (fromPin && toPin) {
        addConnection(fromPin, toPin);
      }
      setPendingConnection(null);
    }
  }, [pendingConnection, getPin, addConnection]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (pendingConnection && editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      setPendingConnection(prev => prev ? {
        ...prev,
        endPos: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      } : null);
    }
  }, [pendingConnection]);

  const handleMouseUp = useCallback(() => {
    if (pendingConnection) {
      setPendingConnection(null);
    }
  }, [pendingConnection]);
  
  const closeContextMenu = useCallback(() => setContextMenu(prev => ({ ...prev, isOpen: false })), []);
  
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('mouseup', handleMouseUp);
      return () => editor.removeEventListener('mouseup', handleMouseUp);
    }
  }, [handleMouseUp]);

  return (
    <div
      ref={editorRef}
      className="w-full h-full bg-[#2A2F3A] overflow-hidden relative"
      onContextMenu={handleContextMenu}
      onMouseMove={handleMouseMove}
      onClick={closeContextMenu}
    >
      <svg className="absolute w-full h-full pointer-events-none">
        {connections.map((conn) => (
          <Connection key={conn.id} connection={conn} nodes={nodes} />
        ))}
        {pendingConnection && (
          <Connection connection={pendingConnection} nodes={nodes} isPending={true} />
        )}
      </svg>

      {nodes.map((node) => (
        <Node
          key={node.id}
          node={node}
          onMove={updateNodePosition}
          onInputValueChange={updateNodeInputValue}
          onPinMouseDown={handleMouseDownOnPin}
          onPinMouseUp={handleMouseUpOnPin}
          connections={connections}
        />
      ))}

      {contextMenu.isOpen && (
        <ContextMenu
          position={contextMenu.position}
          onSelect={handleAddNode}
          variables={variables}
        />
      )}
    </div>
  );
};

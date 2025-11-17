import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Node as NodeType, Connection as ConnectionType, Pin as PinDataType, ContextMenuState, PendingConnection, NodeId } from '../types';
import type { BlueprintState } from '../hooks/useBlueprintState';
import { Node } from './Node';
import { Connection } from './Connection';
import { ContextMenu } from './ContextMenu';

type BlueprintEditorProps = BlueprintState;

type Interaction =
  | { type: 'move'; nodeId: NodeId }
  | { type: 'resize'; nodeId: NodeId; startX: number; startY: number; startWidth: number; startHeight: number; };

export const BlueprintEditor: React.FC<BlueprintEditorProps> = ({
  nodes,
  connections,
  addNode,
  removeNode,
  updateNodePosition,
  updateNodeInputValue,
  updateNodeDetails,
  addConnection,
  getPin,
  variables,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<Interaction | null>(null);
  
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isOpen: false, position: { x: 0, y: 0 } });
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);

  const sourcePinForPendingConnection = useMemo(() => {
    if (!pendingConnection) return null;
    return getPin(pendingConnection.from.nodeId, pendingConnection.from.pinId);
  }, [pendingConnection, getPin]);

  const closeContextMenu = useCallback(() => setContextMenu(prev => ({ ...prev, isOpen: false })), []);

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
    closeContextMenu();
  }, [addNode, contextMenu.position, closeContextMenu]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Start a new connection from a pin
    const pinElement = target.closest('[data-pin="true"]');
    if (pinElement) {
        e.stopPropagation();
        const nodeId = pinElement.closest('[data-node-id]')?.getAttribute('data-node-id');
        const pinId = pinElement.getAttribute('data-pin-id');
        if (nodeId && pinId && editorRef.current) {
            const rect = editorRef.current.getBoundingClientRect();
            setPendingConnection({
                from: { nodeId, pinId },
                endPos: { x: e.clientX - rect.left, y: e.clientY - rect.top },
            });
        }
        return;
    }

    // Handle interactions with nodes (drag, resize, select)
    const nodeElement = target.closest('[data-node-id]');
    if (nodeElement) {
        e.stopPropagation();
        const nodeId = nodeElement.getAttribute('data-node-id')!;
        setSelectedNodeId(nodeId);

        if (target.closest('[data-resize-handle="true"]')) {
             const node = nodes.find(n => n.id === nodeId);
             if (node) {
                interactionRef.current = {
                    type: 'resize',
                    nodeId,
                    startX: e.pageX,
                    startY: e.pageY,
                    startWidth: node.width || 300,
                    startHeight: node.height || 100,
                };
             }
        } else if (target.closest('[data-drag-handle="true"]')) {
            interactionRef.current = { type: 'move', nodeId };
        }
        return;
    }

    // Clicked on the background
    setSelectedNodeId(null);
    closeContextMenu();
  }, [closeContextMenu, nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle node moving or resizing
    if (interactionRef.current) {
        const interaction = interactionRef.current;
        if (interaction.type === 'move') {
            updateNodePosition(interaction.nodeId, { x: e.movementX, y: e.movementY });
        } else if (interaction.type === 'resize') {
            const newWidth = interaction.startWidth + (e.pageX - interaction.startX);
            const newHeight = interaction.startHeight + (e.pageY - interaction.startY);
            updateNodeDetails(interaction.nodeId, {
                width: Math.max(150, newWidth),
                height: Math.max(80, newHeight)
            });
        }
    } 
    // Handle pending connection wire dragging
    else if (pendingConnection && editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect();
        setPendingConnection(prev => prev ? {
            ...prev,
            endPos: { x: e.clientX - rect.left, y: e.clientY - rect.top },
        } : null);
    }
  }, [pendingConnection, updateNodePosition, updateNodeDetails]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Attempt to complete a connection
    if (pendingConnection) {
        const target = e.target as HTMLElement;
        const pinElement = target.closest('[data-pin="true"]');
        if (pinElement) {
            const nodeId = pinElement.closest('[data-node-id]')?.getAttribute('data-node-id');
            const pinId = pinElement.getAttribute('data-pin-id');
            if (nodeId && pinId) {
                const fromPin = getPin(pendingConnection.from.nodeId, pendingConnection.from.pinId);
                const toPin = getPin(nodeId, pinId);
                if (fromPin && toPin) {
                    addConnection(fromPin, toPin);
                }
            }
        }
    }

    // Reset interaction states
    interactionRef.current = null;
    setPendingConnection(null);
  }, [pendingConnection, getPin, addConnection]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNodeId) {
        removeNode(selectedNodeId);
        setSelectedNodeId(null);
      }
    };
    
    const editorEl = editorRef.current;
    if (editorEl) {
      editorEl.focus();
      editorEl.addEventListener('keydown', handleKeyDown);
      return () => editorEl.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedNodeId, removeNode]);

  return (
    <div
      ref={editorRef}
      className="w-full h-full bg-[#2A2F3A] overflow-hidden relative focus:outline-none"
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      tabIndex={0}
    >
      <svg className="absolute w-full h-full pointer-events-none">
        <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#353A47" strokeWidth="0.5"/>
            </pattern>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <rect width="100" height="100" fill="url(#smallGrid)"/>
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#3F4656" strokeWidth="1"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
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
          onInputValueChange={updateNodeInputValue}
          onUpdateDetails={updateNodeDetails}
          connections={connections}
          sourcePinForPendingConnection={sourcePinForPendingConnection}
          isSelected={node.id === selectedNodeId}
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
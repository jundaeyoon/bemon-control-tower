import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CenterNode from './nodes/CenterNode';
import BranchNode from './nodes/BranchNode';
import SidePanel from './SidePanel';
import styles from './MindMapCanvas.module.css';

const nodeTypes = { center: CenterNode, branch: BranchNode };

const TRANSPARENT = { background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' };

const BRANCHES = [
  { id: 'projects',   label: '프로젝트',    icon: '📂', color: '#E8896A', edgeColor: '#E8896A', pos: { x: 55,  y: 0   }, handle: Position.Right },
  { id: 'schedule',   label: '스케줄',      icon: '📅', color: '#4A3728', edgeColor: '#6B7C45', pos: { x: 575, y: 0   }, handle: Position.Left  },
  { id: 'brainstorm', label: '브레인스토밍', icon: '💡', color: '#6B7C45', edgeColor: '#6B7C45', pos: { x: 55,  y: 372 }, handle: Position.Right },
  { id: 'goals',      label: '목표',        icon: '🎯', color: '#E8896A', edgeColor: '#E8896A', pos: { x: 575, y: 372 }, handle: Position.Left  },
];

// 중앙 허브: y=142 → 노드 중심 y=217 = 브랜치 상하 중심 (0+31+372+31)/2 = 217
const initialNodes = [
  {
    id: 'center',
    type: 'center',
    position: { x: 326, y: 142 },
    width: 150,
    height: 150,
    data: {},
    draggable: false,
    selectable: false,
    style: TRANSPARENT,
  },
  ...BRANCHES.map(b => ({
    id: b.id,
    type: 'branch',
    position: b.pos,
    width: 172,
    height: 62,
    data: { label: b.label, icon: b.icon, color: b.color, handlePosition: b.handle },
    draggable: false,
    style: TRANSPARENT,
  })),
];

const initialEdges = BRANCHES.map(b => ({
  id: `e-${b.id}`,
  source: 'center',
  target: b.id,
  type: 'default',
  style: { stroke: b.edgeColor, strokeWidth: 2, opacity: 0.85 },
}));

export default function MindMapCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [activePanel, setActivePanel] = useState(null);

  const onNodeClick = useCallback((_e, node) => {
    if (node.type === 'branch') {
      setActivePanel(prev => (prev === node.id ? null : node.id));
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setActivePanel(null);
  }, []);

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes.map(n =>
          n.type === 'branch'
            ? { ...n, selected: n.id === activePanel }
            : n
        )}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.22, includeHiddenNodes: false }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        preventScrolling={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" color="#e0d8d0" gap={22} size={1.4} />
      </ReactFlow>
      <SidePanel activePanel={activePanel} onClose={() => setActivePanel(null)} />
    </div>
  );
}

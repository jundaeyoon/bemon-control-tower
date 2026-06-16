import { useCallback, useState, useMemo, useEffect } from 'react';
import { ReactFlow, Background, BackgroundVariant, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { INITIAL_NODES, INITIAL_EDGES } from './mindmapConfig';
import HubNode     from './nodes/HubNode';
import BranchNode  from './nodes/BranchNode';
import ProjectNode, { PROJECT_W, PROJECT_H } from './nodes/ProjectNode';
import TaskNode,    { TASK_W,    TASK_H    } from './nodes/TaskNode';
import RoughEdge   from './edges/RoughEdge';
import NodePanel   from './NodePanel';
import TaskDetailPanel  from '../panels/TaskDetailPanel';
import AddProjectModal  from '../modals/AddProjectModal';
import EditProjectModal from '../modals/EditProjectModal';
import AddTaskModal        from '../modals/AddTaskModal';
import MemberTasksModal   from '../modals/MemberTasksModal';
import { MindmapActionsContext } from '../../contexts/MindmapActionsContext';
import { useProjects }           from '../../hooks/useProjects';
import styles from './MindmapCanvas.module.css';

const NODE_TYPES = { hub: HubNode, branch: BranchNode, project: ProjectNode, task: TaskNode };
const EDGE_TYPES = { rough: RoughEdge };

// Zigzag tree layout — X positions
const PROJ_BRANCH_X   = -320;   // projects branch node left-edge X (fixed)
const PROJ_X          = -530;   // project node left-edge X
// Task X per project: odd(1,3,5→i=0,2,4) → PROJ_X-440, even(2,4,6→i=1,3,5) → PROJ_X-640
// Minimum offset = TASK_W(255) + addBtn left(-32) + 150px gap = 437 → using 440/640
const BRANCH_H        = 84;     // BranchNode height

// Zigzag tree layout — vertical sizing
const PROJ_BLOCK_MIN  = 150;    // minimum block height per project (150px spacing)
const TASK_BLOCK_STEP = 80;     // vertical space per task
const PROJ_GAP        = 20;     // gap between adjacent project blocks

// Triggers fitView only when hub/branch level changes (not project/task expansion)
function FitViewController({ fitKey }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.35, maxZoom: 0.75, duration: 500 }), 300);
    return () => clearTimeout(t);
  }, [fitKey, fitView]);
  return null;
}

export default function MindmapCanvas({ selectedMember = null, onCloseSelectedMember }) {
  const [expandedSet,   setExpandedSet]   = useState(new Set());
  const [activePanel,   setActivePanel]   = useState(null);
  const [activeTask,    setActiveTask]    = useState(null);
  const [showAddProj,  setShowAddProj]  = useState(false);
  const [showEditProj, setShowEditProj] = useState(null); // { projectId, name, pm }
  const [showAddTask,  setShowAddTask]  = useState(null); // { projectId, projectName }

  const { projects, addProject, updateProject, addTask, updateTask, updateTaskMemo, toggleTask, deleteProject, deleteTask, addTaskImage, removeTaskImage } = useProjects();

  // fitView key: changes whenever the project layout shape changes
  const fitKey = useMemo(() => {
    const hubE  = expandedSet.has('hub');
    const projE = expandedSet.has('projects');
    if (!hubE || !projE || projects.length === 0) return `${hubE}-${projE}`;
    const layoutStr = projects.map((p, i) =>
      `${i}:${expandedSet.has(p.id) ? p.tasks.length : 0}`
    ).join(',');
    return `${hubE}-${projE}-${layoutStr}`;
  }, [expandedSet, projects]);

  const toggleNode = useCallback((id) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((_ev, node) => {
    if (node.type === 'hub')     return toggleNode('hub');
    if (node.type === 'branch')  return node.id === 'projects' ? toggleNode('projects') : setActivePanel(node.id);
    if (node.type === 'project') return toggleNode(node.id);
    if (node.type === 'task')    return setActiveTask({ taskId: node.id, projectId: node.data.projectId });
  }, [toggleNode]);

  const handleDeleteProject = useCallback((projectId) => {
    deleteProject(projectId);
    setExpandedSet(prev => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
    setActiveTask(prev => (prev?.projectId === projectId ? null : prev));
  }, [deleteProject]);

  const handleEditProject = useCallback((projectId) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    setShowEditProj({ projectId, name: proj.name, pm: proj.pm ?? null });
  }, [projects]);

  const handleSaveEditProject = useCallback(({ name, pm }) => {
    if (!showEditProj) return;
    updateProject(showEditProj.projectId, { name, pm });
    setShowEditProj(null);
  }, [updateProject, showEditProj]);

  // Context value
  const ctxValue = useMemo(() => ({
    onRequestAddProject: () => setShowAddProj(true),
    onRequestAddTask:    (projectId) => {
      const proj = projects.find(p => p.id === projectId);
      setShowAddTask({ projectId, projectName: proj?.name ?? '' });
    },
    onToggleTask:    toggleTask,
    onDeleteProject: handleDeleteProject,
    onEditProject:   handleEditProject,
  }), [projects, toggleTask, handleDeleteProject, handleEditProject]);

  // Build dynamic nodes — X-Mind style tree layout (guaranteed no overlap)
  const allNodes = useMemo(() => {
    const hubExpanded      = expandedSet.has('hub');
    const projectsExpanded = expandedSet.has('projects');
    const result = [];

    // STEP 1 — block height for each project (includes its expanded tasks)
    const blockHeights = projects.map(proj =>
      (expandedSet.has(proj.id) && proj.tasks.length > 0)
        ? proj.tasks.length * TASK_BLOCK_STEP
        : PROJ_BLOCK_MIN
    );

    // STEP 2 — total vertical span of the layout
    const gapTotal    = projects.length > 1 ? (projects.length - 1) * PROJ_GAP : 0;
    const totalHeight = blockHeights.reduce((s, h) => s + h, 0) + gapTotal;

    // STEP 3 — center Y of each project block, layout anchored at Y=0
    const projCenters = [];
    let runY = -(totalHeight / 2);
    blockHeights.forEach(h => {
      projCenters.push(runY + h / 2);
      runY += h + PROJ_GAP;
    });

    // STEP 6 — sibling branch Ys (only when projects are visible)
    let dynBranchY     = null;
    let dynScheduleY   = null;
    let dynBrainstormY = null;
    let dynGoalsY      = null;

    if (hubExpanded && projectsExpanded && projects.length > 0) {
      const startY   = -(totalHeight / 2);
      const endY     = startY + totalHeight;
      dynBranchY     = -BRANCH_H / 2;                  // projects branch centered at Y=0
      dynScheduleY   = Math.min(-200, startY - 120);
      dynBrainstormY = Math.max(200,  endY   + 120);
      dynGoalsY      = dynBrainstormY + 160;
    }

    // Hub + 4 branch nodes
    INITIAL_NODES.forEach(n => {
      const hidden     = n.data.parentId ? !hubExpanded : false;
      const isExpanded = expandedSet.has(n.id);
      let overridePos  = null;
      if (n.id === 'projects'   && dynBranchY     !== null) overridePos = { x: PROJ_BRANCH_X, y: dynBranchY };
      if (n.id === 'schedule'   && dynScheduleY   !== null) overridePos = { ...n.position, y: dynScheduleY };
      if (n.id === 'brainstorm' && dynBrainstormY !== null) overridePos = { ...n.position, y: dynBrainstormY };
      if (n.id === 'goals'      && dynGoalsY      !== null) overridePos = { ...n.position, y: dynGoalsY };
      result.push({
        ...n,
        position: overridePos ?? n.position,
        hidden,
        data: { ...n.data, isExpanded, showAdd: n.id === 'projects' },
      });
    });

    // STEP 3+4 — project nodes and their tasks
    if (hubExpanded && projectsExpanded && projects.length > 0) {
      projects.forEach((proj, i) => {
        const cy = projCenters[i];

        result.push({
          id:   proj.id,
          type: 'project',
          position: { x: PROJ_X, y: cy - PROJECT_H / 2 },
          data: { ...proj, id: proj.id, parentId: 'projects', isExpanded: expandedSet.has(proj.id), side: 'left' },
          width:  PROJECT_W,
          height: PROJECT_H,
          hidden: false,
        });

        // STEP 4 — tasks spaced 80px apart, centered around project Y, zigzag X
        if (expandedSet.has(proj.id) && proj.tasks.length > 0) {
          // Odd projects (1,3,5… → i=0,2,4): 440px offset; even (2,4,6… → i=1,3,5): 640px offset
          const taskX     = (i % 2 === 0) ? PROJ_X - 440 : PROJ_X - 640;
          const taskCount = proj.tasks.length;
          proj.tasks.forEach((task, j) => {
            const taskCY = cy - ((taskCount - 1) * TASK_BLOCK_STEP / 2) + j * TASK_BLOCK_STEP;
            result.push({
              id:   task.id,
              type: 'task',
              position: { x: taskX, y: taskCY - TASK_H / 2 },
              data: { ...task, id: task.id, projectId: proj.id },
              width:  TASK_W,
              height: TASK_H,
              hidden: false,
            });
          });
        }
      });
    }

    return result;
  }, [expandedSet, projects]);

  // Build dynamic edges
  const allEdges = useMemo(() => {
    const hubExpanded      = expandedSet.has('hub');
    const projectsExpanded = expandedSet.has('projects');
    const result = [];

    INITIAL_EDGES.forEach(e => {
      const targetNode     = INITIAL_NODES.find(n => n.id === e.target);
      const targetParentId = targetNode?.data?.parentId;
      result.push({ ...e, hidden: targetParentId ? !hubExpanded : false });
    });

    if (hubExpanded && projectsExpanded) {
      projects.forEach((proj, i) => {
        result.push({
          id: `e-projects-${proj.id}`,
          source: 'projects',
          target:  proj.id,
          type:   'rough',
          data:   { color: '#C06850', seed: i + 10 },
        });
        if (expandedSet.has(proj.id)) {
          proj.tasks.forEach((task, j) => {
            result.push({
              id:     `e-${proj.id}-${task.id}`,
              source:  proj.id,
              target:  task.id,
              type:   'rough',
              data:   { color: 'rgba(192,104,80,0.55)', seed: j + 30 },
            });
          });
        }
      });
    }

    return result;
  }, [expandedSet, projects]);

  const handleAddProject = useCallback(({ name, pm }) => {
    addProject(name, pm);
    setExpandedSet(prev => new Set([...prev, 'hub', 'projects']));
    setShowAddProj(false);
  }, [addProject]);

  const handleAddTask = useCallback(({ projectId, fields }) => {
    addTask(projectId, fields);
    setExpandedSet(prev => new Set([...prev, 'hub', 'projects', projectId]));
    setShowAddTask(null);
  }, [addTask]);

  return (
    <MindmapActionsContext.Provider value={ctxValue}>
      <div className={styles.wrap} onWheel={e => e.preventDefault()}>
        <ReactFlow
          nodes={allNodes}
          edges={allEdges}
          onNodeClick={handleNodeClick}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.28, maxZoom: 1.0 }}
          minZoom={0.2}
          maxZoom={2.5}
          zoomOnScroll
          zoomOnPinch
          panOnScroll={false}
          panOnDrag
          preventScrolling
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <FitViewController fitKey={fitKey} />
          <Background
            variant={BackgroundVariant.Dots}
            gap={28}
            size={1.2}
            color="rgba(26,26,26,0.06)"
          />
        </ReactFlow>

        {activePanel && (
          <NodePanel nodeId={activePanel} onClose={() => setActivePanel(null)} />
        )}

        {activeTask && (
          <TaskDetailPanel
            taskId={activeTask.taskId}
            projectId={activeTask.projectId}
            projects={projects}
            onUpdateTask={updateTask}
            onUpdateTaskMemo={updateTaskMemo}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
            onAddTaskImage={addTaskImage}
            onRemoveTaskImage={removeTaskImage}
            onClose={() => setActiveTask(null)}
          />
        )}

        {showAddProj && (
          <AddProjectModal
            onAdd={handleAddProject}
            onClose={() => setShowAddProj(false)}
          />
        )}

        {showEditProj && (
          <EditProjectModal
            initialName={showEditProj.name}
            initialPm={showEditProj.pm}
            onSave={handleSaveEditProject}
            onClose={() => setShowEditProj(null)}
          />
        )}

        {showAddTask && (
          <AddTaskModal
            projectName={showAddTask.projectName}
            onAdd={(fields) => handleAddTask({ projectId: showAddTask.projectId, fields })}
            onClose={() => setShowAddTask(null)}
          />
        )}

        {selectedMember && (
          <MemberTasksModal
            member={selectedMember}
            projects={projects}
            onClose={onCloseSelectedMember}
          />
        )}

        <p className={styles.hint}>BEMON 허브를 클릭하면 메뉴가 펼쳐집니다</p>
      </div>
    </MindmapActionsContext.Provider>
  );
}

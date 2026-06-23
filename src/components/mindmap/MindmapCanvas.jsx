import { useCallback, useState, useMemo, useEffect } from 'react';
import { ReactFlow, Background, BackgroundVariant, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { INITIAL_NODES, INITIAL_EDGES } from './mindmapConfig';
import HubNode     from './nodes/HubNode';
import BranchNode  from './nodes/BranchNode';
import ProjectNode, { PROJECT_W, PROJECT_H } from './nodes/ProjectNode';
import TaskNode,    { TASK_W,    TASK_H    } from './nodes/TaskNode';
import SessionNode, { SESSION_W, SESSION_H } from './nodes/SessionNode';
import QuestNode,   { QUEST_W,   QUEST_H   } from './nodes/QuestNode';
import CompassNode,      { COMPASS_W, COMPASS_H } from './nodes/CompassNode';
import RoughEdge   from './edges/RoughEdge';
import NodePanel   from './NodePanel';
import TaskDetailPanel       from '../panels/TaskDetailPanel';
import BrainstormSlidePanel  from '../panels/BrainstormSlidePanel';
import QuestSlidePanel       from '../panels/QuestSlidePanel';
import VisionHousePanel      from '../panels/VisionHousePanel';
import CalendarPanel         from '../panels/CalendarPanel';
import AddProjectModal  from '../modals/AddProjectModal';
import EditProjectModal from '../modals/EditProjectModal';
import AddTaskModal        from '../modals/AddTaskModal';
import AddSessionModal     from '../modals/AddSessionModal';
import MemberTasksModal   from '../modals/MemberTasksModal';
import FeedbackModal          from '../modals/FeedbackModal';
import BemonDashboardPopup    from '../modals/BemonDashboardPopup';
import CompletedPanel     from '../panels/CompletedPanel';
import ThankYouPanel      from '../panels/ThankYouPanel';
import IdeaBankPanel      from '../panels/IdeaBankPanel';
import { MindmapActionsContext } from '../../contexts/MindmapActionsContext';
import { useProjects }           from '../../hooks/useProjects';
import { useBrainstorm }         from '../../hooks/useBrainstorm';
import { useGoals }              from '../../hooks/useGoals';
import { useVisionHouse }        from '../../hooks/useVisionHouse';
import { useSchedule }          from '../../hooks/useSchedule';
import { useThankYou }          from '../../hooks/useThankYou';
import { useIdeaBank }          from '../../hooks/useIdeaBank';
import styles from './MindmapCanvas.module.css';

const NODE_TYPES = { hub: HubNode, branch: BranchNode, project: ProjectNode, task: TaskNode, session: SessionNode, quest: QuestNode, compass: CompassNode };
const EDGE_TYPES = { rough: RoughEdge };

// Zigzag tree layout — X positions
const PROJ_BRANCH_X   = -250;   // projects branch node left-edge X (fixed)
const PROJ_X          = -500;   // project node left-edge X
// Task X per project: odd(1,3,5→i=0,2,4) → PROJ_X-300, even(2,4,6→i=1,3,5) → PROJ_X-500
const BRANCH_H        = 84;     // BranchNode height

// Zigzag tree layout — vertical sizing
const PROJ_BLOCK_MIN  = 150;    // minimum block height per project (150px spacing)
const TASK_BLOCK_STEP = 80;     // vertical space per task
const PROJ_GAP        = 20;     // gap between adjacent project blocks

// Brainstorm sessions — vertical stack below the brainstorm branch
const SESSION_GAP_TOP = 50;     // gap from branch bottom to first session
const SESSION_STEP    = 75;     // vertical spacing between sessions

// Quest nodes — vertical stack below the goals branch (same pattern as sessions)
const QUEST_GAP_TOP   = 50;
const QUEST_STEP      = 80;

// Compass child nodes — tree layout (3 levels: mission / team+vision / jun+cap+val)
const COMPASS_LEVEL_TOP = 40;   // branch bottom → mission top
const COMPASS_LEVEL_GAP = 30;   // vertical gap between tree levels
// From branch bottom to deepest nodes (3 levels):
// COMPASS_LEVEL_TOP + COMPASS_H + COMPASS_LEVEL_GAP + COMPASS_H + COMPASS_LEVEL_GAP + COMPASS_H = 274
const COMPASS_SUBTREE = COMPASS_LEVEL_TOP + COMPASS_H * 3 + COMPASS_LEVEL_GAP * 2;

// Triggers fitView only when hub/branch level changes (not project/task expansion)
function FitViewController({ fitKey }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.40, maxZoom: 0.75, duration: 500 }), 300);
    return () => clearTimeout(t);
  }, [fitKey, fitView]);
  return null;
}

export default function MindmapCanvas({ selectedMember = null, onCloseSelectedMember }) {
  const [expandedSet,    setExpandedSet]    = useState(new Set());
  const [activePanel,    setActivePanel]    = useState(null);
  const [activeTask,     setActiveTask]     = useState(null);
  const [activeSession,  setActiveSession]  = useState(null); // sessionId
  const [showAddProj,    setShowAddProj]    = useState(false);
  const [showEditProj,   setShowEditProj]   = useState(null); // { projectId, name, pm }
  const [showAddTask,    setShowAddTask]    = useState(null); // { projectId, projectName }
  const [showAddSession, setShowAddSession] = useState(false);
  const [activeQuest,    setActiveQuest]    = useState(null); // null | yearMonth string
  const [activeCompass,  setActiveCompass]  = useState(null); // null | kind string
  const [activeSchedule,  setActiveSchedule]  = useState(false);
  const [activeFeedback,  setActiveFeedback]  = useState(null); // null | { projectId, projectName }
  const [activeCompleted, setActiveCompleted] = useState(false);
  const [feedbackVersion, setFeedbackVersion] = useState(0);
  const [activeThankyou,  setActiveThankyou]  = useState(false);
  const [showDashboard,   setShowDashboard]   = useState(false);
  const [activeIdeaBank,  setActiveIdeaBank]  = useState(false);

  const { projects, addProject, updateProject, archiveProject, addTask, updateTask, updateTaskMemo, toggleTask, deleteProject, deleteTask, addTaskImage, removeTaskImage } = useProjects();
  const brainstorm = useBrainstorm();
  const goalsHook  = useGoals();
  const { deleteGoal } = goalsHook;
  const vhHook     = useVisionHouse();
  const schedHook  = useSchedule();
  const thankHook    = useThankYou();
  const ideaBankHook = useIdeaBank();

  // fitView key: changes whenever the project/brainstorm/goals layout shape changes
  const fitKey = useMemo(() => {
    const hubE     = expandedSet.has('hub');
    const projE    = expandedSet.has('projects');
    const brainE   = expandedSet.has('brainstorm');
    const goalsE   = expandedSet.has('goals');
    const compassE = expandedSet.has('compass');
    const activeProjs   = projects.filter(p => !p.archived);
    const projLayout    = (!hubE || !projE || activeProjs.length === 0)
      ? ''
      : activeProjs.map((p, i) => `${i}:${expandedSet.has(p.id) ? p.tasks.length : 0}`).join(',');
    const brainLayout   = (!hubE || !brainE)   ? '' : brainstorm.sessions.length;
    const goalsLayout   = (!hubE || !goalsE)   ? '' : goalsHook.goals.filter(g => g.quest?.trim()).length;
    const compassLayout = (!hubE || !compassE) ? '' : 'open';
    return `${hubE}-${projE}-${projLayout}-${brainE}-${brainLayout}-${goalsE}-${goalsLayout}-${compassE}-${compassLayout}`;
  }, [expandedSet, projects, brainstorm.sessions, goalsHook.goals]);

  const toggleNode = useCallback((id) => {
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((_ev, node) => {
    if (node.type === 'hub') {
      toggleNode('hub');
      setShowDashboard(true);
      return;
    }
    if (node.type === 'branch') {
      if (node.id === 'projects')   return toggleNode('projects');
      if (node.id === 'brainstorm') return toggleNode('brainstorm');
      if (node.id === 'goals')      return toggleNode('goals');
      if (node.id === 'compass')    return toggleNode('compass');
      if (node.id === 'completed')  return setActiveCompleted(true);
      if (node.id === 'schedule')   return setActiveSchedule(true);
      if (node.id === 'thankyou')   return setActiveThankyou(true);
      if (node.id === 'ideabank')   return setActiveIdeaBank(true);
      return setActivePanel(node.id);
    }
    if (node.type === 'project') {
      if (!node.data.archived) return toggleNode(node.id);
      return;
    }
    if (node.type === 'task')    return setActiveTask({ taskId: node.id, projectId: node.data.projectId });
    if (node.type === 'session') return setActiveSession(node.id);
    if (node.type === 'quest')   return setActiveQuest(node.data.yearMonth);
    if (node.type === 'compass') return setActiveCompass(node.data.kind);
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
    setShowEditProj({ projectId, name: proj.name, pm: proj.pm ?? null, description: proj.description ?? '' });
  }, [projects]);

  const handleSaveEditProject = useCallback(({ name, pm, description }) => {
    if (!showEditProj) return;
    updateProject(showEditProj.projectId, { name, pm, description });
    setShowEditProj(null);
  }, [updateProject, showEditProj]);

  const handleDeleteSession = useCallback((sessionId) => {
    brainstorm.deleteSession(sessionId);
    setActiveSession(prev => (prev === sessionId ? null : prev));
  }, [brainstorm]);

  const handleDeleteQuest = useCallback((yearMonth) => {
    deleteGoal(yearMonth);
    setActiveQuest(prev => (prev === yearMonth ? null : prev));
  }, [deleteGoal]);

  const handleArchiveProject = useCallback((projectId) => {
    archiveProject(projectId);
    setExpandedSet(prev => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
    setActiveTask(prev => (prev?.projectId === projectId ? null : prev));
  }, [archiveProject]);

  // Context value
  const ctxValue = useMemo(() => ({
    onRequestAddProject: () => setShowAddProj(true),
    onRequestAddTask:    (projectId) => {
      const proj = projects.find(p => p.id === projectId);
      setShowAddTask({ projectId, projectName: proj?.name ?? '' });
    },
    onToggleTask:       toggleTask,
    onDeleteProject:    handleDeleteProject,
    onEditProject:      handleEditProject,
    onRequestAddSession: () => setShowAddSession(true),
    onDeleteSession:     handleDeleteSession,
    onRequestOpenQuest:  () => {
      const d = new Date();
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      setActiveQuest(ym);
    },
    onRequestOpenCompass: () => setActiveCompass('mission'),
    onRequestFeedback:   (projectId, projectName) => setActiveFeedback({ projectId, projectName }),
    onDeleteQuest:       handleDeleteQuest,
    onArchiveProject:    handleArchiveProject,
  }), [projects, toggleTask, handleDeleteProject, handleEditProject, handleDeleteSession, handleDeleteQuest, handleArchiveProject]);

  // Build dynamic nodes — X-Mind style tree layout (guaranteed no overlap)
  const allNodes = useMemo(() => {
    const hubExpanded        = expandedSet.has('hub');
    const projectsExpanded   = expandedSet.has('projects');
    const brainstormExpanded = expandedSet.has('brainstorm');
    const result = [];

    const activeProjects = projects.filter(p => !p.archived);

    const _td = new Date();
    const _todayStr = `${_td.getFullYear()}-${String(_td.getMonth()+1).padStart(2,'0')}-${String(_td.getDate()).padStart(2,'0')}`;
    const badgeCount =
      projects.flatMap(p => p.tasks ?? []).filter(t => t.deadline === _todayStr && !t.completed).length +
      thankHook.thanks.filter(t => t.created_at?.startsWith(_todayStr)).length;

    // STEP 1 — block height for each project (includes its expanded tasks)
    const blockHeights = activeProjects.map(proj =>
      (expandedSet.has(proj.id) && proj.tasks.length > 0)
        ? proj.tasks.length * TASK_BLOCK_STEP
        : PROJ_BLOCK_MIN
    );

    // STEP 2 — total vertical span of the layout
    const gapTotal    = activeProjects.length > 1 ? (activeProjects.length - 1) * PROJ_GAP : 0;
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
    let dynCompassY    = null;
    let dynGoalsY      = null;
    let dynCompletedY  = null;
    let dynThankYouY   = null;

    const compassExpanded = expandedSet.has('compass');

    if (hubExpanded && projectsExpanded && activeProjects.length > 0) {
      const startY   = -(totalHeight / 2);
      const endY     = startY + totalHeight;
      dynBranchY     = -BRANCH_H / 2;                  // projects branch centered at Y=0
      dynScheduleY   = Math.min(-200, startY - 120);
      dynBrainstormY = Math.max(200,  endY   + 120);
      dynCompassY    = dynScheduleY + 230;
      dynCompletedY  = startY - BRANCH_H - 100;
      const brainstormBottom = brainstormExpanded && brainstorm.sessions.length > 0
        ? dynBrainstormY + BRANCH_H + SESSION_GAP_TOP + brainstorm.sessions.length * SESSION_STEP
        : dynBrainstormY + BRANCH_H;
      dynGoalsY    = brainstormBottom + 80;
    }

    if (hubExpanded && dynCompletedY === null) {
      dynCompletedY = -250;
    }
    if (hubExpanded && dynGoalsY === null) {
      const bSessions = expandedSet.has('brainstorm') ? brainstorm.sessions.length : 0;
      const bBottom   = 71 + BRANCH_H + (bSessions > 0 ? SESSION_GAP_TOP + bSessions * SESSION_STEP : 0);
      dynGoalsY = Math.max(300, bBottom + 80);
    }
    const IDEABANK_Y = 130; // ideabank fixed position — thankyou must stay below it
    if (hubExpanded) {
      const effectiveCompassY = dynCompassY ?? -80;
      const compassCalc = compassExpanded
        ? effectiveCompassY + BRANCH_H + COMPASS_SUBTREE + 150
        : effectiveCompassY + BRANCH_H + 200;
      dynThankYouY = Math.max(compassCalc, IDEABANK_Y + BRANCH_H + 80);
    }

    // Hub + 4 branch nodes
    INITIAL_NODES.forEach(n => {
      const hidden     = n.data.parentId ? !hubExpanded : false;
      const isExpanded = expandedSet.has(n.id);
      let overridePos  = null;
      if (n.id === 'projects'   && dynBranchY     !== null) overridePos = { x: PROJ_BRANCH_X, y: dynBranchY };
      if (n.id === 'schedule'   && dynScheduleY   !== null) overridePos = { ...n.position, y: dynScheduleY };
      if (n.id === 'brainstorm' && dynBrainstormY !== null) overridePos = { ...n.position, y: dynBrainstormY };
      if (n.id === 'compass'    && dynCompassY    !== null) overridePos = { ...n.position, y: dynCompassY };
      if (n.id === 'goals'      && dynGoalsY      !== null) overridePos = { ...n.position, y: dynGoalsY };
      if (n.id === 'completed'  && dynCompletedY  !== null) overridePos = { x: PROJ_BRANCH_X, y: dynCompletedY };
      if (n.id === 'thankyou'   && dynThankYouY   !== null) overridePos = { ...n.position, y: dynThankYouY };
      result.push({
        ...n,
        position: overridePos ?? n.position,
        hidden,
        data: {
          ...n.data,
          isExpanded,
          addAction: n.id === 'projects'   ? 'project' :
                     n.id === 'brainstorm' ? 'session'  :
                     n.id === 'goals'      ? 'quest'    :
                     n.id === 'compass'    ? 'compass'  : null,
          ...(n.id === 'hub' ? { badgeCount } : {}),
        },
      });
    });

    // STEP 3+4 — active project nodes and their tasks
    if (hubExpanded && projectsExpanded && activeProjects.length > 0) {
      activeProjects.forEach((proj, i) => {
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
          // Odd projects (1,3,5… → i=0,2,4): 300px offset; even (2,4,6… → i=1,3,5): 500px offset
          const taskX     = (i % 2 === 0) ? PROJ_X - 300 : PROJ_X - 500;
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

    // Brainstorm sessions — vertical stack below the brainstorm branch
    if (hubExpanded && brainstormExpanded && brainstorm.sessions.length > 0) {
      const brainstormNode = result.find(n => n.id === 'brainstorm');
      const baseX = brainstormNode.position.x;
      const baseY = brainstormNode.position.y;
      brainstorm.sessions.forEach((session, i) => {
        result.push({
          id:   session.id,
          type: 'session',
          position: { x: baseX, y: baseY + BRANCH_H + SESSION_GAP_TOP + i * SESSION_STEP },
          data: { ...session, id: session.id },
          width:  SESSION_W,
          height: SESSION_H,
          hidden: false,
        });
      });
    }

    // Quest nodes — vertical stack below the goals branch
    if (hubExpanded && expandedSet.has('goals')) {
      const activeQuests = goalsHook.goals.filter(g => g.quest?.trim());
      if (activeQuests.length > 0) {
        const goalsNode = result.find(n => n.id === 'goals');
        const baseX = goalsNode.position.x;
        const baseY = goalsNode.position.y;
        activeQuests.forEach((q, i) => {
          result.push({
            id:   `quest-${q.year_month}`,
            type: 'quest',
            position: { x: baseX, y: baseY + BRANCH_H + QUEST_GAP_TOP + i * QUEST_STEP },
            data: { ...q, yearMonth: q.year_month },
            width:  QUEST_W,
            height: QUEST_H,
            hidden: false,
          });
        });
      }
    }

    // Compass child nodes — 3-level tree layout
    // Level 1: mission (center)
    // Level 2: team_spirit (left)  |  vision (right)
    // Level 3: jun_promise (left)  |  competency + values (right)
    if (hubExpanded && expandedSet.has('compass')) {
      const compassNode = result.find(n => n.id === 'compass');
      const bx = compassNode.position.x;
      const by = compassNode.position.y;

      const missionY = by + BRANCH_H + COMPASS_LEVEL_TOP;
      const level2Y  = missionY + COMPASS_H + COMPASS_LEVEL_GAP;
      const level3Y  = level2Y  + COMPASS_H + COMPASS_LEVEL_GAP;

      const compassNodes = [
        { id: 'cv-mission',     kind: 'mission',     x: bx,        y: missionY },
        { id: 'cv-team-spirit', kind: 'team_spirit', x: bx - 120,  y: level2Y  },
        { id: 'cv-jun-promise', kind: 'jun_promise', x: bx - 120,  y: level3Y  },
        { id: 'cv-vision',      kind: 'vision',      x: bx + 220,  y: level2Y  },
        { id: 'cv-competency',  kind: 'competency',  x: bx + 130,  y: level3Y  },
        { id: 'cv-values',      kind: 'values',      x: bx + 330,  y: level3Y  },
      ];
      compassNodes.forEach(({ id, kind, x, y }) => {
        result.push({
          id,
          type: 'compass',
          position: { x, y },
          data: { kind, text: vhHook.house?.[kind] ?? '' },
          width:  COMPASS_W,
          height: COMPASS_H,
          hidden: false,
        });
      });
    }

    return result;
  }, [expandedSet, projects, brainstorm.sessions, goalsHook.goals, vhHook.house, thankHook.thanks]);

  // Build dynamic edges
  const allEdges = useMemo(() => {
    const hubExpanded        = expandedSet.has('hub');
    const projectsExpanded   = expandedSet.has('projects');
    const brainstormExpanded = expandedSet.has('brainstorm');
    const result = [];

    INITIAL_EDGES.forEach(e => {
      const targetNode     = INITIAL_NODES.find(n => n.id === e.target);
      const targetParentId = targetNode?.data?.parentId;
      result.push({ ...e, hidden: targetParentId ? !hubExpanded : false });
    });

    const activeProjects = projects.filter(p => !p.archived);

    if (hubExpanded && projectsExpanded) {
      activeProjects.forEach((proj, i) => {
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

    if (hubExpanded && brainstormExpanded) {
      brainstorm.sessions.forEach((session, i) => {
        result.push({
          id:     `e-brainstorm-${session.id}`,
          source: 'brainstorm',
          target: session.id,
          type:   'rough',
          data:   { color: '#6B7C5C', seed: i + 50 },
        });
      });
    }

    if (hubExpanded && expandedSet.has('goals')) {
      goalsHook.goals.filter(g => g.quest?.trim()).forEach((q, i) => {
        result.push({
          id:     `e-goals-quest-${q.year_month}`,
          source: 'goals',
          target: `quest-${q.year_month}`,
          type:   'rough',
          data:   { color: '#D4A843', seed: i + 70 },
        });
      });
    }

    if (hubExpanded && expandedSet.has('compass')) {
      const compassEdges = [
        { id: 'e-compass-mission',    source: 'compass',        target: 'cv-mission',     seed: 80 },
        { id: 'e-mission-team',       source: 'cv-mission',     target: 'cv-team-spirit', seed: 81 },
        { id: 'e-team-jun',           source: 'cv-team-spirit', target: 'cv-jun-promise', seed: 82 },
        { id: 'e-mission-vision',     source: 'cv-mission',     target: 'cv-vision',      seed: 83 },
        { id: 'e-vision-competency',  source: 'cv-vision',      target: 'cv-competency',  seed: 84 },
        { id: 'e-vision-values',      source: 'cv-vision',      target: 'cv-values',      seed: 85 },
      ];
      compassEdges.forEach(({ id, source, target, seed }) => {
        result.push({ id, source, target, type: 'rough', data: { color: '#637A35', seed } });
      });
    }

    return result;
  }, [expandedSet, projects, brainstorm.sessions, goalsHook.goals]);

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

  const handleAddSession = useCallback(({ title, date }) => {
    brainstorm.addSession(title, date);
    setExpandedSet(prev => new Set([...prev, 'hub', 'brainstorm']));
    setShowAddSession(false);
  }, [brainstorm]);

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
          fitViewOptions={{ padding: 0.40, maxZoom: 1.0 }}
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
            initialDescription={showEditProj.description}
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

        {showAddSession && (
          <AddSessionModal
            onAdd={handleAddSession}
            onClose={() => setShowAddSession(false)}
          />
        )}

        {activeSession && (
          <BrainstormSlidePanel
            session={brainstorm.sessions.find(s => s.id === activeSession)}
            brainstorm={brainstorm}
            onClose={() => setActiveSession(null)}
          />
        )}

        {activeQuest && (
          <QuestSlidePanel
            goalsHook={goalsHook}
            initialMonth={activeQuest}
            onClose={() => setActiveQuest(null)}
          />
        )}

        {activeCompass && (
          <VisionHousePanel
            vhHook={vhHook}
            initialTab={activeCompass}
            onClose={() => setActiveCompass(null)}
          />
        )}

        {activeSchedule && (
          <CalendarPanel
            schedHook={schedHook}
            onClose={() => setActiveSchedule(false)}
          />
        )}

        {selectedMember && (
          <MemberTasksModal
            member={selectedMember}
            projects={projects}
            onClose={onCloseSelectedMember}
          />
        )}

        {activeFeedback && (
          <FeedbackModal
            projectId={activeFeedback.projectId}
            projectName={activeFeedback.projectName}
            onClose={() => { setActiveFeedback(null); setFeedbackVersion(v => v + 1); }}
          />
        )}

        {showDashboard && (
          <BemonDashboardPopup
            projects={projects}
            goals={goalsHook.goals}
            thanks={thankHook.thanks}
            onClose={() => setShowDashboard(false)}
          />
        )}

        {activeThankyou && (
          <ThankYouPanel
            thankHook={thankHook}
            onClose={() => setActiveThankyou(false)}
          />
        )}

        {activeIdeaBank && (
          <IdeaBankPanel
            ideaBankHook={ideaBankHook}
            onClose={() => setActiveIdeaBank(false)}
          />
        )}

        {activeCompleted && (
          <CompletedPanel
            projects={projects}
            onFeedback={(projectId, projectName) => setActiveFeedback({ projectId, projectName })}
            onClose={() => setActiveCompleted(false)}
            refreshKey={feedbackVersion}
          />
        )}

        <p className={styles.hint}>BEMON 허브를 클릭하면 메뉴가 펼쳐집니다</p>
      </div>
    </MindmapActionsContext.Provider>
  );
}

import { useState } from 'react';
import SlidePanel from '../panels/SlidePanel';
import TaskDetailPanel from '../panels/TaskDetailPanel';
import AddProjectModal from '../modals/AddProjectModal';
import EditProjectModal from '../modals/EditProjectModal';
import AddTaskModal from '../modals/AddTaskModal';
import FeedbackModal from '../modals/FeedbackModal';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './MobileProjectsPanel.module.css';

export default function MobileProjectsPanel({ projectsHook, onClose }) {
  const {
    projects, addProject, updateProject, deleteProject, archiveProject,
    addTask, updateTask, updateTaskMemo, toggleTask, deleteTask,
    addTaskImage, removeTaskImage,
  } = projectsHook;

  const [expandedIds,  setExpandedIds]  = useState(new Set());
  const [showAddProj,  setShowAddProj]  = useState(false);
  const [showEditProj, setShowEditProj] = useState(null); // { projectId, name, pm, description }
  const [showAddTask,  setShowAddTask]  = useState(null); // { projectId, projectName }
  const [activeTask,   setActiveTask]   = useState(null); // { taskId, projectId }
  const [activeFeedback, setActiveFeedback] = useState(null); // { projectId, projectName }

  const activeProjects = projects.filter(p => !p.archived);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddProject = ({ name, pm }) => {
    addProject(name, pm);
    setShowAddProj(false);
  };

  const handleSaveEditProject = ({ name, pm, description }) => {
    if (!showEditProj) return;
    updateProject(showEditProj.projectId, { name, pm, description });
    setShowEditProj(null);
  };

  const handleAddTask = ({ projectId, fields }) => {
    addTask(projectId, fields);
    setExpandedIds(prev => new Set([...prev, projectId]));
    setShowAddTask(null);
  };

  const handleDeleteProject = (projectId, name) => {
    if (!window.confirm(`"${name}" 프로젝트를 삭제할까요?`)) return;
    deleteProject(projectId);
  };

  const handleArchiveProject = (projectId, name) => {
    if (!window.confirm(`"${name}"을 프로젝트 완수!로 이동할까요?`)) return;
    archiveProject(projectId);
  };

  return (
    <SlidePanel title="프로젝트" emoji="📂" onClose={onClose} width={520}>
      <div className={styles.wrap}>
        <button className={styles.addProjectBtn} onClick={() => setShowAddProj(true)}>
          + 프로젝트 추가
        </button>

        {activeProjects.length === 0 && (
          <p className={styles.empty}>진행중인 프로젝트가 없어요</p>
        )}

        <div className={styles.list}>
          {activeProjects.map(proj => {
            const isExpanded  = expandedIds.has(proj.id);
            const isCompleted = proj.tasks?.length > 0 && proj.tasks.every(t => t.completed);
            const pmMc = proj.pm ? getMemberColor(proj.pm) : null;
            const doneCount = proj.tasks?.filter(t => t.completed).length ?? 0;

            return (
              <div key={proj.id} className={styles.card}>
                <div className={styles.cardHeader} onClick={() => toggleExpand(proj.id)}>
                  {pmMc && (
                    <span
                      className={styles.pmAvatar}
                      style={{ background: pmMc.bg, color: pmMc.text, borderColor: pmMc.border }}
                    >
                      {getMemberInitial(proj.pm)}
                    </span>
                  )}
                  <span className={styles.projName}>{proj.name}</span>
                  {proj.tasks?.length > 0 && (
                    <span className={styles.count}>{doneCount}/{proj.tasks.length}</span>
                  )}
                  <button
                    className={styles.iconBtn}
                    onClick={e => { e.stopPropagation(); setShowEditProj({ projectId: proj.id, name: proj.name, pm: proj.pm ?? null, description: proj.description ?? '' }); }}
                    title="프로젝트 수정"
                  >✎</button>
                  <button
                    className={styles.iconBtn}
                    onClick={e => { e.stopPropagation(); handleDeleteProject(proj.id, proj.name); }}
                    title="프로젝트 삭제"
                  >✕</button>
                  <span className={`${styles.arrow} ${isExpanded ? styles.arrowOpen : ''}`}>▼</span>
                </div>

                {isExpanded && (
                  <div className={styles.cardBody}>
                    {(proj.tasks ?? []).map(task => (
                      <div
                        key={task.id}
                        className={`${styles.taskRow} ${task.completed ? styles.taskDone : ''}`}
                        onClick={() => setActiveTask({ taskId: task.id, projectId: proj.id })}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={e => { e.stopPropagation(); toggleTask(proj.id, task.id); }}
                          onClick={e => e.stopPropagation()}
                        />
                        <span className={styles.taskName}>{task.name}</span>
                        {task.deadline && <span className={styles.taskDeadline}>{task.deadline}</span>}
                      </div>
                    ))}

                    <button
                      className={styles.addTaskBtn}
                      onClick={() => setShowAddTask({ projectId: proj.id, projectName: proj.name })}
                    >+ 태스크 추가</button>

                    {isCompleted && (
                      <div className={styles.completedActions}>
                        <button
                          className={styles.feedbackBtn}
                          onClick={() => setActiveFeedback({ projectId: proj.id, projectName: proj.name })}
                        >🎊 피드백 작성</button>
                        <button
                          className={styles.archiveBtn}
                          onClick={() => handleArchiveProject(proj.id, proj.name)}
                        >📦 보관하기</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAddProj && (
        <AddProjectModal onAdd={handleAddProject} onClose={() => setShowAddProj(false)} />
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

      {activeFeedback && (
        <FeedbackModal
          projectId={activeFeedback.projectId}
          projectName={activeFeedback.projectName}
          onClose={() => setActiveFeedback(null)}
        />
      )}
    </SlidePanel>
  );
}

import { useState, useRef } from 'react';
import RoughCard from '../rough/RoughCard';
import { ACCENT_COLORS } from '../../constants/branchColors';
import { MEMBERS, getMemberColor, getMemberInitial } from '../../constants/memberColors';

import MachoMan             from '../MachoMan';
import TaskDetailPanel      from '../panels/TaskDetailPanel';
import CompletedPanel       from '../panels/CompletedPanel';
import QuestSlidePanel      from '../panels/QuestSlidePanel';
import VisionHousePanel     from '../panels/VisionHousePanel';
import CalendarPanel        from '../panels/CalendarPanel';
import ThankYouPanel        from '../panels/ThankYouPanel';
import IdeaBankPanel        from '../panels/IdeaBankPanel';
import FootprintPanel       from '../panels/FootprintPanel';
import FeedbackModal        from '../modals/FeedbackModal';
import HubCheckinPopup      from '../modals/HubCheckinPopup';
import MemberTasksModal     from '../modals/MemberTasksModal';
import MobileProjectsPanel   from './MobileProjectsPanel';
import MobileBrainstormPanel from './MobileBrainstormPanel';

import { useProjects }    from '../../hooks/useProjects';
import { useBrainstorm }  from '../../hooks/useBrainstorm';
import { useGoals }       from '../../hooks/useGoals';
import { useVisionHouse } from '../../hooks/useVisionHouse';
import { useSchedule }    from '../../hooks/useSchedule';
import { useThankYou }    from '../../hooks/useThankYou';
import { useIdeaBank }    from '../../hooks/useIdeaBank';
import { useFootprints }  from '../../hooks/useFootprints';

import styles from './MobileLauncher.module.css';

const CARDS = [
  { id: 'projects',   label: '프로젝트',            accent: 'salmon'  },
  { id: 'completed',  label: '프로젝트 완수!',       accent: 'emerald' },
  { id: 'brainstorm', label: '브레인스토밍',         accent: 'green'   },
  { id: 'goals',      label: '이달의 퀘스트! (OKR)', accent: 'mustard' },
  { id: 'ideabank',   label: '이건 대박!',           accent: 'hotpink' },
  { id: 'schedule',   label: '베몽 달력',            accent: 'sky'     },
  { id: 'compass',    label: 'BEMON 나침반',         accent: 'violet'  },
  { id: 'footprints', label: '베몽의 발자국들',      accent: 'brown'   },
  { id: 'thankyou',   label: '땡큐 베리 머치',       accent: 'coral'   },
];

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// branchColors.js의 fill 값은 캔버스 마인드맵 노드용 반투명(rgba, alpha 0.72)이라
// 흰 배경 카드 위에서는 흐릿하게 보인다. 모바일 카드는 stroke(불투명 hex)를
// 배경으로 쓰고, 테두리는 이를 살짝 어둡게 만든 색으로 구분한다.
function darken(hex, factor = 0.78) {
  const h = hex.replace('#', '');
  const r = Math.round(parseInt(h.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(h.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(h.slice(4, 6), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function MobileLauncher() {
  const [activePanel,    setActivePanel]    = useState(null); // one of CARDS[].id
  // 진입 시 자동으로 체크인 팝업을 한 번 띄운다 (데스크탑 허브 클릭 시와 동일한 HubCheckinPopup 재사용)
  const [showCheckin,    setShowCheckin]    = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTask,     setActiveTask]     = useState(null); // { taskId, projectId }
  const [activeFeedback, setActiveFeedback] = useState(null); // { projectId, projectName }
  const [feedbackVersion, setFeedbackVersion] = useState(0);

  const projectsHook = useProjects();
  const brainstorm   = useBrainstorm();
  const goalsHook     = useGoals();
  const vhHook        = useVisionHouse();
  const schedHook     = useSchedule();
  const thankHook     = useThankYou();
  const ideaBankHook  = useIdeaBank();
  const footprintsHook = useFootprints();

  const { projects, updateTask, updateTaskMemo, toggleTask, deleteTask, addTaskImage, removeTaskImage, updateTaskPriority } = projectsHook;

  const openTask = (taskId, projectId) => setActiveTask({ taskId, projectId });

  const machoManRef = useRef(null);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>
            <span className={styles.titleBemon}>BEMON</span>{' '}
            <span className={styles.titleControlTower}>CONTROL TOWER</span>
          </span>
          <div className={styles.headerActions}>
            <button
              className={styles.whoBtn}
              onClick={() => setShowCheckin(true)}
              title="체크인"
              aria-label="체크인"
            >WHO?</button>
          </div>
        </div>

        <div className={styles.avatarRow}>
          {MEMBERS.map(name => {
            const mc = getMemberColor(name);
            return (
              <button
                key={name}
                className={styles.avatarBtn}
                style={{ background: mc.bg, color: mc.text, borderColor: mc.border }}
                onClick={() => setSelectedMember(name)}
              >
                {getMemberInitial(name)}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.grid}>
        {CARDS.map(card => {
          const ac = ACCENT_COLORS[card.accent];
          const borderColor = darken(ac.stroke);
          return (
            <RoughCard
              key={card.id}
              className={styles.card}
              padding="0"
              fill={ac.stroke}
              stroke={borderColor}
              hoverFill={ac.stroke}
              hoverStroke={borderColor}
              strokeWidth={1.7}
              roughness={1.4}
              hoverable
              seed={card.label.charCodeAt(0)}
              onClick={() => setActivePanel(card.id)}
            >
              <span className={styles.cardLabel}>{card.label}</span>
            </RoughCard>
          );
        })}
      </div>

      {activePanel === 'projects' && (
        <MobileProjectsPanel projectsHook={projectsHook} onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'completed' && (
        <CompletedPanel
          projects={projects}
          onFeedback={(projectId, projectName) => setActiveFeedback({ projectId, projectName })}
          onClose={() => setActivePanel(null)}
          refreshKey={feedbackVersion}
        />
      )}

      {activePanel === 'brainstorm' && (
        <MobileBrainstormPanel brainstorm={brainstorm} onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'goals' && (
        <QuestSlidePanel
          goalsHook={goalsHook}
          initialMonth={currentYearMonth()}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'ideabank' && (
        <IdeaBankPanel ideaBankHook={ideaBankHook} onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'schedule' && (
        <CalendarPanel schedHook={schedHook} onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'compass' && (
        <VisionHousePanel vhHook={vhHook} initialTab="mission" onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'footprints' && (
        <FootprintPanel footprintsHook={footprintsHook} onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'thankyou' && (
        <ThankYouPanel thankHook={thankHook} onClose={() => setActivePanel(null)} />
      )}

      {activeFeedback && (
        <FeedbackModal
          projectId={activeFeedback.projectId}
          projectName={activeFeedback.projectName}
          onClose={() => { setActiveFeedback(null); setFeedbackVersion(v => v + 1); }}
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

      {showCheckin && (
        <HubCheckinPopup
          projects={projects}
          onClose={() => setShowCheckin(false)}
          onOpenTask={openTask}
        />
      )}

      {selectedMember && (
        <MemberTasksModal
          member={selectedMember}
          projects={projects}
          onClose={() => setSelectedMember(null)}
          onOpenTask={openTask}
          onUpdateTaskPriority={updateTaskPriority}
        />
      )}

      <MachoMan ref={machoManRef} projects={projects} goals={goalsHook.goals} />
    </div>
  );
}

import SlidePanel    from '../panels/SlidePanel';
import SchedulePanel from '../panels/SchedulePanel';
import GoalsPanel    from '../panels/GoalsPanel';

const CONFIG = {
  schedule: { title: '스케줄', emoji: '📅', Component: SchedulePanel, width: 500 },
  goals:    { title: '목표',   emoji: '🎯', Component: GoalsPanel,    width: 520 },
};

export default function NodePanel({ nodeId, onClose }) {
  const cfg = CONFIG[nodeId];
  if (!cfg) return null;
  const { title, emoji, Component, width } = cfg;
  return (
    <SlidePanel title={title} emoji={emoji} onClose={onClose} width={width}>
      <Component />
    </SlidePanel>
  );
}

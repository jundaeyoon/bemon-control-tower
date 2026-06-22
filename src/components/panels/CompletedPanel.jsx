import { useEffect, useState } from 'react';
import SlidePanel from './SlidePanel';
import { supabase } from '../../lib/supabase';
import { getMemberColor, getMemberInitial } from '../../constants/memberColors';
import styles from './CompletedPanel.module.css';

function fmtDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function CompletedPanel({ projects, onFeedback, onClose, refreshKey = 0 }) {
  const archived = [...projects.filter(p => p.archived)].reverse();
  const [feedbacks, setFeedbacks] = useState({});

  useEffect(() => {
    if (archived.length === 0) return;
    supabase
      .from('project_feedbacks')
      .select('*')
      .in('project_id', archived.map(p => p.id))
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach(fb => { if (!map[fb.project_id]) map[fb.project_id] = fb; });
        setFeedbacks(map);
      });
  }, [refreshKey, archived.length]);

  return (
    <SlidePanel title="프로젝트 완수!" emoji="🏆" onClose={onClose} width={460}>
      <div className={styles.wrap}>
        {archived.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>💪</span>
            <p>아직 완수한 프로젝트가 없어요</p>
          </div>
        ) : (
          <div className={styles.list}>
            {archived.map(proj => {
              const fb    = feedbacks[proj.id];
              const pmMc  = proj.pm ? getMemberColor(proj.pm) : null;
              return (
                <div key={proj.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.projName}>{proj.name}</span>
                    {pmMc && (
                      <div className={styles.pmRow}>
                        <div
                          className={styles.pmAvatar}
                          style={{ background: pmMc.bg, color: pmMc.text, borderColor: pmMc.border }}
                        >
                          {getMemberInitial(proj.pm)}
                        </div>
                        <span className={styles.pmName}>{proj.pm}</span>
                      </div>
                    )}
                  </div>

                  {proj.archived_at && (
                    <span className={styles.date}>✅ 완료 {fmtDate(proj.archived_at)}</span>
                  )}

                  {fb ? (
                    <div className={styles.fbPreview}>
                      <div className={styles.fbRow}>
                        <span className={styles.fbLabel}>🏆</span>
                        <span className={styles.fbText}>{fb.achievement}</span>
                      </div>
                      <div className={styles.fbRow}>
                        <span className={styles.fbLabel}>🎯</span>
                        <span className={styles.fbText}>{fb.preparation}</span>
                      </div>
                      <div className={styles.fbRow}>
                        <span className={styles.fbLabel}>🎉</span>
                        <span className={styles.fbText}>{fb.fun}</span>
                      </div>
                    </div>
                  ) : (
                    <span className={styles.noFb}>아직 피드백이 없어요</span>
                  )}

                  <button
                    className={styles.fbBtn}
                    onClick={() => onFeedback(proj.id, proj.name)}
                  >
                    🎊 {fb ? '피드백 수정' : '피드백 작성'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SlidePanel>
  );
}

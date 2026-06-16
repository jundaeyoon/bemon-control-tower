import { useRef, useState } from 'react';
import SlidePanel    from './SlidePanel';
import RoughInput    from '../rough/RoughInput';
import RoughButton   from '../rough/RoughButton';
import ImageGallery  from '../modals/ImageGallery';
import { getMemberColor } from '../../constants/memberColors';
import styles from './TaskDetailPanel.module.css';

const MEMBERS = ['JUN', 'SURI', 'SUNNY!', 'JIN', 'LENA'];

export default function TaskDetailPanel({
  taskId, projectId, projects,
  onUpdateTask, onUpdateTaskMemo, onToggleTask, onDeleteTask,
  onAddTaskImage, onRemoveTaskImage,
  onClose,
}) {
  const project = projects.find(p => p.id === projectId);
  const task    = project?.tasks.find(t => t.id === taskId);

  const [name,       setName]       = useState(task?.name     ?? '');
  const [assignee,   setAssignee]   = useState(task?.assignee ?? 'JUN');
  const [deadline,   setDeadline]   = useState(task?.deadline ?? '');
  const [progress,   setProgress]   = useState(task?.progress ?? 0);
  const [memo,       setMemo]       = useState(task?.memo    ?? '');
  const [dragOver,   setDragOver]   = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(null);

  const fileInputRef = useRef(null);

  if (!task) return null;

  const images = task.images ?? [];

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onAddTaskImage(projectId, taskId, {
          id:   `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          data: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSave = () => {
    onUpdateTask(projectId, taskId, { name: name.trim() || task.name, assignee, deadline, progress: Number(progress) });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`"${task.name}" 작업을 삭제할까요?`)) {
      onDeleteTask(projectId, taskId);
      onClose();
    }
  };

  return (
    <SlidePanel title={task.name} emoji="📋" onClose={onClose} width={460}>
      <div className={styles.wrap}>

        {/* Complete toggle */}
        <button
          className={`${styles.toggleBtn} ${task.completed ? styles.toggleDone : ''}`}
          onClick={() => onToggleTask(projectId, taskId)}
          style={{ borderColor: getMemberColor(task.assignee).border }}
        >
          <span className={styles.toggleIcon}>{task.completed ? '✓' : '○'}</span>
          <span>{task.completed ? '완료됨 — 클릭하면 취소' : '완료로 표시'}</span>
        </button>

        {/* Form */}
        <div className={styles.form}>
          <RoughInput
            label="작업 이름"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <div className={styles.field}>
            <span className={styles.label}>담당자</span>
            <div className={styles.memberGroup}>
              {MEMBERS.map(m => {
                const mc = getMemberColor(m);
                return (
                  <button
                    key={m}
                    className={`${styles.memberBtn} ${assignee === m ? styles.memberActive : ''}`}
                    style={{
                      borderColor: assignee === m ? mc.border : 'var(--color-border)',
                      color:       assignee === m ? mc.text   : 'var(--color-text-sub)',
                      background:  assignee === m ? mc.bg     : 'transparent',
                    }}
                    onClick={() => setAssignee(m)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <RoughInput
            label="마감일"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />

          <div className={styles.field}>
            <span className={styles.label}>
              진행률 <strong style={{ color: getMemberColor(assignee).text }}>{progress}%</strong>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={e => setProgress(e.target.value)}
              className={styles.slider}
              style={{ accentColor: getMemberColor(assignee).text }}
            />
          </div>

          {/* Memo */}
          <div className={styles.field}>
            <span className={styles.label}>메모</span>
            <textarea
              className={styles.memoTextarea}
              value={memo}
              placeholder="작업 관련 메모를 입력하세요..."
              onChange={e => {
                setMemo(e.target.value);
                onUpdateTaskMemo(projectId, taskId, e.target.value);
              }}
            />
          </div>

          {/* Image section */}
          <div className={styles.field}>
            <span className={styles.label}>이미지 첨부</span>

            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <span className={styles.dropIcon}>📎</span>
              <span className={styles.dropText}>클릭 또는 드래그로 이미지 추가</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
              />
            </div>

            {images.length > 0 && (
              <div className={styles.thumbGrid}>
                {images.map((img, i) => (
                  <div key={img.id} className={styles.thumbWrap}>
                    <img
                      src={img.data}
                      alt={img.name}
                      className={styles.thumb}
                      title={img.name}
                      onClick={() => setGalleryIdx(i)}
                    />
                    <button
                      className={styles.removeImg}
                      onClick={e => { e.stopPropagation(); onRemoveTaskImage(projectId, taskId, img.id); }}
                      title="삭제"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <RoughButton variant="danger" size="sm" onClick={handleDelete}>삭제</RoughButton>
          <div className={styles.actionRight}>
            <RoughButton variant="ghost" size="sm" onClick={onClose}>취소</RoughButton>
            <RoughButton variant="secondary" size="sm" onClick={handleSave}>저장</RoughButton>
          </div>
        </div>
      </div>

      {galleryIdx !== null && (
        <ImageGallery
          images={images}
          startIndex={galleryIdx}
          onClose={() => setGalleryIdx(null)}
        />
      )}
    </SlidePanel>
  );
}

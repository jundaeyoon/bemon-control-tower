import { useState } from 'react';
import Header from './components/ui/Header';
import MindmapCanvas from './components/mindmap/MindmapCanvas';
import MobileLauncher from './components/mobile/MobileLauncher';
import { useIsMobile } from './hooks/useIsMobile';
import styles from './App.module.css';

export default function App() {
  const [selectedMember, setSelectedMember] = useState(null);
  // 모바일 폭에서 "PC" 버튼으로 기존 PC용 마인드맵을 강제로 띄우기 위한 상태.
  // useIsMobile 자체의 분기 로직은 그대로 두고, 그 위에 이 상태만 얹는다.
  const [forcePcView, setForcePcView] = useState(false);
  const isMobile = useIsMobile(768);

  if (isMobile && !forcePcView) {
    return <MobileLauncher onForcePc={() => setForcePcView(true)} />;
  }

  return (
    <div className={styles.page}>
      <Header
        selectedMember={selectedMember}
        onSelectMember={(name) => setSelectedMember(prev => prev === name ? null : name)}
      />
      <main className={styles.main}>
        <MindmapCanvas
          selectedMember={selectedMember}
          onCloseSelectedMember={() => setSelectedMember(null)}
          initialZoom={isMobile ? 0.45 : undefined}
        />
      </main>
      {isMobile && forcePcView && (
        <button className={styles.backToMobileBtn} onClick={() => setForcePcView(false)}>
          ← 모바일로
        </button>
      )}
    </div>
  );
}

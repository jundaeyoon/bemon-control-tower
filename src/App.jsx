import { useState } from 'react';
import Header from './components/ui/Header';
import MindmapCanvas from './components/mindmap/MindmapCanvas';
import MobileLauncher from './components/mobile/MobileLauncher';
import { useIsMobile } from './hooks/useIsMobile';
import styles from './App.module.css';

export default function App() {
  const [selectedMember, setSelectedMember] = useState(null);
  const isMobile = useIsMobile(768);

  if (isMobile) {
    return <MobileLauncher />;
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
        />
      </main>
    </div>
  );
}

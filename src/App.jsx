import { useState } from 'react';
import Header from './components/ui/Header';
import MindmapCanvas from './components/mindmap/MindmapCanvas';
import styles from './App.module.css';

export default function App() {
  const [selectedMember, setSelectedMember] = useState(null);

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

import { useStore } from './store/useStore';
import { Sidebar } from './components/Sidebar';
import { ScalesView } from './components/ScalesView';
import { ExploreView } from './components/ExploreView';
import { IntervalBuilderView } from './components/IntervalBuilderView';
import { ScaleQuizView } from './components/ScaleQuizView';
import styles from './App.module.css';

function App() {
  const currentView = useStore((state) => state.currentView);

  const renderView = () => {
    switch (currentView) {
      case 'scales':
        return <ScalesView />;
      case 'explore':
        return <ExploreView />;
      case 'builder':
        return <IntervalBuilderView />;
      case 'quiz':
        return <ScaleQuizView />;
      default:
        return <ScalesView />;
    }
  };

  return (
    <div className={styles.app}>
      <Sidebar />
      <main className={styles.mainContent}>
        {renderView()}
      </main>
    </div>
  );
}

export default App;

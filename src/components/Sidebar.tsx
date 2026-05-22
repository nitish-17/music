import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { ViewType } from '../store/useStore';
import { GraduationCap, BookOpen, Music4, Download, Layers } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const { currentView, setView } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    {
      id: 'scales' as ViewType,
      label: 'Scales',
      icon: Music4,
    },
    {
      id: 'explore' as ViewType,
      label: 'Explore',
      icon: BookOpen,
    },
    {
      id: 'builder' as ViewType,
      label: 'Interval Builder',
      icon: Layers,
    },
    {
      id: 'quiz' as ViewType,
      label: 'Quiz',
      icon: GraduationCap,
    },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.navGroup}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => setView(item.id)}
              aria-label={item.label}
            >
              <Icon className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        {deferredPrompt && (
          <button
            className={styles.installBtn}
            onClick={handleInstallClick}
            aria-label="Install App"
            style={{ marginBottom: '16px' }}
          >
            <Download className={styles.navIcon} />
            <span className={styles.navLabel}>Install</span>
          </button>
        )}
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-light)' }}>
          v1.0
        </div>
      </div>
    </div>
  );
};

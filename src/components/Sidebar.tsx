import React from 'react';
import { useStore } from '../store/useStore';
import type { ViewType } from '../store/useStore';
import { GraduationCap, BookOpen, Music4, Layers } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar: React.FC = () => {
  const { currentView, setView } = useStore();

  const navItems = [
    {
      id: 'scales' as ViewType,
      label: 'Scales',
      icon: Music4,
    },
    {
      id: 'explore' as ViewType,
      label: 'Basics',
      icon: BookOpen,
    },
    {
      id: 'builder' as ViewType,
      label: 'Interval',
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
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-light)' }}>
          v1.0
        </div>
      </div>
    </div>
  );
};

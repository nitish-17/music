import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SCALE_FORMULAS } from '../theory/scales';
import { MELAKARTA_NAMES } from '../theory/melakarta';
import { getSwaraForScaleDegree } from '../theory/intervals';
import { GraduationCap, Award, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import styles from './ScaleQuizView.module.css';

export const ScaleQuizView: React.FC = () => {
  const {
    quizRoot,
    quizScaleType,
    quizNotes,
    quizCurrentIndex,
    quizStatus,
    quizFeedback,
    quizConfig,
    startNewQuiz,
    submitQuizNote,
    playCurrentScale,
    setRootNote,
    setScaleType,
    setQuizConfig,
  } = useStore();

  const chromaticKeys = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const swaraKeys = [
    'S', 'R1', 'R2', 'R3',
    'G1', 'G2', 'G3', 'M1',
    'M2', 'P', 'D1', 'D2',
    'D3', 'N1', 'N2', 'N3'
  ];

  // Start a quiz on mount if not already playing
  useEffect(() => {
    if (quizStatus === 'idle') {
      startNewQuiz();
    }
  }, [quizStatus, startNewQuiz]);

  const isMelakarta = quizScaleType.startsWith('melakarta_');

  let activeFormulaName = '';
  if (isMelakarta) {
    const ragaIdx = parseInt(quizScaleType.split('_')[1], 10);
    activeFormulaName = `Melakarta ${ragaIdx + 1}: ${MELAKARTA_NAMES[ragaIdx]}`;
  } else {
    activeFormulaName = SCALE_FORMULAS[quizScaleType]?.name || quizScaleType;
  }

  // Auto-play the scale when completed
  useEffect(() => {
    if (quizStatus === 'completed') {
      // Temporarily sync the main explorer settings so it plays the correct quiz scale
      setRootNote(quizRoot);
      setScaleType(quizScaleType);
      
      const timer = setTimeout(() => {
        playCurrentScale();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [quizStatus, quizRoot, quizScaleType, setRootNote, setScaleType, playCurrentScale]);

  const handleKeyClick = (noteName: string) => {
    submitQuizNote(noteName);
  };

  const currentKeys = isMelakarta ? swaraKeys : chromaticKeys;

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Spelling Quiz</h1>
        <p className={styles.subtitle}>
          Test your music theory knowledge by building scales note-by-note.
        </p>
      </div>

      {/* Configuration Panel */}
      <div className={styles.configBar}>
        <div className={styles.configTitle}>Scale Categories to Practice:</div>
        <div className={styles.configOptions}>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              checked={quizConfig.majorMinor}
              onChange={(e) => setQuizConfig({ majorMinor: e.target.checked })}
            />
            <span className={styles.checkboxText}>Major/Minor</span>
          </label>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              checked={quizConfig.modes}
              onChange={(e) => setQuizConfig({ modes: e.target.checked })}
            />
            <span className={styles.checkboxText}>Modes</span>
          </label>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              checked={quizConfig.pentatonic}
              onChange={(e) => setQuizConfig({ pentatonic: e.target.checked })}
            />
            <span className={styles.checkboxText}>Pentatonics</span>
          </label>
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              checked={quizConfig.melakarta}
              onChange={(e) => setQuizConfig({ melakarta: e.target.checked })}
            />
            <span className={styles.checkboxText}>Melakarta Ragas</span>
          </label>
        </div>
      </div>

      {quizStatus === 'idle' ? (
        <div className={styles.quizCard}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
            }}
          >
            <GraduationCap size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Ready to Practice?</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: '14px' }}>
            We'll give you a random root note and scale type. Spell it out correctly from start to finish!
          </p>
          <button className={styles.actionBtn} onClick={startNewQuiz}>
            <span>Start Practice</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className={styles.quizCard}>
          {quizStatus === 'completed' ? (
            <div
              style={{
                width: '64px',
                height: '64px',
                background: 'var(--success-light)',
                color: 'var(--success)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px',
              }}
            >
              <Award size={32} />
            </div>
          ) : (
            <div
              style={{
                width: '48px',
                height: '48px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px',
              }}
            >
              <HelpCircle size={24} />
            </div>
          )}

          <div className={styles.prompt}>
            {quizStatus === 'completed' ? 'Scale Spelling Completed!' : 'Spell the following scale in order:'}
            <span className={styles.targetScale}>
              {quizRoot} {activeFormulaName}
            </span>
          </div>

          {/* Progress Slots */}
          <div className={styles.progressContainer}>
            {quizNotes.map((scaleNote, idx) => {
              const isCorrect = idx < quizCurrentIndex;
              const isActive = idx === quizCurrentIndex && quizStatus === 'playing';
              
              let slotClass = styles.progressSlot;
              if (isCorrect || quizStatus === 'completed') {
                slotClass += ` ${styles.slotCorrect}`;
              } else if (isActive) {
                slotClass += ` ${styles.slotActive}`;
              } else {
                slotClass += ` ${styles.slotLocked}`;
              }

              const swaraName = isMelakarta
                ? scaleNote.step.intervalName
                : getSwaraForScaleDegree(idx + 1, scaleNote.step.semitones).shortName;

              return (
                <div key={idx} className={slotClass}>
                  <span className={styles.slotIndex}>Degree {idx + 1}</span>
                  <span className={styles.slotName}>
                    {isCorrect || quizStatus === 'completed'
                      ? (isMelakarta ? scaleNote.step.intervalName : scaleNote.noteName)
                      : isActive
                      ? '?'
                      : '•'}
                  </span>
                  <span className={styles.slotSwara}>
                    {isCorrect || quizStatus === 'completed' ? swaraName : '\u00a0'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Feedback Banner */}
          {quizFeedback && (
            <div
              className={`${styles.feedbackBox} ${
                quizFeedback.success ? styles.feedbackSuccess : styles.feedbackError
              }`}
            >
              {quizFeedback.message}
            </div>
          )}

          {/* Input Keypad */}
          {quizStatus === 'playing' && (
            <div className={styles.keypadSection}>
              <div className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '8px' }}>
                {isMelakarta ? 'Select Next Swara' : 'Select Next Note'}
              </div>
              <div className={styles.keypadGrid}>
                {currentKeys.map((key) => (
                  <button
                    key={key}
                    className={styles.keyBtn}
                    onClick={() => handleKeyClick(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Playback or Reset controls */}
          <div style={{ display: 'flex', gap: '14px', marginTop: '12px' }}>
            {quizStatus === 'completed' ? (
              <button className={styles.actionBtn} onClick={startNewQuiz}>
                <span>Next Scale</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className={styles.actionBtn}
                style={{ background: 'var(--panel-bg-hover)', color: 'var(--text-main)', boxShadow: 'var(--shadow-sm)' }}
                onClick={startNewQuiz}
              >
                <RotateCcw size={16} />
                <span>Restart / Skip</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

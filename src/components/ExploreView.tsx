import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { parseNote, getMidiNumber } from '../theory/notes';
import { playNote } from '../theory/audio';
import { SEMITONE_TO_SWARAS } from '../theory/intervals';
import { generateMelakartaNotes } from '../theory/melakarta';
import { Volume2, Play, Square, Info } from 'lucide-react';
import styles from './ExploreView.module.css';

interface RagaExample {
  name: string;
  index: number;
  desc: string;
}

const RAGAS_EXAMPLES: RagaExample[] = [
  { name: 'Mayamalavagowla', index: 14, desc: 'Equivalent to the Western Double Harmonic Major scale. Distinctive exotic, prayer-like sound.' },
  { name: 'Dheerasankarabharanam', index: 28, desc: 'Equivalent to the Western Major scale. Bright, cheerful, and familiar.' },
  { name: 'Mechakalyani', index: 64, desc: 'Equivalent to the Lydian mode. Dreamy sound using a raised 4th note.' },
  { name: 'Hanumatodi', index: 7, desc: 'Equivalent to the Phrygian mode. Flamenco/Spanish sound with flat seconds and thirds.' },
  { name: 'Natabhairavi', index: 19, desc: 'Equivalent to the Natural Minor scale. Deeply emotional and classical.' },
];

export const ExploreView: React.FC = () => {
  const { rootNote, setRootNote } = useStore();
  const [selectedRagaIdx, setSelectedRagaIdx] = useState<number | null>(null);
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [isPlayingRaga, setIsPlayingRaga] = useState(false);
  const [currentPlayingNoteIndex, setCurrentPlayingNoteIndex] = useState<number | null>(null);

  // List of roots
  const roots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  // Piano keys definition: Middle C4 (60) to C5 (72)
  const pianoKeys = useMemo(() => [
    { midi: 60, name: 'C', isBlack: false },
    { midi: 61, name: 'C#', isBlack: true },
    { midi: 62, name: 'D', isBlack: false },
    { midi: 63, name: 'D#', isBlack: true },
    { midi: 64, name: 'E', isBlack: false },
    { midi: 65, name: 'F', isBlack: false },
    { midi: 66, name: 'F#', isBlack: true },
    { midi: 67, name: 'G', isBlack: false },
    { midi: 68, name: 'G#', isBlack: true },
    { midi: 69, name: 'A', isBlack: false },
    { midi: 70, name: 'A#', isBlack: true },
    { midi: 71, name: 'B', isBlack: false },
    { midi: 72, name: 'C', isBlack: false }
  ], []);

  // Compute scale notes when a raga is selected
  const ragaNotes = useMemo(() => {
    if (selectedRagaIdx === null) return [];
    return generateMelakartaNotes(rootNote, selectedRagaIdx);
  }, [rootNote, selectedRagaIdx]);

  // Set of midi numbers in the active raga scale
  const ragaMidiSet = useMemo(() => {
    const set = new Set<number>();
    ragaNotes.forEach(n => {
      set.add(n.midi);
      // Also add octave root
      if (n.swara.semitones === 0) {
        set.add(n.midi + 12);
      }
    });
    return set;
  }, [ragaNotes]);

  // Stop playback on unmount or root change
  useEffect(() => {
    return () => {
      setIsPlayingRaga(false);
      setCurrentPlayingNoteIndex(null);
    };
  }, [rootNote, selectedRagaIdx]);

  // Helper to map any midi note to its swara name relative to the current root note
  const getSwaraLabel = (midi: number) => {
    const rootMidi = getMidiNumber(parseNote(`${rootNote}4`));
    const diff = midi - rootMidi;
    if (diff === 0) return 'S';
    if (diff === 12) return 'Ṡ';
    const semitones = (diff + 12) % 12;
    const mappings = SEMITONE_TO_SWARAS[semitones];
    return mappings ? mappings.map(m => m.shortName).join('/') : '';
  };

  // Play single note
  const handleKeyClick = (midi: number) => {
    setActiveMidi(midi);
    playNote(midi, { durationSec: 0.5 });
    // Reset active midi highlight after a delay
    setTimeout(() => {
      setActiveMidi(null);
    }, 400);
  };

  // Play Raga Scale
  const playRaga = () => {
    if (isPlayingRaga || selectedRagaIdx === null) return;
    setIsPlayingRaga(true);
    setCurrentPlayingNoteIndex(0);

    const notesToPlay = [
      ...ragaNotes.map(n => n.midi),
      ragaNotes[0].midi + 12 // High S
    ];

    const playNext = (idx: number) => {
      if (idx >= notesToPlay.length) {
        setIsPlayingRaga(false);
        setCurrentPlayingNoteIndex(null);
        return;
      }
      setCurrentPlayingNoteIndex(idx);
      playNote(notesToPlay[idx], { durationSec: 0.45 });

      setTimeout(() => {
        playNext(idx + 1);
      }, 500);
    };

    playNext(0);
  };

  // Calculate descriptive info for the active key
  const activeKeyInfo = useMemo(() => {
    if (activeMidi === null) return null;
    const rootMidi = getMidiNumber(parseNote(`${rootNote}4`));
    const diff = activeMidi - rootMidi;
    const semitones = (diff + 12) % 12;
    const mappings = SEMITONE_TO_SWARAS[semitones];
    
    const noteClass = activeMidi % 12;
    const notesList = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const pNote = notesList[noteClass];

    if (diff === 0) {
      return {
        title: `${pNote} (Shadjam - S)`,
        desc: `This is the starting reference note (Root) of your scale, called Shadjam (S). In Carnatic music, all other notes are sung relative to this constant pitch.`
      };
    }
    if (diff === 12) {
      return {
        title: `${pNote} (High Shadjam - Ṡ)`,
        desc: `This is the octave pitch (Ṡ) of your root note ${rootNote}. It is exactly 12 semitones above the starting Shadjam.`
      };
    }

    const swaraFullNames = mappings ? mappings.map(m => `**${m.shortName}** (${m.fullName})`).join(' or ') : 'Unknown';
    return {
      title: `${pNote} (Semitone offset: +${semitones})`,
      desc: `This piano key is ${semitones} semitone(s) above your root note (${rootNote}). In Carnatic music, this represents the swara: ${swaraFullNames}.`
    };
  }, [activeMidi, rootNote]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Explore Carnatic Music</h1>
        <p className={styles.subtitle}>
          Learn the foundational Indian Swaras directly using familiar piano keys. No background in Western or Indian theory required!
        </p>
      </div>

      {/* Intro card */}
      <div className={styles.introCard}>
        <h2 className={styles.cardTitle}>The 7 Swaras System</h2>
        <p className={styles.cardText}>
          Just like piano keys C, D, E, F, G, A, B form scales, Indian classical music names its notes as 
          <strong> S, R, G, M, P, D, N</strong> (Swaras). 
          While <strong>S (Shadjam)</strong> and <strong>P (Panchamam)</strong> are fixed constant notes, the others have multiple variants (e.g. R1, R2, R3) 
          lying different distances (semitones) above S. Think of it like mapping black and white piano keys relative to your home base note.
        </p>
      </div>

      {/* Root Transposition selector */}
      <div className={styles.rootSection}>
        <div className={styles.rootLabel}>1. Select Your Base Piano Key (Root Note):</div>
        <div className={styles.rootGrid}>
          {roots.map(note => (
            <button
              key={note}
              className={`${styles.rootBtn} ${rootNote === note ? styles.rootBtnActive : ''}`}
              onClick={() => {
                setRootNote(note);
                setSelectedRagaIdx(null);
              }}
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      {/* Piano Keyboard Visualizer */}
      <div className={styles.pianoSection}>
        <div className={styles.pianoInstructions}>
          <Volume2 size={16} />
          <span>Click piano keys to explore how they translate to Swara positions relative to <strong>{rootNote}</strong></span>
        </div>

        <div className={styles.pianoKeyboard}>
          <div className={styles.keyboardScrollWrapper}>
            {/* White keys */}
            <div className={styles.whiteKeysContainer}>
              {pianoKeys.filter(k => !k.isBlack).map(key => {
                const swara = getSwaraLabel(key.midi);
                const isRagaActive = ragaMidiSet.has(key.midi);
                
                // Check if playing this note in sequence
                const isPlayingHighlight = isPlayingRaga && 
                  selectedRagaIdx !== null && 
                  currentPlayingNoteIndex !== null && 
                  (ragaNotes[currentPlayingNoteIndex]?.midi === key.midi || 
                   (currentPlayingNoteIndex === ragaNotes.length && key.midi === ragaNotes[0].midi + 12));

                return (
                  <button
                    key={key.midi}
                    className={`${styles.whiteKey} ${activeMidi === key.midi ? styles.keyActive : ''} ${isRagaActive ? styles.whiteKeyRaga : ''} ${isPlayingHighlight ? styles.isPlayingKey : ''}`}
                    onClick={() => handleKeyClick(key.midi)}
                  >
                    <span className={styles.pianoNoteName}>{key.name}</span>
                    <span className={styles.swaraName}>{swara}</span>
                  </button>
                );
              })}
            </div>

            {/* Black keys */}
            <div className={styles.blackKeysContainer}>
              {pianoKeys.map((key) => {
                if (!key.isBlack) return null;
                const swara = getSwaraLabel(key.midi);
                const isRagaActive = ragaMidiSet.has(key.midi);
                
                const isPlayingHighlight = isPlayingRaga && 
                  selectedRagaIdx !== null && 
                  currentPlayingNoteIndex !== null && 
                  ragaNotes[currentPlayingNoteIndex]?.midi === key.midi;

                // Absolute horizontal placement calculations relative to white keys index
                // White keys are C, D, E, F, G, A, B, C (indices 0, 1, 2, 3, 4, 5, 6, 7)
                // C# is between C (0) and D (1) -> left offset
                let leftPercent = 0;
                if (key.name === 'C#') leftPercent = 7.7;
                else if (key.name === 'D#') leftPercent = 20.2;
                else if (key.name === 'F#') leftPercent = 45.2;
                else if (key.name === 'G#') leftPercent = 57.7;
                else if (key.name === 'A#') leftPercent = 70.2;

                return (
                  <button
                    key={key.midi}
                    style={{ left: `${leftPercent}%` }}
                    className={`${styles.blackKey} ${activeMidi === key.midi ? styles.keyActive : ''} ${isRagaActive ? styles.blackKeyRaga : ''} ${isPlayingHighlight ? styles.isPlayingKey : ''}`}
                    onClick={() => handleKeyClick(key.midi)}
                  >
                    <span className={styles.pianoNoteName}>{key.name}</span>
                    <span className={styles.swaraName}>{swara}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Info card display */}
      {activeKeyInfo && (
        <div className={`${styles.infoCard} animate-fade-in`}>
          <div className={styles.infoTitle}>
            <Info size={16} />
            <span>{activeKeyInfo.title}</span>
          </div>
          <p className={styles.infoDesc}>{activeKeyInfo.desc}</p>
        </div>
      )}

      {/* Scales Try Section */}
      <div className={styles.examplesSection}>
        <h2 className={styles.sectionTitle}>2. Choose a Carnatic Scale (Raga) to Visualize</h2>
        <p className={styles.sectionSubtitle}>
          Select a scale below. The active notes will light up on the piano keys above, showing you their positions and interval patterns.
        </p>

        <div className={styles.ragaGrid}>
          {RAGAS_EXAMPLES.map(raga => {
            const isActive = selectedRagaIdx === raga.index;
            return (
              <button
                key={raga.index}
                className={`${styles.ragaCard} ${isActive ? styles.ragaCardActive : ''}`}
                onClick={() => setSelectedRagaIdx(raga.index)}
              >
                <div className={styles.ragaName}>
                  {raga.name}
                  <span className={styles.ragaNumber}>Raga #{raga.index + 1}</span>
                </div>
                <p className={styles.ragaDesc}>{raga.desc}</p>
              </button>
            );
          })}
        </div>

        {selectedRagaIdx !== null && (
          <div className={`${styles.scaleVisualizerPanel} animate-fade-in`}>
            <div className={styles.visualizerHeader}>
              <div className={styles.visualizerInfo}>
                <div className={styles.visualizerTitle}>
                  Spelled Scale: {rootNote} {RAGAS_EXAMPLES.find(r => r.index === selectedRagaIdx)?.name}
                </div>
                {/* Spelled swaras and notes */}
                <div className={styles.spelledSequence}>
                  {ragaNotes.map((n, i) => (
                    <div key={i} className={styles.sequenceNode}>
                      <span className={styles.nodeSwara}>{n.swara.name}</span>
                      <span className={styles.nodeNote}>{n.noteName}</span>
                    </div>
                  ))}
                  <div className={styles.sequenceNode}>
                    <span className={styles.nodeSwara}>Ṡ</span>
                    <span className={styles.nodeNote}>{rootNote}</span>
                  </div>
                </div>
              </div>

              <button
                className={`${styles.playScaleBtn} ${isPlayingRaga ? styles.stopBtn : styles.playBtn}`}
                onClick={playRaga}
                disabled={isPlayingRaga}
              >
                {isPlayingRaga ? (
                  <>
                    <Square size={16} fill="currentColor" />
                    <span>Playing...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>Play Scale</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

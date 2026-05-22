import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getMidiNumber, parseNote, fromMidiNumber } from '../theory/notes';
import { playNote } from '../theory/audio';
import { SEMITONE_TO_SWARAS } from '../theory/intervals';
import { generateMelakartaNotes, MELAKARTA_NAMES } from '../theory/melakarta';
import { Search, ChevronDown, Volume2, Info } from 'lucide-react';
import styles from './IntervalBuilderView.module.css';

interface ScaleOption {
  value: string;
  label: string;
}

export const IntervalBuilderView: React.FC = () => {
  const [rootNote, setRootNote] = useState<string>('C');
  const [scaleType, setScaleType] = useState<string>('chromatic');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [referenceNoteMidi, setReferenceNoteMidi] = useState<number | null>(null);
  const [playingMidis, setPlayingMidis] = useState<number[]>([]);
  const [playRefFirst, setPlayRefFirst] = useState<boolean>(true);
  const [useLowerOctave, setUseLowerOctave] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const playbackTimeouts = useRef<any[]>([]);
  const stopHandles = useRef<Array<() => void>>([]);

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
    { midi: 71, name: 'B', isBlack: false }
  ], []);

  // Scale dropdown options
  const scaleOptions = useMemo<ScaleOption[]>(() => {
    return [
      { value: 'chromatic', label: 'Chromatic Scale' },
      ...MELAKARTA_NAMES.map((name, idx) => ({
        value: `melakarta_${idx}`,
        label: `Raga #${idx + 1}: ${name}`,
      })),
    ];
  }, []);

  // Filter scale options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return scaleOptions;
    const q = searchQuery.toLowerCase();
    return scaleOptions.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [searchQuery, scaleOptions]);

  // Selected scale label
  const currentScaleLabel = useMemo(() => {
    const found = scaleOptions.find(o => o.value === scaleType);
    return found ? found.label : 'Select Scale...';
  }, [scaleType, scaleOptions]);

  // Handle click outside searchable scale dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate chromatic scale notes relative to current root
  const chromaticNotes = useMemo(() => {
    const parsedRoot = parseNote(`${rootNote}${useLowerOctave ? '3' : '4'}`);
    const rootMidi = getMidiNumber(parsedRoot);
    const notes = [];
    const westernIntervals = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

    for (let semitones = 0; semitones < 12; semitones++) {
      const midi = rootMidi + semitones;
      const spelled = fromMidiNumber(midi, rootNote.includes('b') ? 'b' : '#');
      const noteName = `${spelled.letter}${spelled.accidental}`;
      
      let swaraLabel = '';
      if (semitones === 0) swaraLabel = 'S';
      else {
        const swaras = SEMITONE_TO_SWARAS[semitones];
        swaraLabel = swaras ? swaras.map(s => s.shortName).join('/') : '';
      }

      notes.push({
        midi,
        semitones,
        noteName,
        swaraLabel,
        westernInterval: westernIntervals[semitones],
      });
    }
    return notes;
  }, [rootNote, useLowerOctave]);

  // Generate Melakarta scale notes relative to current root
  const melakartaNotes = useMemo(() => {
    if (!scaleType.startsWith('melakarta_')) return [];
    const ragaIndex = parseInt(scaleType.split('_')[1], 10);
    const rNotes = generateMelakartaNotes(rootNote, ragaIndex, useLowerOctave ? -1 : 0);
    const westernIntervals = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];

    const notes = rNotes.map((rn) => {
      const semitones = rn.swara.semitones;
      return {
        midi: rn.midi,
        semitones,
        noteName: rn.noteName,
        swaraLabel: rn.swara.name,
        westernInterval: westernIntervals[semitones] || 'Interval',
      };
    });

    return notes;
  }, [rootNote, scaleType, useLowerOctave]);

  // Combine into active scale notes list
  const scaleNotes = useMemo(() => {
    return scaleType === 'chromatic' ? chromaticNotes : melakartaNotes;
  }, [scaleType, chromaticNotes, melakartaNotes]);

  // Reset or default reference note when scale or root changes
  useEffect(() => {
    if (scaleNotes.length > 0) {
      setReferenceNoteMidi(scaleNotes[0].midi);
    } else {
      setReferenceNoteMidi(null);
    }
  }, [scaleNotes]);

  const stopCurrentPlayback = () => {
    playbackTimeouts.current.forEach(clearTimeout);
    playbackTimeouts.current = [];
    stopHandles.current.forEach(stop => stop());
    stopHandles.current = [];
    setPlayingMidis([]);
  };

  useEffect(() => {
    return () => {
      stopCurrentPlayback();
    };
  }, [rootNote, scaleType]);

  const playIntervalSequence = (clickedMidi: number) => {
    stopCurrentPlayback();

    if (referenceNoteMidi === null) return;
    const refMidi = referenceNoteMidi;

    // Sequence timing logic:
    // 1. Play first note (400ms)
    // 2. Play second note (400ms)
    // 3. Play both together (800ms)

    const firstMidi = playRefFirst ? refMidi : clickedMidi;
    const secondMidi = playRefFirst ? clickedMidi : refMidi;

    setPlayingMidis([firstMidi]);
    const stop1 = playNote(firstMidi, { durationSec: 0.38 });
    stopHandles.current.push(stop1);

    const t1 = setTimeout(() => {
      stop1();
      setPlayingMidis([secondMidi]);
      const stop2 = playNote(secondMidi, { durationSec: 0.38 });
      stopHandles.current.push(stop2);

      const t2 = setTimeout(() => {
        stop2();
        setPlayingMidis([refMidi, clickedMidi]);
        const stop3a = playNote(refMidi, { durationSec: 0.78 });
        const stop3b = playNote(clickedMidi, { durationSec: 0.78 });
        stopHandles.current.push(stop3a, stop3b);

        const t3 = setTimeout(() => {
          stop3a();
          stop3b();
          setPlayingMidis([]);
        }, 800);
        playbackTimeouts.current.push(t3);

      }, 400);
      playbackTimeouts.current.push(t2);

    }, 400);
    playbackTimeouts.current.push(t1);
  };

  // Keyboard note highlights checking (pitch class mapping to support octaves)
  const isKeyPlaying = (keyMidi: number) => {
    return playingMidis.some(m => (m % 12) === (keyMidi % 12));
  };

  const isKeyReference = (keyMidi: number) => {
    return referenceNoteMidi !== null && (referenceNoteMidi % 12) === (keyMidi % 12);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Interval Builder</h1>
        <p className={styles.subtitle}>
          Compare and train intervals using Western chord naming alongside Carnatic swara tags relative to any scale-relative reference note.
        </p>
      </div>

      <div className={styles.settingsGrid}>
        {/* Root Selector */}
        <div className={styles.settingCard}>
          <div className={styles.settingLabel}>1. Base Transposition Root:</div>
          <div className={styles.rootGrid}>
            {roots.map(note => (
              <button
                key={note}
                className={`${styles.rootBtn} ${rootNote === note ? styles.rootBtnActive : ''}`}
                onClick={() => setRootNote(note)}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Searchable Scale Dropdown */}
        <div className={styles.settingCard}>
          <div className={styles.settingLabel}>2. Select Scale:</div>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              className={styles.dropdownToggle}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span>{currentScaleLabel}</span>
              <ChevronDown size={18} className={styles.chevron} />
            </button>

            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.searchWrapper}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search scale name or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className={styles.optionsList} role="listbox">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => (
                      <button
                        key={opt.value}
                        role="option"
                        aria-selected={scaleType === opt.value}
                        className={`${styles.dropdownOption} ${scaleType === opt.value ? styles.optionActive : ''}`}
                        onClick={() => {
                          setScaleType(opt.value);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        {opt.label}
                      </button>
                    ))
                  ) : (
                    <div className={styles.noResults}>No scales found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reference Note Dropdown */}
        <div className={styles.settingCard}>
          <div className={styles.settingLabel}>3. Reference Note for Training:</div>
          <div className={styles.selectWrapper}>
            <select
              value={referenceNoteMidi || ''}
              onChange={(e) => setReferenceNoteMidi(Number(e.target.value))}
              className={styles.selectInput}
            >
              {scaleNotes.map((note) => (
                <option key={note.midi} value={note.midi}>
                  {note.swaraLabel} ({note.noteName})
                </option>
              ))}
            </select>
            <ChevronDown size={18} className={styles.selectChevron} />
          </div>
        </div>
      </div>

      <div className={`${styles.settingCard} ${styles.slidersCard}`}>
        {/* Playback Order Selector */}
        <div className={styles.sliderControlInline}>
          <div className={styles.sliderLabel}>Playback Order:</div>
          <div className={styles.segmentControl}>
            <div
              className={`${styles.segmentIndicator} ${
                !playRefFirst ? styles.segmentIndicatorRight : ''
              }`}
            />
            <button
              className={`${styles.segmentBtn} ${playRefFirst ? styles.segmentBtnActive : ''}`}
              onClick={() => setPlayRefFirst(true)}
            >
              Ref First
            </button>
            <button
              className={`${styles.segmentBtn} ${!playRefFirst ? styles.segmentBtnActive : ''}`}
              onClick={() => setPlayRefFirst(false)}
            >
              Clicked First
            </button>
          </div>
        </div>

        {/* Octave Selector */}
        <div className={styles.sliderControlInline}>
          <div className={styles.sliderLabel}>Octave Range:</div>
          <div className={styles.segmentControl}>
            <div
              className={`${styles.segmentIndicator} ${
                useLowerOctave ? styles.segmentIndicatorRight : ''
              }`}
            />
            <button
              className={`${styles.segmentBtn} ${!useLowerOctave ? styles.segmentBtnActive : ''}`}
              onClick={() => setUseLowerOctave(false)}
            >
              Normal
            </button>
            <button
              className={`${styles.segmentBtn} ${useLowerOctave ? styles.segmentBtnActive : ''}`}
              onClick={() => setUseLowerOctave(true)}
            >
              Lower
            </button>
          </div>
        </div>
      </div>

      {/* Interval Buttons Panel */}
      <div className={styles.builderPanel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Interval Playground</h2>
          <p className={styles.panelDesc}>
            Click any button below to play the training sequence: Reference note &rarr; Clicked note &rarr; Both together.
          </p>
        </div>

        <div className={styles.intervalGrid}>
          {scaleNotes.map((note) => {
            const isRef = referenceNoteMidi === note.midi;
            const isPlaying = playingMidis.includes(note.midi);
            const semitoneDiff = referenceNoteMidi !== null ? Math.abs(note.midi - referenceNoteMidi) : 0;
            
            return (
              <button
                key={note.midi}
                className={`${styles.intervalBtn} ${isPlaying ? styles.btnPlaying : ''} ${isRef ? styles.btnRef : ''}`}
                onClick={() => playIntervalSequence(note.midi)}
              >
                <div className={styles.btnHeader}>
                  <span className={styles.intervalPrimary}>{note.swaraLabel}</span>
                  <span className={styles.intervalSecondary}>{semitoneDiff}</span>
                </div>
                <div className={styles.btnFooter}>
                  <span className={styles.noteLabel}>{note.noteName}</span>
                  {isRef && <span className={styles.refTag}>REF</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mini Keyboard Visualizer */}
      <div className={styles.pianoSection}>
        <div className={styles.pianoInstructions}>
          <Volume2 size={16} />
          <span>Active interval notes highlight on the piano keyboard during sound sequence</span>
        </div>

        <div className={styles.pianoKeyboard}>
          <div className={styles.keyboardScrollWrapper}>
            {/* White keys */}
            <div className={styles.whiteKeysContainer}>
              {pianoKeys.filter(k => !k.isBlack).map(key => {
                const isPlaying = isKeyPlaying(key.midi);
                const isRef = isKeyReference(key.midi);

                return (
                  <div
                    key={key.midi}
                    className={`${styles.whiteKey} ${isPlaying ? styles.keyPlaying : ''} ${isRef ? styles.keyReference : ''}`}
                  >
                    <span className={styles.pianoNoteName}>{key.name}</span>
                    {isRef && <span className={styles.refIndicator}>REF</span>}
                  </div>
                );
              })}
            </div>

            {/* Black keys */}
            <div className={styles.blackKeysContainer}>
              {pianoKeys.map((key) => {
                if (!key.isBlack) return null;
                const isPlaying = isKeyPlaying(key.midi);
                const isRef = isKeyReference(key.midi);

                let leftPercent = 0;
                if (key.name === 'C#') leftPercent = 8.8;
                else if (key.name === 'D#') leftPercent = 23.0;
                else if (key.name === 'F#') leftPercent = 51.5;
                else if (key.name === 'G#') leftPercent = 65.8;
                else if (key.name === 'A#') leftPercent = 80.0;

                return (
                  <div
                    key={key.midi}
                    style={{ left: `${leftPercent}%` }}
                    className={`${styles.blackKey} ${isPlaying ? styles.keyPlaying : ''} ${isRef ? styles.keyReference : ''}`}
                  >
                    <span className={styles.pianoNoteName}>{key.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Info Card */}
      <div className={styles.infoCard}>
        <div className={styles.infoTitle}>
          <Info size={16} />
          <span>How Interval Training Works</span>
        </div>
        <p className={styles.infoDesc}>
          Interval training helps you develop relative pitch. By playing the reference note (typically Shadjam / S) followed by the target note, your ear registers the specific frequency gap. Finally, hearing both notes together solidifies the consonant or dissonant quality of the interval in your brain.
        </p>
      </div>
    </div>
  );
};

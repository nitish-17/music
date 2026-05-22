import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import {
  CHAKRA_NAMES,
  MELAKARTA_NAMES,
  generateMelakartaNotes,
} from '../theory/melakarta';
import { Play, Square, Search, Volume2, ChevronDown, ChevronUp, ChevronsUpDown, ChevronsDownUp, Info } from 'lucide-react';
import styles from './ScalesView.module.css';

const WESTERN_MODE_MAPPINGS: Record<string, string[]> = {
  // Diatonic Modes
  '2212221': ['Major Scale', 'Ionian Mode'],
  '2122212': ['Dorian Mode'],
  '1222122': ['Phrygian Mode'],
  '2221221': ['Lydian Mode'],
  '2212212': ['Mixolydian Mode'],
  '2122122': ['Natural Minor Scale', 'Aeolian Mode'],

  // Melodic Minor Modes
  '2122221': ['Melodic Minor Scale (Jazz Minor)'],
  '1222212': ['Dorian b2 Mode', 'Phrygian Natural 6 Mode'],
  '2221212': ['Lydian Dominant Mode', 'Acoustic Scale', 'Overtone Scale'],
  '2212122': ['Mixolydian b6 Mode', 'Melodic Major Scale', 'Aeolian Dominant Scale'],

  // Harmonic Minor Modes
  '2122131': ['Harmonic Minor Scale'],
  '2131212': ['Dorian #4 Mode', 'Ukrainian Dorian Scale', 'Romanian Minor Scale'],
  '1312122': ['Phrygian Dominant Mode', 'Spanish Gypsy Scale', 'Jewish Scale'],
  '3121221': ['Lydian #2 Mode'],

  // Harmonic Major Modes
  '2212131': ['Harmonic Major Scale'],
  '2131221': ['Lydian b3 Mode', 'Lydian Minor Scale', 'Harmonic Major Mode 4'],
  '1312212': ['Mixolydian b2 Mode', 'Mixolydian b9 Mode', 'Dominant b2 Mode'],

  // Double Harmonic Major Modes
  '1312131': ['Double Harmonic Major Scale', 'Byzantine Scale', 'Arabic Scale', 'Gypsy Major Scale'],
  '3121311': ['Lydian #2 #6 Mode'],
  '2131131': ['Double Harmonic Minor Scale', 'Hungarian Minor Scale', 'Gypsy Minor Scale'],

  // Hungarian Major Modes
  '3121212': ['Hungarian Major Scale'],
  '1231212': ['Dorian #4 b2 Mode', 'Phrygian #4 n6 Mode', 'Dorian b9 #11 Mode'],

  // Neapolitan Minor Modes
  '1222131': ['Neapolitan Minor Scale'],
  '2221311': ['Lydian #6 Mode', 'Neapolitan Minor Mode 2'],
  '2131122': ['Aeolian #4 Mode', 'Neapolitan Minor Mode 4'],
  '3112221': ['Ionian #2 Mode', 'Neapolitan Minor Mode 6'],

  // Neapolitan Major Modes
  '1222221': ['Neapolitan Major Scale'],
  '2221122': ['Lydian Minor Scale', 'Lydian b6 b7 Scale', 'Neapolitan Major Mode 4'],

  // Ionian b5 Modes
  '1321221': ['Lydian b2 Mode', 'Lydian b9 Mode', 'Ionian b5 Mode 4'],
  '2122113': ['Aeolian bb7 Mode', 'Aeolian Double Flat 7 Mode', 'Ionian b5 Mode 6'],
  '1132122': ['Phrygian bb3 Mode', 'Ionian b5 Mode 3'],

  // Ionian b2 Modes
  '1222113': ['Phrygian bb7 Mode', 'Ionian b2 Mode 3'],
  '1312221': ['Ionian b2 Mode', 'Major b2 Scale'],
  '2221131': ['Lydian b6 Scale', 'Lydian Harmonic Major Scale', 'Ionian b2 Mode 4'],

  // Double Harmonic Lydian Modes
  '1321131': ['Double Harmonic Lydian Scale', 'Chromatic Hypolydian Scale'],
  '1132113': ['Chromatic Dorian Mode', 'Double Harmonic Lydian Mode 7'],

  // Romanian Major Modes
  '1321212': ['Romanian Major Scale', 'Lydian Dominant b2 Mode'],

  // Chromatic Lydian Inverse / Maqam Athar Kurd Modes
  '1231131': ['Chromatic Lydian Inverse Scale', 'Maqam Athar Kurd'],
  '3112311': ['Chromatic Phrygian Mode']
};

const SWARA_TO_WESTERN_INTERVAL: Record<string, string> = {
  S: 'P1',
  R1: 'm2',
  R2: 'M2',
  R3: 'm3',
  G1: 'M2',
  G2: 'm3',
  G3: 'M3',
  M1: 'P4',
  M2: 'A4',
  P: 'P5',
  D1: 'm6',
  D2: 'M6',
  D3: 'm7',
  N1: 'M6',
  N2: 'm7',
  N3: 'M7'
};

const SWARA_GLOSSARY = [
  { swara: 'S', name: 'Shadjam', semitones: 0, interval: 'Perfect Unison (P1)' },
  { swara: 'R1', name: 'Shuddha Rishabham', semitones: 1, interval: 'Minor 2nd (m2)' },
  { swara: 'R2 / G1', name: 'Chatushruti Rishabham / Shuddha Gandharam', semitones: 2, interval: 'Major 2nd (M2)' },
  { swara: 'R3 / G2', name: 'Shatshruti Rishabham / Sadharana Gandharam', semitones: 3, interval: 'Minor 3rd (m3)' },
  { swara: 'G3', name: 'Antara Gandharam', semitones: 4, interval: 'Major 3rd (M3)' },
  { swara: 'M1', name: 'Shuddha Madhyamam', semitones: 5, interval: 'Perfect 4th (P4)' },
  { swara: 'M2', name: 'Prati Madhyamam', semitones: 6, interval: 'Augmented 4th / Tritone (A4)' },
  { swara: 'P', name: 'Panchamam', semitones: 7, interval: 'Perfect 5th (P5)' },
  { swara: 'D1', name: 'Shuddha Dhaivatam', semitones: 8, interval: 'Minor 6th (m6)' },
  { swara: 'D2 / N1', name: 'Chatushruti Dhaivatam / Shuddha Nishadam', semitones: 9, interval: 'Major 6th (M6)' },
  { swara: 'D3 / N2', name: 'Shatshruti Dhaivatam / Kaisiki Nishadam', semitones: 10, interval: 'Minor 7th (m7)' },
  { swara: 'N3', name: 'Kakali Nishadam', semitones: 11, interval: 'Major 7th (M7)' }
];

export const ScalesView: React.FC = () => {
  const {
    rootNote,
    isPlaying,
    currentPlayingNoteIndex,
    currentPlayingRagaIndex,
    setRootNote,
    playMelakartaScale,
    stopScale,
    playSingleNote,
    isOctaveLower,
    setIsOctaveLower,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [groupMode, setGroupMode] = useState<'chakra' | 'sruti_bhedam'>('chakra');
  const [collapsedChakras, setCollapsedChakras] = useState<Record<number, boolean>>({});
  const [collapsedSrutiGroups, setCollapsedSrutiGroups] = useState<Record<number, boolean>>({});
  const [isTheoryExpanded, setIsTheoryExpanded] = useState(false);

  const roots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  const toggleChakra = (chakraIdx: number) => {
    setCollapsedChakras((prev) => ({
      ...prev,
      [chakraIdx]: !prev[chakraIdx],
    }));
  };

  const toggleSrutiGroup = (groupId: number) => {
    setCollapsedSrutiGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleExpandAll = () => {
    if (groupMode === 'chakra') {
      setCollapsedChakras({});
    } else {
      setCollapsedSrutiGroups({});
    }
  };

  const handleCollapseAll = () => {
    if (groupMode === 'chakra') {
      const collapsed: Record<number, boolean> = {};
      for (let i = 0; i < 12; i++) {
        collapsed[i] = true;
      }
      setCollapsedChakras(collapsed);
    } else {
      const collapsed: Record<number, boolean> = {};
      srutiBhedamGroups.forEach((g) => {
        collapsed[g.id] = true;
      });
      setCollapsedSrutiGroups(collapsed);
    }
  };

  // Precompute Chakra groups
  const chakras = useMemo(() => {
    return Array.from({ length: 12 }, (_, chakraIdx) => {
      const name = CHAKRA_NAMES[chakraIdx];
      const ragas = Array.from({ length: 6 }, (_, i) => {
        const ragaIndex = chakraIdx * 6 + i;
        return {
          index: ragaIndex,
          number: ragaIndex + 1,
          name: MELAKARTA_NAMES[ragaIndex],
        };
      });
      return {
        chakraIdx,
        number: chakraIdx + 1,
        name,
        ragas,
      };
    });
  }, []);

  // Precompute Sruti Bhedam groups
  const srutiBhedamGroups = useMemo(() => {
    const getRotations = (formula: string) => {
      const rotations = [];
      for (let i = 0; i < 7; i++) {
        rotations.push(formula.substring(i) + formula.substring(0, i));
      }
      return rotations;
    };

    const getCanonicalFormula = (formula: string) => {
      const rotations = getRotations(formula);
      rotations.sort();
      return rotations[0];
    };

    const ragas = Array.from({ length: 72 }, (_, index) => {
      const ragaNotes = generateMelakartaNotes('C', index);
      const steps = [];
      for (let i = 0; i < 6; i++) {
        steps.push(ragaNotes[i + 1].swara.semitones - ragaNotes[i].swara.semitones);
      }
      steps.push(12 - ragaNotes[6].swara.semitones);
      const formula = steps.join('');

      return {
        index,
        number: index + 1,
        name: MELAKARTA_NAMES[index],
        formula,
      };
    });

    const groupsMap: Record<string, typeof ragas> = {};
    ragas.forEach((raga) => {
      const canon = getCanonicalFormula(raga.formula);
      if (!groupsMap[canon]) {
        groupsMap[canon] = [];
      }
      groupsMap[canon].push(raga);
    });

    const allGroups = Object.keys(groupsMap).map((canon) => {
      return {
        canonical: canon,
        ragas: groupsMap[canon],
      };
    });

    const multiItemGroups = allGroups.filter((g) => g.ragas.length > 1);
    const singleItemGroups = allGroups.filter((g) => g.ragas.length === 1);

    multiItemGroups.sort((a, b) => b.ragas.length - a.ragas.length);

    const combinedSingleRagas = singleItemGroups.flatMap((g) => g.ragas);
    combinedSingleRagas.sort((a, b) => a.number - b.number);

    const finalGroups = multiItemGroups.map((g, idx) => ({
      id: idx + 1,
      name: `Group ${idx + 1}`,
      size: g.ragas.length,
      canonical: g.canonical,
      ragas: g.ragas,
      isCombined: false,
    }));

    if (combinedSingleRagas.length > 0) {
      finalGroups.push({
        id: 21,
        name: 'Group 21',
        size: combinedSingleRagas.length,
        canonical: 'Unique Patterns',
        ragas: combinedSingleRagas,
        isCombined: true,
      });
    }

    return finalGroups;
  }, []);

  const filteredRagas = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    return Array.from({ length: 72 }, (_, index) => {
      const ragaNumber = index + 1;
      const ragaName = MELAKARTA_NAMES[index];
      const chakraIdx = Math.floor(index / 6);
      const chakraName = CHAKRA_NAMES[chakraIdx];

      const ragaNotes = generateMelakartaNotes('C', index);
      const steps = [];
      for (let i = 0; i < 6; i++) {
        steps.push(ragaNotes[i + 1].swara.semitones - ragaNotes[i].swara.semitones);
      }
      steps.push(12 - ragaNotes[6].swara.semitones);
      const formula = steps.join('');

      return {
        index,
        number: ragaNumber,
        name: ragaName,
        chakraNumber: chakraIdx + 1,
        chakraName,
        formula,
      };
    }).filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.number.toString() === q ||
        r.chakraName.toLowerCase().includes(q) ||
        r.formula.includes(q) ||
        (WESTERN_MODE_MAPPINGS[r.formula] || []).some((name) =>
          name.toLowerCase().includes(q)
        )
    );
  }, [searchQuery]);

  const handleRootClick = (root: string) => {
    stopScale();
    setRootNote(root);
  };

  const handlePlayClick = (ragaIndex: number) => {
    if (isPlaying && currentPlayingRagaIndex === ragaIndex) {
      stopScale();
    } else {
      playMelakartaScale(ragaIndex, rootNote);
    }
  };

  const renderRagaCard = (ragaIndex: number, ragaName: string, ragaNumber: number) => {
    const isRagaPlaying = isPlaying && currentPlayingRagaIndex === ragaIndex;
    const ragaNotes = generateMelakartaNotes(rootNote, ragaIndex, isOctaveLower ? -1 : 0);

    const steps = [];
    for (let i = 0; i < 6; i++) {
      steps.push(ragaNotes[i + 1].swara.semitones - ragaNotes[i].swara.semitones);
    }
    steps.push(12 - ragaNotes[6].swara.semitones);
    const stepFormula = steps.join('');

    const highShadjaMidi = ragaNotes[0].midi + 12;
    const highShadjaOctave = (ragaNotes[0].note.octave || 4) + 1;
    const allEightNotes = [
      ...ragaNotes,
      {
        swara: { name: 'S', semitones: 12, letterOffset: 7 },
        noteName: ragaNotes[0].noteName,
        note: { ...ragaNotes[0].note, octave: highShadjaOctave },
        midi: highShadjaMidi,
      },
    ];

    const westernNames = WESTERN_MODE_MAPPINGS[stepFormula];

    return (
      <div
        key={ragaIndex}
        className={`${styles.ragaCard} ${isRagaPlaying ? styles.ragaCardPlaying : ''}`}
      >
        <div className={styles.ragaHeader}>
          <div className={styles.ragaTitleInfo}>
            <div className={styles.ragaMainTitleRow}>
              <span className={styles.ragaNumberBadge}>#{ragaNumber}</span>
              <h3 className={styles.ragaName}>
                {ragaName} <span className={styles.stepFormula}>{stepFormula}</span>
              </h3>
            </div>
            {westernNames && (
              <div className={styles.westernModes} title="Equivalent Western Scale / Mode">
                {westernNames.join(' / ')}
              </div>
            )}
          </div>
          <button
            className={`${styles.playBtn} ${isRagaPlaying ? styles.stopBtn : ''}`}
            onClick={() => handlePlayClick(ragaIndex)}
            aria-label={isRagaPlaying ? `Stop ${ragaName}` : `Play ${ragaName}`}
          >
            {isRagaPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </button>
        </div>

        <div className={styles.swaraSequence}>
          {allEightNotes.map((noteItem, noteIdx) => {
            const isNoteActive = isRagaPlaying && currentPlayingNoteIndex === noteIdx;
            const isHighOctave = noteIdx === 7;
            const swaraLabel = isHighOctave ? 'Ṡ' : noteItem.swara.name;
            const westernIntervalName = isHighOctave ? 'P8' : (SWARA_TO_WESTERN_INTERVAL[noteItem.swara.name] || '');

            return (
              <button
                key={noteIdx}
                className={`${styles.swaraNode} ${isNoteActive ? styles.swaraNodeActive : ''}`}
                onClick={() => playSingleNote(noteItem.midi)}
                title={`Click to play: ${noteItem.noteName}${noteItem.note.octave || ''} (Swara: ${noteItem.swara.name}, Interval: ${westernIntervalName})`}
              >
                <span className={styles.swaraLabel}>{swaraLabel}</span>
                <span className={styles.westernLabel}>
                  {noteItem.noteName}
                  <sub className={styles.octaveSub}>{noteItem.note.octave}</sub>
                </span>
                <span className={styles.intervalLabel}>{westernIntervalName}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.container} animate-fade-in`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Scales Playground (Melakarta Ragas)</h1>
        <p className={styles.subtitle}>
          Explore the 72 fundamental parent scales (sampoorna ragas) of Carnatic music. Transpose them to any Western root key, see their swara structures side-by-side with Western intervals, and play their notes.
        </p>
      </div>

      {/* Educational Panel */}
      <div className={styles.eduCard}>
        <button
          className={styles.eduHeader}
          onClick={() => setIsTheoryExpanded(!isTheoryExpanded)}
          aria-expanded={isTheoryExpanded}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} className={styles.eduIcon} />
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
              Understanding Carnatic Swaras & Western Intervals
            </span>
          </div>
          {isTheoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isTheoryExpanded && (
          <div className={styles.eduContent}>
            <p className={styles.eduText}>
              In Carnatic music, the 12 semitones of an octave are represented by <strong>7 core notes (Swaras)</strong>: Shadjam (S), Rishabham (R), Gandharam (G), Madhyamam (M), Panchamam (P), Dhaivata (D), and Nishada (N). 
              To allow distinct naming for all 7-note parent scales (Melakarta Ragas), several swaras have overlapping pitches (enharmonics). This results in <strong>16 distinct swara variants</strong> mapped to the 12 semitones:
            </p>
            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <div>Swara</div>
                <div>Carnatic Name</div>
                <div>Semitone Gap</div>
                <div>Western Interval</div>
              </div>
              {SWARA_GLOSSARY.map((row) => (
                <div key={row.swara} className={styles.tableRow}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{row.swara}</div>
                  <div style={{ color: 'var(--text-main)' }}>{row.name}</div>
                  <div>+{row.semitones} semitones</div>
                  <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{row.interval}</div>
                </div>
              ))}
            </div>
            <p className={styles.eduText} style={{ marginTop: '12px' }}>
              <strong>Melakarta Scale Construction:</strong> Every Melakarta raga contains exactly 7 notes (S, P, and one variant each of R, G, M, D, N) ascending and descending. They are split into two halves (tetrachords): the Purvanga (S-R-G-M) and the Uttaranga (P-D-N-Ṡ).
            </p>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className={styles.controlPanel}>
        <div className={styles.controlGroup}>
          <div className={styles.rootPitchHeader}>
            <h2 className={styles.controlTitle}>Root Pitch Transposition</h2>
            <label className={styles.octaveCheckboxLabel}>
              <input
                type="checkbox"
                checked={isOctaveLower}
                onChange={(e) => setIsOctaveLower(e.target.checked)}
                className={styles.octaveCheckbox}
              />
              <span className={styles.octaveSwitch} />
              <span>1 Octave Lower</span>
            </label>
          </div>
          <div className={styles.rootsGrid}>
            {roots.map((root) => {
              const isActive = rootNote === root;
              return (
                <button
                  key={root}
                  className={`${styles.rootBtn} ${isActive ? styles.rootBtnActive : ''}`}
                  onClick={() => handleRootClick(root)}
                >
                  {root}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.searchGroup}>
          <h2 className={styles.controlTitle}>Search Ragas</h2>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Search by name, number, step formula, or Western equivalent..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Info indicator, grouping switcher & expand/collapse actions */}
      <div className={styles.infoActionRow}>
        <div className={styles.helpText}>
          <Volume2 size={14} className={styles.helpIcon} />
          <span>Click swara to play note</span>
        </div>

        <div className={styles.segmentControl}>
          <div
            className={`${styles.segmentIndicator} ${
              groupMode === 'sruti_bhedam' ? styles.segmentIndicatorRight : ''
            }`}
          />
          <button
            className={`${styles.segmentBtn} ${groupMode === 'chakra' ? styles.segmentBtnActive : ''}`}
            onClick={() => setGroupMode('chakra')}
          >
            Chakras
          </button>
          <button
            className={`${styles.segmentBtn} ${groupMode === 'sruti_bhedam' ? styles.segmentBtnActive : ''}`}
            onClick={() => setGroupMode('sruti_bhedam')}
          >
            Sruti Bhedam
          </button>
        </div>

        <div className={styles.actionGroup}>
          {filteredRagas === null && (
            <>
              <button
                className={styles.actionBtn}
                onClick={handleExpandAll}
                title="Expand All"
                aria-label="Expand All"
              >
                <ChevronsUpDown size={14} />
              </button>
              <button
                className={styles.actionBtn}
                onClick={handleCollapseAll}
                title="Collapse All"
                aria-label="Collapse All"
              >
                <ChevronsDownUp size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className={styles.ragasListContainer}>
        {filteredRagas !== null ? (
          <div className={styles.searchResultsSection}>
            <h2 className={styles.sectionHeading}>
              Search Results ({filteredRagas.length} found)
            </h2>
            {filteredRagas.length > 0 ? (
              <div className={styles.ragasGrid}>
                {filteredRagas.map((r) => renderRagaCard(r.index, r.name, r.number))}
              </div>
            ) : (
              <div className={styles.emptyResults}>
                No ragas found matching your query "{searchQuery}".
              </div>
            )}
          </div>
        ) : groupMode === 'chakra' ? (
          chakras.map((chakra) => {
            const isCollapsed = !!collapsedChakras[chakra.chakraIdx];
            const isChakraM2 = chakra.number > 6;

            return (
              <div key={chakra.chakraIdx} className={styles.chakraGroup}>
                <button
                  className={styles.chakraHeader}
                  onClick={() => toggleChakra(chakra.chakraIdx)}
                  aria-expanded={!isCollapsed}
                >
                  <div className={styles.chakraHeaderInfo}>
                    <span className={styles.chakraBadge}>Chakra {chakra.number}</span>
                    <h2 className={styles.chakraName}>
                      {chakra.name}
                      <span className={styles.chakraTypeDesc}>
                        ({isChakraM2 ? 'Prati Madhyama - M2' : 'Shuddha Madhyama - M1'})
                      </span>
                    </h2>
                  </div>
                  {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>

                {!isCollapsed && (
                  <div className={`${styles.ragasGrid} animate-fade-in`}>
                    {chakra.ragas.map((raga) =>
                      renderRagaCard(raga.index, raga.name, raga.number)
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          srutiBhedamGroups.map((group) => {
            const isCollapsed = !!collapsedSrutiGroups[group.id];

            return (
              <div key={group.id} className={styles.chakraGroup}>
                <button
                  className={styles.chakraHeader}
                  onClick={() => toggleSrutiGroup(group.id)}
                  aria-expanded={!isCollapsed}
                >
                  <div className={styles.chakraHeaderInfo}>
                    <h2 className={styles.chakraName}>
                      <span className={styles.srutiGroupName}>{group.name}</span>
                      <span className={styles.chakraTypeDesc}>
                        ({group.size} raga{group.size > 1 ? 's' : ''})
                      </span>
                    </h2>
                  </div>
                  {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>

                {!isCollapsed && (
                  <div className={`${styles.ragasGrid} animate-fade-in`}>
                    {group.ragas.map((raga) =>
                      renderRagaCard(raga.index, raga.name, raga.number)
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import { create } from 'zustand';
import { generateScale } from '../theory/scales';
import type { ScaleNote } from '../theory/scales';
import { playNote } from '../theory/audio';
import { generateMelakartaNotes } from '../theory/melakarta';

export type ViewType = 'scales' | 'explore' | 'builder' | 'quiz';

export interface QuizConfig {
  majorMinor: boolean;
  modes: boolean;
  pentatonic: boolean;
  melakarta: boolean;
}

interface StoreState {
  currentView: ViewType;
  rootNote: string;
  scaleType: string;
  isPlaying: boolean;
  currentPlayingNoteIndex: number | null;
  currentPlayingRagaIndex: number | null;
  isOctaveLower: boolean;
  
  // Quiz State
  quizRoot: string;
  quizScaleType: string;
  quizNotes: ScaleNote[];
  quizCurrentIndex: number;
  quizStatus: 'idle' | 'playing' | 'completed';
  quizFeedback: { success: boolean; message: string } | null;
  quizConfig: QuizConfig;

  // Actions
  setView: (view: ViewType) => void;
  setRootNote: (note: string) => void;
  setScaleType: (type: string) => void;
  setIsOctaveLower: (val: boolean) => void;
  playCurrentScale: () => void;
  playMelakartaScale: (ragaIndex: number, rootNote: string) => void;
  stopScale: () => void;
  playSingleNote: (midi: number) => void;

  // Quiz Actions
  setQuizConfig: (config: Partial<QuizConfig>) => void;
  startNewQuiz: () => void;
  submitQuizNote: (noteName: string) => void;
}

// Module-level variables to hold playback references outside of React rendering cycle
let playbackTimeoutId: any = null;
let activeStopHandle: (() => void) | null = null;

export const useStore = create<StoreState>((set, get) => ({
  currentView: 'scales',
  rootNote: 'C',
  scaleType: 'major',
  isPlaying: false,
  currentPlayingNoteIndex: null,
  currentPlayingRagaIndex: null,
  isOctaveLower: false,

  // Quiz initial state
  quizRoot: 'C',
  quizScaleType: 'major',
  quizNotes: [],
  quizCurrentIndex: 0,
  quizStatus: 'idle',
  quizFeedback: null,
  quizConfig: {
    majorMinor: true,
    modes: false,
    pentatonic: true,
    melakarta: false,
  },

  setView: (view) => set({ currentView: view }),
  setRootNote: (note) => {
    get().stopScale();
    set({ rootNote: note });
  },
  setScaleType: (type) => {
    get().stopScale();
    set({ scaleType: type });
  },
  setIsOctaveLower: (val) => {
    get().stopScale();
    set({ isOctaveLower: val });
  },

  playSingleNote: (midi) => {
    playNote(midi, { durationSec: 0.5 });
  },

  playCurrentScale: () => {
    const { rootNote, scaleType, isPlaying, stopScale } = get();
    if (isPlaying) {
      stopScale();
    }

    if (scaleType.startsWith('melakarta_')) {
      const ragaIndex = parseInt(scaleType.split('_')[1], 10);
      get().playMelakartaScale(ragaIndex, rootNote);
      return;
    }

    const scaleNotes = generateScale(rootNote, scaleType);
    if (scaleNotes.length === 0) return;

    set({ isPlaying: true, currentPlayingNoteIndex: 0 });

    const noteDuration = 0.5; // seconds
    const intervalMs = 600; // time between notes

    const playNext = (index: number) => {
      if (index >= scaleNotes.length) {
        // Finished playing the scale notes. Now let's play the root note one octave higher to resolve it nicely
        const root = scaleNotes[0];
        const octaveRootMidi = root.midi + 12;
        
        set({ currentPlayingNoteIndex: null }); // Highlight none or custom state
        
        activeStopHandle = playNote(octaveRootMidi, { durationSec: 0.8 });
        
        playbackTimeoutId = setTimeout(() => {
          set({ isPlaying: false, currentPlayingNoteIndex: null });
        }, 800);
        return;
      }

      set({ currentPlayingNoteIndex: index });
      
      const currentNote = scaleNotes[index];
      activeStopHandle = playNote(currentNote.midi, { durationSec: noteDuration });

      playbackTimeoutId = setTimeout(() => {
        playNext(index + 1);
      }, intervalMs);
    };

    playNext(0);
  },

  playMelakartaScale: (ragaIndex, rootNote) => {
    const { isPlaying, stopScale, isOctaveLower } = get();
    if (isPlaying) {
      stopScale();
    }

    const ragaNotes = generateMelakartaNotes(rootNote, ragaIndex, isOctaveLower ? -1 : 0);
    if (ragaNotes.length === 0) return;

    set({ isPlaying: true, currentPlayingRagaIndex: ragaIndex, currentPlayingNoteIndex: 0 });

    // S, R, G, M, P, D, N, S_high, S_high, N, D, P, M, G, R, S
    const midiSequence = [
      ragaNotes[0].midi,
      ragaNotes[1].midi,
      ragaNotes[2].midi,
      ragaNotes[3].midi,
      ragaNotes[4].midi,
      ragaNotes[5].midi,
      ragaNotes[6].midi,
      ragaNotes[0].midi + 12, // High Shadja (ascending end)
      ragaNotes[0].midi + 12, // High Shadja (descending start)
      ragaNotes[6].midi,
      ragaNotes[5].midi,
      ragaNotes[4].midi,
      ragaNotes[3].midi,
      ragaNotes[2].midi,
      ragaNotes[1].midi,
      ragaNotes[0].midi,
    ];

    const noteDuration = 0.45; // seconds
    const intervalMs = 500; // time between notes

    const playNext = (step: number) => {
      if (step >= midiSequence.length) {
        set({ isPlaying: false, currentPlayingNoteIndex: null, currentPlayingRagaIndex: null });
        return;
      }

      // Map play sequence step back to scale index (0 to 7) for visual highlights:
      // 0->0, 1->1, 2->2, 3->3, 4->4, 5->5, 6->6, 7->7 (High S), 8->7 (High S), 9->6, 10->5, 11->4, 12->3, 13->2, 14->1, 15->0
      const visualIndex = step < 8 ? step : 15 - step;
      set({ currentPlayingNoteIndex: visualIndex });

      activeStopHandle = playNote(midiSequence[step], { durationSec: noteDuration });

      playbackTimeoutId = setTimeout(() => {
        playNext(step + 1);
      }, intervalMs);
    };

    playNext(0);
  },

  stopScale: () => {
    if (playbackTimeoutId) {
      clearTimeout(playbackTimeoutId);
      playbackTimeoutId = null;
    }
    if (activeStopHandle) {
      activeStopHandle();
      activeStopHandle = null;
    }
    set({ isPlaying: false, currentPlayingNoteIndex: null, currentPlayingRagaIndex: null });
  },

  setQuizConfig: (config) => {
    set((state) => ({
      quizConfig: { ...state.quizConfig, ...config },
    }));
  },

  // Quiz Logic
  startNewQuiz: () => {
    const { quizConfig } = get();
    const roots = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    const formulas: string[] = [];
    if (quizConfig.majorMinor) {
      formulas.push('major', 'natural_minor', 'harmonic_minor', 'melodic_minor');
    }
    if (quizConfig.modes) {
      formulas.push('dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian');
    }
    if (quizConfig.pentatonic) {
      formulas.push('major_pentatonic', 'minor_pentatonic', 'blues');
    }

    const includeMelakarta = quizConfig.melakarta;
    const seed = Date.now() ^ Math.floor(Math.random() * 1000000);
    const randomRoot = roots[seed % roots.length];

    let randomType = '';
    let quizNotes: ScaleNote[] = [];

    const totalOptions = formulas.length + (includeMelakarta ? 12 : 0);
    const chooseMelakarta = includeMelakarta && (formulas.length === 0 || (seed % totalOptions) >= formulas.length);

    if (chooseMelakarta) {
      const ragaIndex = (seed >> 2) % 72;
      randomType = `melakarta_${ragaIndex}`;
      const ragaNotes = generateMelakartaNotes(randomRoot, ragaIndex);
      quizNotes = ragaNotes.map((rn) => ({
        note: rn.note,
        step: {
          semitones: rn.swara.semitones,
          letterOffset: rn.swara.letterOffset,
          intervalName: rn.swara.name,
        },
        noteName: rn.noteName,
        noteNameWithOctave: `${rn.noteName}${rn.note.octave}`,
        midi: rn.midi,
      }));
    } else {
      const activeFormulas = formulas.length > 0 ? formulas : ['major', 'natural_minor'];
      randomType = activeFormulas[seed % activeFormulas.length];
      quizNotes = generateScale(randomRoot, randomType);
    }

    set({
      quizRoot: randomRoot,
      quizScaleType: randomType,
      quizNotes,
      quizCurrentIndex: 0,
      quizStatus: 'playing',
      quizFeedback: null,
    });
  },

  submitQuizNote: (noteName: string) => {
    const { quizNotes, quizCurrentIndex, quizStatus, quizScaleType } = get();
    if (quizStatus !== 'playing') return;

    const expectedNote = quizNotes[quizCurrentIndex];
    const isMelakarta = quizScaleType.startsWith('melakarta_');

    let isCorrect = false;

    if (isMelakarta) {
      const expectedSwara = expectedNote.step.intervalName;
      const normInput = noteName === 'Ṡ' || noteName === 'S' ? 'S' : noteName;
      const normExpected = expectedSwara === 'Ṡ' || expectedSwara === 'S' ? 'S' : expectedSwara;
      isCorrect = normInput === normExpected;
    } else {
      const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
      
      let clickedPitchClass = -1;
      const sharpsIdx = sharps.indexOf(noteName);
      const flatsIdx = flats.indexOf(noteName);
      if (sharpsIdx !== -1) clickedPitchClass = sharpsIdx;
      else if (flatsIdx !== -1) clickedPitchClass = flatsIdx;

      const expectedPitchClass = expectedNote.note.pitchClass;
      isCorrect = clickedPitchClass === expectedPitchClass;
    }

    if (isCorrect) {
      playNote(expectedNote.midi, { durationSec: 0.4 });

      if (quizCurrentIndex + 1 >= quizNotes.length) {
        set({
          quizCurrentIndex: quizCurrentIndex + 1,
          quizStatus: 'completed',
          quizFeedback: { success: true, message: 'Congratulations! You completed the scale!' },
        });
      } else {
        set({
          quizCurrentIndex: quizCurrentIndex + 1,
          quizFeedback: { success: true, message: 'Correct note!' },
        });
      }
    } else {
      playNote(48, { durationSec: 0.25, volume: 0.15, type: 'sawtooth' });
      set({
        quizFeedback: { success: false, message: `Oops! That's not the right note. Try again.` },
      });
    }
  },
}));

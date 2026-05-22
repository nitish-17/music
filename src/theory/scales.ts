import { LETTERS, parseNote, spellNote } from './notes';
import type { Note } from './notes';

export interface ScaleStep {
  semitones: number;
  letterOffset: number;
  intervalName: string;
}

export interface ScaleFormula {
  id: string;
  name: string;
  description: string;
  steps: ScaleStep[];
}

export const SCALE_FORMULAS: Record<string, ScaleFormula> = {
  major: {
    id: 'major',
    name: 'Major (Ionian)',
    description: 'The standard happy-sounding scale of Western music. 7 notes.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 2, letterOffset: 1, intervalName: 'M2' },
      { semitones: 4, letterOffset: 2, intervalName: 'M3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 9, letterOffset: 5, intervalName: 'M6' },
      { semitones: 11, letterOffset: 6, intervalName: 'M7' },
    ],
  },
  natural_minor: {
    id: 'natural_minor',
    name: 'Natural Minor (Aeolian)',
    description: 'Standard natural minor scale. Sad or contemplative sound. 7 notes.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 2, letterOffset: 1, intervalName: 'M2' },
      { semitones: 3, letterOffset: 2, intervalName: 'm3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 8, letterOffset: 5, intervalName: 'm6' },
      { semitones: 10, letterOffset: 6, intervalName: 'm7' },
    ],
  },
  harmonic_minor: {
    id: 'harmonic_minor',
    name: 'Harmonic Minor',
    description: 'Minor scale with a raised 7th degree, creating an exotic, classical sound.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 2, letterOffset: 1, intervalName: 'M2' },
      { semitones: 3, letterOffset: 2, intervalName: 'm3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 8, letterOffset: 5, intervalName: 'm6' },
      { semitones: 11, letterOffset: 6, intervalName: 'M7' },
    ],
  },
  melodic_minor: {
    id: 'melodic_minor',
    name: 'Melodic Minor (Ascending)',
    description: 'Minor scale with raised 6th and 7th degrees, commonly used in jazz.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 2, letterOffset: 1, intervalName: 'M2' },
      { semitones: 3, letterOffset: 2, intervalName: 'm3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 9, letterOffset: 5, intervalName: 'M6' },
      { semitones: 11, letterOffset: 6, intervalName: 'M7' },
    ],
  },
  dorian: {
    id: 'dorian',
    name: 'Dorian Mode',
    description: 'Minor scale with a major 6th. Popular in jazz, folk, and medieval music.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 2, letterOffset: 1, intervalName: 'M2' },
      { semitones: 3, letterOffset: 2, intervalName: 'm3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 9, letterOffset: 5, intervalName: 'M6' },
      { semitones: 10, letterOffset: 6, intervalName: 'm7' },
    ],
  },
  phrygian: {
    id: 'phrygian',
    name: 'Phrygian Mode',
    description: 'Minor scale with a flat 2nd. Distinct Spanish/flamenco and metal vibe.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 1, letterOffset: 1, intervalName: 'm2' },
      { semitones: 3, letterOffset: 2, intervalName: 'm3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 8, letterOffset: 5, intervalName: 'm6' },
      { semitones: 10, letterOffset: 6, intervalName: 'm7' },
    ],
  },
  lydian: {
    id: 'lydian',
    name: 'Lydian Mode',
    description: 'Major scale with a sharp 4th. Ethereal, dreamlike, or spacey sound.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 2, letterOffset: 1, intervalName: 'M2' },
      { semitones: 4, letterOffset: 2, intervalName: 'M3' },
      { semitones: 6, letterOffset: 3, intervalName: 'A4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 9, letterOffset: 5, intervalName: 'M6' },
      { semitones: 11, letterOffset: 6, intervalName: 'M7' },
    ],
  },
  mixolydian: {
    id: 'mixolydian',
    name: 'Mixolydian Mode',
    description: 'Major scale with a flat 7th. Standard scale in blues, rock, and Celtic music.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 2, letterOffset: 1, intervalName: 'M2' },
      { semitones: 4, letterOffset: 2, intervalName: 'M3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 9, letterOffset: 5, intervalName: 'M6' },
      { semitones: 10, letterOffset: 6, intervalName: 'm7' },
    ],
  },
  locrian: {
    id: 'locrian',
    name: 'Locrian Mode',
    description: 'Diminished scale. Highly unstable sounding, with a flat 2nd and flat 5th.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 1, letterOffset: 1, intervalName: 'm2' },
      { semitones: 3, letterOffset: 2, intervalName: 'm3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 6, letterOffset: 4, intervalName: 'd5' },
      { semitones: 8, letterOffset: 5, intervalName: 'm6' },
      { semitones: 10, letterOffset: 6, intervalName: 'm7' },
    ],
  },
  major_pentatonic: {
    id: 'major_pentatonic',
    name: 'Major Pentatonic',
    description: '5-note scale found across global music cultures. Easy to jam with.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 2, letterOffset: 1, intervalName: 'M2' },
      { semitones: 4, letterOffset: 2, intervalName: 'M3' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 9, letterOffset: 5, intervalName: 'M6' },
    ],
  },
  minor_pentatonic: {
    id: 'minor_pentatonic',
    name: 'Minor Pentatonic',
    description: '5-note minor scale. The cornerstone of blues and rock solos.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 3, letterOffset: 2, intervalName: 'm3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 10, letterOffset: 6, intervalName: 'm7' },
    ],
  },
  blues: {
    id: 'blues',
    name: 'Blues Scale',
    description: 'Minor Pentatonic with an added flat 5th (the blue note). 6 notes.',
    steps: [
      { semitones: 0, letterOffset: 0, intervalName: 'P1' },
      { semitones: 3, letterOffset: 2, intervalName: 'm3' },
      { semitones: 5, letterOffset: 3, intervalName: 'P4' },
      { semitones: 6, letterOffset: 4, intervalName: 'd5' },
      { semitones: 7, letterOffset: 4, intervalName: 'P5' },
      { semitones: 10, letterOffset: 6, intervalName: 'm7' },
    ],
  },
};

/**
 * Interface representing a spelling result for a note in a scale
 */
export interface ScaleNote {
  note: Note;
  step: ScaleStep;
  noteName: string; // spelled name e.g. "F#"
  noteNameWithOctave: string; // e.g. "F#4"
  midi: number;
}

/**
 * Generates spelled notes for a scale given a root note and a scale formula.
 * E.g., generateScale("Eb", "major")
 */
export function generateScale(rootNoteName: string, formulaId: string): ScaleNote[] {
  const parsedRoot = parseNote(rootNoteName);
  const formula = SCALE_FORMULAS[formulaId];

  if (!formula) {
    throw new Error(`Formula not found: ${formulaId}`);
  }

  const rootLetterIdx = LETTERS.indexOf(parsedRoot.letter);
  const baseOctave = parsedRoot.octave ?? 4;

  return formula.steps.map((step) => {
    // 1. Determine expected letter name
    const letterIdx = (rootLetterIdx + step.letterOffset) % 7;
    const expectedLetter = LETTERS[letterIdx];

    // 2. Determine target pitch class
    const targetPitchClass = (parsedRoot.pitchClass + step.semitones) % 12;

    // 3. Determine octave (wraps around based on cumulative pitch from root)
    const totalSemitones = parsedRoot.pitchClass + step.semitones;
    const octave = baseOctave + Math.floor(totalSemitones / 12);

    // 4. Spell the note
    const spelled = spellNote(targetPitchClass, expectedLetter, octave);
    
    // Create friendly string representations
    const noteName = `${spelled.letter}${spelled.accidental}`;
    const noteNameWithOctave = `${noteName}${spelled.octave}`;

    return {
      note: spelled,
      step,
      noteName,
      noteNameWithOctave,
      midi: (spelled.octave! + 1) * 12 + spelled.pitchClass,
    };
  });
}

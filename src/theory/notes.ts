// Pitch classes in semitones starting from C = 0
export const PITCH_CLASSES = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
} as const;

export type LetterName = keyof typeof PITCH_CLASSES;

export const LETTERS: LetterName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export interface Note {
  pitchClass: number; // 0-11
  letter: LetterName;
  accidental: string; // '', '#', 'b', '##', 'bb', etc.
  octave?: number; // optional octave, default to 4 for middle range
}

/**
 * Parses a note string like "C#4", "Db", "F##5" into a Note object.
 */
export function parseNote(noteStr: string): Note {
  const match = noteStr.match(/^([A-G])(b+|#+|x?)(-?\d+)?$/);
  if (!match) {
    throw new Error(`Invalid note format: ${noteStr}`);
  }

  const [, letter, accidentalStr, octaveStr] = match;
  const basePitch = PITCH_CLASSES[letter as LetterName];

  let accidentalVal = 0;
  if (accidentalStr.startsWith('#')) {
    accidentalVal = accidentalStr.length;
  } else if (accidentalStr.startsWith('b')) {
    accidentalVal = -accidentalStr.length;
  } else if (accidentalStr === 'x') {
    accidentalVal = 2;
  }

  const pitchClass = (basePitch + accidentalVal + 120) % 12;
  const octave = octaveStr !== undefined ? parseInt(octaveStr, 10) : undefined;

  return {
    pitchClass,
    letter: letter as LetterName,
    accidental: accidentalStr,
    octave,
  };
}

/**
 * Formats a Note object back into a string.
 */
export function formatNote(note: Note): string {
  return `${note.letter}${note.accidental}${note.octave !== undefined ? note.octave : ''}`;
}

/**
 * Calculates the spelling of a pitch class given an expected letter name.
 * For example: pitchClass=10 (A#/Bb), expectedLetter='B' -> 'Bb'
 * For example: pitchClass=10 (A#/Bb), expectedLetter='A' -> 'A#'
 */
export function spellNote(pitchClass: number, expectedLetter: LetterName, octave?: number): Note {
  const basePitch = PITCH_CLASSES[expectedLetter];
  
  // Calculate accidental semitones. We want the minimal distance.
  // Normalize pitchClass - basePitch to range [-6, 5]
  let diff = (pitchClass - basePitch) % 12;
  if (diff > 5) diff -= 12;
  if (diff < -6) diff += 12;

  let accidental = '';
  if (diff > 0) {
    accidental = '#'.repeat(diff);
  } else if (diff < 0) {
    accidental = 'b'.repeat(Math.abs(diff));
  }

  return {
    pitchClass,
    letter: expectedLetter,
    accidental,
    octave,
  };
}

/**
 * Converts a Note to its MIDI number, assuming standard octave.
 * Middle C is C4 = MIDI 60.
 */
export function getMidiNumber(note: Note, defaultOctave = 4): number {
  const octave = note.octave !== undefined ? note.octave : defaultOctave;
  return (octave + 1) * 12 + note.pitchClass;
}

/**
 * Converts a MIDI number back to a Note object, using a preferred spelling hint (flat or sharp).
 */
export function fromMidiNumber(midi: number, preferredAccidental: 'b' | '#' = '#'): Note {
  const pitchClass = midi % 12;
  const octave = Math.floor(midi / 12) - 1;

  // Standard spellings
  const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  const name = preferredAccidental === '#' ? sharps[pitchClass] : flats[pitchClass];
  const parsed = parseNote(name);
  parsed.octave = octave;
  return parsed;
}

/**
 * Calculates frequency from a MIDI number (A4 = 440Hz -> MIDI 69)
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Get note name frequency directly
 */
export function getNoteFrequency(noteName: string): number {
  const note = parseNote(noteName);
  const midi = getMidiNumber(note);
  return midiToFrequency(midi);
}

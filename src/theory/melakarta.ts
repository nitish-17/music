import { LETTERS, parseNote, spellNote } from './notes';
import type { Note } from './notes';


export interface SwaraInfo {
  name: string; // 'S', 'R1', 'G2', etc.
  semitones: number;
  letterOffset: number;
}

export interface MelakartaRaga {
  number: number; // 1 to 72
  name: string;
  chakraNumber: number; // 1 to 12
  chakraName: string;
  swaras: SwaraInfo[];
}

export const CHAKRA_NAMES = [
  'Indu', 'Netra', 'Agni', 'Veda', 'Bana', 'Rutu',
  'Rishi', 'Vasu', 'Brahma', 'Disi', 'Rudra', 'Aditya'
];

export const MELAKARTA_NAMES = [
  'Kanakangi', 'Ratnangi', 'Ganamurti', 'Vanaspati', 'Manavati', 'Tanarupi',
  'Senavati', 'Hanumatodi', 'Dhenuka', 'Natakapriya', 'Kokilapriya', 'Rupavati',
  'Gayakapriya', 'Vakulabharanam', 'Mayamalavagowla', 'Chakravakam', 'Suryakantam', 'Hatakambari',
  'Jhankaradhwani', 'Natabhairavi', 'Keeravani', 'Kharaharapriya', 'Gaurimanohari', 'Varunapriya',
  'Mararanjani', 'Charukesi', 'Sarasangi', 'Harikambhoji', 'Dheerasankarabharanam', 'Naganandini',
  'Yagapriya', 'Ragavardhini', 'Gangeyabhushani', 'Vagadheeswari', 'Shulini', 'Chalanata',
  'Salagam', 'Jalarnavam', 'Jhalavarali', 'Navaneetam', 'Pavani', 'Raghupriya',
  'Gavambodhi', 'Bhavapriya', 'Shubhapantuvarali', 'Shadvidhamargini', 'Suvarnangi', 'Divyamani',
  'Dhavalambari', 'Namanarayani', 'Kamavardhini', 'Ramapriya', 'Gamanashrama', 'Vishwambari',
  'Shyamalangi', 'Shanmukhapriya', 'Simhendramadhyamam', 'Hemavati', 'Dharmavati', 'Neetimati',
  'Kanthamani', 'Rishabhapriya', 'Latangi', 'Vachaspati', 'Mechakalyani', 'Chitrambari',
  'Sucharitra', 'Jyotiswarupini', 'Dhatuvardhani', 'Nasikabhushani', 'Kosalam', 'Rasikapriya'
];

/**
 * Calculates the swara details for a Melakarta raga index (0 to 71)
 */
export function getMelakartaFormula(index: number): SwaraInfo[] {
  const number = index + 1;
  const chakraIdx = Math.floor(index / 6); // 0 to 11
  const chakraVal = chakraIdx % 6; // 0 to 5 (determines Ri and Ga)
  const pos = index % 6; // 0 to 5 (determines Dha and Ni)

  // 1. Shadja (Sa) - always fixed
  const S: SwaraInfo = { name: 'S', semitones: 0, letterOffset: 0 };

  // 2. Rishabha (Ri) and Gandhara (Ga) based on chakra position
  let R: SwaraInfo;
  let G: SwaraInfo;
  switch (chakraVal) {
    case 0:
      R = { name: 'R1', semitones: 1, letterOffset: 1 };
      G = { name: 'G1', semitones: 2, letterOffset: 2 };
      break;
    case 1:
      R = { name: 'R1', semitones: 1, letterOffset: 1 };
      G = { name: 'G2', semitones: 3, letterOffset: 2 };
      break;
    case 2:
      R = { name: 'R1', semitones: 1, letterOffset: 1 };
      G = { name: 'G3', semitones: 4, letterOffset: 2 };
      break;
    case 3:
      R = { name: 'R2', semitones: 2, letterOffset: 1 };
      G = { name: 'G2', semitones: 3, letterOffset: 2 };
      break;
    case 4:
      R = { name: 'R2', semitones: 2, letterOffset: 1 };
      G = { name: 'G3', semitones: 4, letterOffset: 2 };
      break;
    case 5:
    default:
      R = { name: 'R3', semitones: 3, letterOffset: 1 };
      G = { name: 'G3', semitones: 4, letterOffset: 2 };
      break;
  }

  // 3. Madhyama (Ma) - first 36 are M1 (Shuddha), last 36 are M2 (Prati)
  const M: SwaraInfo = number <= 36 
    ? { name: 'M1', semitones: 5, letterOffset: 3 }
    : { name: 'M2', semitones: 6, letterOffset: 3 };

  // 4. Panchama (Pa) - always fixed
  const P: SwaraInfo = { name: 'P', semitones: 7, letterOffset: 4 };

  // 5. Dhaivata (Dha) and Nishada (Ni) based on index within chakra
  let D: SwaraInfo;
  let N: SwaraInfo;
  switch (pos) {
    case 0:
      D = { name: 'D1', semitones: 8, letterOffset: 5 };
      N = { name: 'N1', semitones: 9, letterOffset: 6 };
      break;
    case 1:
      D = { name: 'D1', semitones: 8, letterOffset: 5 };
      N = { name: 'N2', semitones: 10, letterOffset: 6 };
      break;
    case 2:
      D = { name: 'D1', semitones: 8, letterOffset: 5 };
      N = { name: 'N3', semitones: 11, letterOffset: 6 };
      break;
    case 3:
      D = { name: 'D2', semitones: 9, letterOffset: 5 };
      N = { name: 'N2', semitones: 10, letterOffset: 6 };
      break;
    case 4:
      D = { name: 'D2', semitones: 9, letterOffset: 5 };
      N = { name: 'N3', semitones: 11, letterOffset: 6 };
      break;
    case 5:
    default:
      D = { name: 'D3', semitones: 10, letterOffset: 5 };
      N = { name: 'N3', semitones: 11, letterOffset: 6 };
      break;
  }

  return [S, R, G, M, P, D, N];
}

export interface SpelledMelakartaNote {
  swara: SwaraInfo;
  note: Note;
  noteName: string;
  midi: number;
}

/**
 * Generates Western spelled notes for a Melakarta raga given a root note
 */
export function generateMelakartaNotes(rootNoteName: string, ragaIndex: number, octaveOffset: number = 0): SpelledMelakartaNote[] {
  const parsedRoot = parseNote(rootNoteName);
  const formula = getMelakartaFormula(ragaIndex);
  
  const rootLetterIdx = LETTERS.indexOf(parsedRoot.letter);
  const baseOctave = (parsedRoot.octave ?? 4) + octaveOffset;

  return formula.map((swara) => {
    // Expected letter name based on standard A-G shift
    const letterIdx = (rootLetterIdx + swara.letterOffset) % 7;
    const expectedLetter = LETTERS[letterIdx];

    // Target pitch class
    const targetPitchClass = (parsedRoot.pitchClass + swara.semitones) % 12;

    // Octave offset
    const totalSemitones = parsedRoot.pitchClass + swara.semitones;
    const octave = baseOctave + Math.floor(totalSemitones / 12);

    // Spell note
    const spelled = spellNote(targetPitchClass, expectedLetter, octave);
    const noteName = `${spelled.letter}${spelled.accidental}`;

    return {
      swara,
      note: spelled,
      noteName,
      midi: (spelled.octave! + 1) * 12 + spelled.pitchClass,
    };
  });
}

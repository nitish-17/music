export interface Interval {
  semitones: number;
  shortName: string;
  fullName: string;
  letterOffset: number; // offset in the A-G scale letters
}

export const INTERVALS: Record<string, Interval> = {
  P1: { semitones: 0, shortName: 'P1', fullName: 'Perfect Unison', letterOffset: 0 },
  m2: { semitones: 1, shortName: 'm2', fullName: 'Minor Second', letterOffset: 1 },
  M2: { semitones: 2, shortName: 'M2', fullName: 'Major Second', letterOffset: 1 },
  m3: { semitones: 3, shortName: 'm3', fullName: 'Minor Third', letterOffset: 2 },
  M3: { semitones: 4, shortName: 'M3', fullName: 'Major Third', letterOffset: 2 },
  P4: { semitones: 5, shortName: 'P4', fullName: 'Perfect Fourth', letterOffset: 3 },
  d5: { semitones: 6, shortName: 'd5', fullName: 'Diminished Fifth', letterOffset: 4 },
  A4: { semitones: 6, shortName: 'A4', fullName: 'Augmented Fourth', letterOffset: 3 },
  P5: { semitones: 7, shortName: 'P5', fullName: 'Perfect Fifth', letterOffset: 4 },
  m6: { semitones: 8, shortName: 'm6', fullName: 'Minor Sixth', letterOffset: 5 },
  M6: { semitones: 9, shortName: 'M6', fullName: 'Major Sixth', letterOffset: 5 },
  m7: { semitones: 10, shortName: 'm7', fullName: 'Minor Seventh', letterOffset: 6 },
  M7: { semitones: 11, shortName: 'M7', fullName: 'Major Seventh', letterOffset: 6 },
  P8: { semitones: 12, shortName: 'P8', fullName: 'Perfect Octave', letterOffset: 7 },
};

// Map semitones & letter offset to standard interval
export function getIntervalByShorthand(shorthand: string): Interval {
  const interval = INTERVALS[shorthand];
  if (!interval) {
    throw new Error(`Unknown interval shorthand: ${shorthand}`);
  }
  return interval;
}

/**
 * Gets standard interval shorthand between pitch classes and letter offsets
 */
export function findInterval(fromPitch: number, toPitch: number, letterDiff: number): Interval {
  const semitones = (toPitch - fromPitch + 12) % 12;
  const targetOffset = (letterDiff + 7) % 7;

  const found = Object.values(INTERVALS).find(
    (int) => int.semitones === semitones && int.letterOffset === targetOffset
  );

  if (found) return found;

  // Fallback to simple semitone-based matching
  const fallback = Object.values(INTERVALS).find((int) => int.semitones === semitones);
  return fallback || {
    semitones,
    shortName: `?${semitones}`,
    fullName: `Interval of ${semitones} semitones`,
    letterOffset: targetOffset,
  };
}

export interface CarnaticSwaraMapping {
  shortName: string;
  fullName: string;
  semitones: number;
}

export const SEMITONE_TO_SWARAS: Record<number, CarnaticSwaraMapping[]> = {
  0: [{ shortName: 'S', fullName: 'Shadjam', semitones: 0 }],
  1: [{ shortName: 'R1', fullName: 'Shuddha Rishabham', semitones: 1 }],
  2: [
    { shortName: 'R2', fullName: 'Chatushruti Rishabham', semitones: 2 },
    { shortName: 'G1', fullName: 'Shuddha Gandharam', semitones: 2 }
  ],
  3: [
    { shortName: 'R3', fullName: 'Shatshruti Rishabham', semitones: 3 },
    { shortName: 'G2', fullName: 'Sadharana Gandharam', semitones: 3 }
  ],
  4: [{ shortName: 'G3', fullName: 'Antara Gandharam', semitones: 4 }],
  5: [{ shortName: 'M1', fullName: 'Shuddha Madhyamam', semitones: 5 }],
  6: [{ shortName: 'M2', fullName: 'Prati Madhyamam', semitones: 6 }],
  7: [{ shortName: 'P', fullName: 'Panchamam', semitones: 7 }],
  8: [{ shortName: 'D1', fullName: 'Shuddha Dhaivatam', semitones: 8 }],
  9: [
    { shortName: 'D2', fullName: 'Chatushruti Dhaivatam', semitones: 9 },
    { shortName: 'N1', fullName: 'Shuddha Nishadam', semitones: 9 }
  ],
  10: [
    { shortName: 'D3', fullName: 'Shatshruti Dhaivatam', semitones: 10 },
    { shortName: 'N2', fullName: 'Kaisiki Nishadam', semitones: 10 }
  ],
  11: [{ shortName: 'N3', fullName: 'Kakali Nishadam', semitones: 11 }],
  12: [{ shortName: 'S', fullName: 'Shadjam (Octave)', semitones: 12 }]
};

export function getSwaraForScaleDegree(degree: number, semitones: number): { shortName: string; fullName: string } {
  const normSemitones = semitones % 12;
  switch (degree) {
    case 1:
      return { shortName: 'S', fullName: 'Shadjam' };
    case 2:
      if (normSemitones === 1) return { shortName: 'R1', fullName: 'Shuddha Rishabham' };
      if (normSemitones === 2) return { shortName: 'R2', fullName: 'Chatushruti Rishabham' };
      if (normSemitones === 3) return { shortName: 'R3', fullName: 'Shatshruti Rishabham' };
      break;
    case 3:
      if (normSemitones === 2) return { shortName: 'G1', fullName: 'Shuddha Gandharam' };
      if (normSemitones === 3) return { shortName: 'G2', fullName: 'Sadharana Gandharam' };
      if (normSemitones === 4) return { shortName: 'G3', fullName: 'Antara Gandharam' };
      break;
    case 4:
      if (normSemitones === 5) return { shortName: 'M1', fullName: 'Shuddha Madhyamam' };
      if (normSemitones === 6) return { shortName: 'M2', fullName: 'Prati Madhyamam' };
      break;
    case 5:
      if (normSemitones === 7) return { shortName: 'P', fullName: 'Panchamam' };
      if (normSemitones === 6) return { shortName: 'M2', fullName: 'Prati Madhyamam (Diminished 5th)' };
      break;
    case 6:
      if (normSemitones === 8) return { shortName: 'D1', fullName: 'Shuddha Dhaivatam' };
      if (normSemitones === 9) return { shortName: 'D2', fullName: 'Chatushruti Dhaivatam' };
      if (normSemitones === 10) return { shortName: 'D3', fullName: 'Shatshruti Dhaivatam' };
      break;
    case 7:
      if (normSemitones === 9) return { shortName: 'N1', fullName: 'Shuddha Nishadam' };
      if (normSemitones === 10) return { shortName: 'N2', fullName: 'Kaisiki Nishadam' };
      if (normSemitones === 11) return { shortName: 'N3', fullName: 'Kakali Nishadam' };
      break;
  }

  const mappings = SEMITONE_TO_SWARAS[normSemitones];
  if (mappings && mappings.length > 0) {
    return mappings[0];
  }
  return { shortName: '?', fullName: 'Unknown' };
}


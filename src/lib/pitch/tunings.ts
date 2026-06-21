import { frequencyForMidi, type GuitarString, noteNameForMidi } from './notes';

/**
 * A selectable guitar tuning: six strings from low (6th) to high (1st).
 * Tunings are defined by MIDI note numbers and the per-string note/frequency is
 * derived, so everything stays consistent with the rest of the pitch math.
 */
export type Tuning = {
  id: string;
  name: string;
  /** Extra terms (nicknames, note spelling) to widen the loose search. */
  aliases: string[];
  strings: GuitarString[];
};

type TuningDef = { id: string; name: string; midi: number[]; aliases?: string[] };

// Low (6th) string first. Most conventional 6-string guitar tunings.
// MIDI reference: E2 = 40, A2 = 45, D3 = 50, G3 = 55, B3 = 59, E4 = 64.
const DEFS: TuningDef[] = [
  { id: 'standard', name: 'Standard', midi: [40, 45, 50, 55, 59, 64], aliases: ['e standard'] },
  { id: 'drop-d', name: 'Drop D', midi: [38, 45, 50, 55, 59, 64] },
  { id: 'double-drop-d', name: 'Double Drop D', midi: [38, 45, 50, 55, 59, 62] },
  { id: 'drop-c-sharp', name: 'Drop C#', midi: [37, 44, 49, 54, 58, 63], aliases: ['drop db'] },
  { id: 'drop-c', name: 'Drop C', midi: [36, 43, 48, 53, 57, 62] },
  { id: 'drop-b', name: 'Drop B', midi: [35, 42, 47, 52, 56, 61] },
  { id: 'drop-a', name: 'Drop A', midi: [33, 40, 45, 50, 54, 59] },
  {
    id: 'eb-standard',
    name: 'E♭ Standard',
    midi: [39, 44, 49, 54, 58, 63],
    aliases: ['half step down', 'eb', 'e flat'],
  },
  {
    id: 'd-standard',
    name: 'D Standard',
    midi: [38, 43, 48, 53, 57, 62],
    aliases: ['whole step down', 'full step down'],
  },
  { id: 'c-standard', name: 'C Standard', midi: [36, 41, 46, 51, 55, 60] },
  { id: 'b-standard', name: 'B Standard', midi: [35, 40, 45, 50, 54, 59] },
  { id: 'open-d', name: 'Open D', midi: [38, 45, 50, 54, 57, 62], aliases: ['vestapol'] },
  { id: 'open-d-minor', name: 'Open D Minor', midi: [38, 45, 50, 53, 57, 62], aliases: ['open dm'] },
  { id: 'open-c', name: 'Open C', midi: [36, 43, 48, 55, 60, 64] },
  { id: 'open-g', name: 'Open G', midi: [38, 43, 50, 55, 59, 62], aliases: ['spanish'] },
  { id: 'open-g-minor', name: 'Open G Minor', midi: [38, 43, 50, 55, 58, 62], aliases: ['open gm'] },
  { id: 'open-e', name: 'Open E', midi: [40, 47, 52, 56, 59, 64] },
  { id: 'open-a', name: 'Open A', midi: [40, 45, 52, 57, 61, 64] },
  {
    id: 'dadgad',
    name: 'DADGAD',
    midi: [38, 45, 50, 55, 57, 62],
    aliases: ['celtic', 'dsus4', 'd modal'],
  },
  { id: 'all-fourths', name: 'All Fourths', midi: [40, 45, 50, 55, 60, 65], aliases: ['perfect fourths'] },
  {
    id: 'nst',
    name: 'New Standard Tuning',
    midi: [36, 43, 50, 57, 64, 67],
    aliases: ['nst', 'fripp', 'crafty'],
  },
];

function makeStrings(midis: number[]): GuitarString[] {
  return midis.map((midi) => {
    const { name, octave } = noteNameForMidi(midi);
    return { label: name, note: `${name}${octave}`, midi, frequency: frequencyForMidi(midi) };
  });
}

export const TUNINGS: Tuning[] = DEFS.map((def) => ({
  id: def.id,
  name: def.name,
  aliases: def.aliases ?? [],
  strings: makeStrings(def.midi),
}));

export const DEFAULT_TUNING_ID = 'standard';

/** Resolve a stored id back to a tuning, falling back to Standard. */
export function getTuningById(id: string | null | undefined): Tuning {
  return TUNINGS.find((t) => t.id === id) ?? TUNINGS[0];
}

/** A short note spelling for display, e.g. "E A D G B E". */
export function tuningNotes(tuning: Tuning): string {
  return tuning.strings.map((s) => s.label).join(' ');
}

// --- Loose search -----------------------------------------------------------

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** True if every char of `query` appears in order within `target` (fuzzy). */
function isSubsequence(query: string, target: string): boolean {
  let i = 0;
  for (let j = 0; j < target.length && i < query.length; j++) {
    if (target[j] === query[i]) i++;
  }
  return i === query.length;
}

function searchHaystack(tuning: Tuning): string {
  // Name + aliases + spaced notes + compact notes ("EADGBE", "DADGAD").
  const compact = tuning.strings.map((s) => s.label).join('');
  return normalize([tuning.name, ...tuning.aliases, tuningNotes(tuning), compact].join(' '));
}

/**
 * Loosely filter tunings by a query: matches direct substrings first, then
 * fuzzy subsequence matches (so "dadg" or "celtic" both find DADGAD). Empty
 * query returns the full list in its canonical order.
 */
export function searchTunings(query: string, tunings: Tuning[] = TUNINGS): Tuning[] {
  const q = normalize(query);
  if (!q) return tunings;

  const scored: { tuning: Tuning; score: number }[] = [];
  for (const tuning of tunings) {
    const hay = searchHaystack(tuning);
    const name = normalize(tuning.name);
    if (name.startsWith(q)) scored.push({ tuning, score: 0 });
    else if (hay.includes(q)) scored.push({ tuning, score: 1 });
    else if (isSubsequence(q, hay)) scored.push({ tuning, score: 2 });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.tuning);
}

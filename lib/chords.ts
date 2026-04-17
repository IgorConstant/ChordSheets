// Parses chord name into key + suffix for database lookup
export function parseChordName(chord: string): { key: string; suffix: string } {
  // Match: root note (A-G, with optional # or b) + optional suffix
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return { key: chord, suffix: "major" };

  const key = match[1];
  const rawSuffix = match[2] || "";

  const suffixMap: Record<string, string> = {
    "": "major",
    maj: "major",
    m: "minor",
    min: "minor",
    "7": "7",
    maj7: "maj7",
    m7: "m7",
    m7b5: "m7b5",
    dim: "dim",
    dim7: "dim7",
    aug: "aug",
    sus2: "sus2",
    sus4: "sus4",
    "9": "9",
    m9: "m9",
    maj9: "maj9",
    add9: "add9",
    "6": "6",
    m6: "m6",
    "11": "11",
    "13": "13",
    "7sus4": "7sus4",
    "5": "5",
  };

  const suffix = suffixMap[rawSuffix] ?? rawSuffix;
  return { key, suffix };
}

// Fret char to number (handles 'x', 'a'=10, 'b'=11, etc.)
export function fretCharToNum(c: string): number | null {
  if (c === "x" || c === "X") return null;
  if (c >= "a") return c.charCodeAt(0) - "a".charCodeAt(0) + 10;
  return parseInt(c, 10);
}

export interface ChordPosition {
  frets: string;
  fingers: string;
  barres?: number | number[];
  capo?: boolean;
}

// Extracts unique chords from a chord sheet text
export function extractChords(text: string): string[] {
  const chordRegex = /\b([A-G][#b]?(?:maj7?|m(?:aj7?|7b5|7|9|6|in)?|dim7?|aug7?|sus[24]?|add9|[679]|11|13|m7b5)?)\b/g;
  const found = new Set<string>();
  for (const line of text.split("\n")) {
    // Chord lines: mostly chords with spaces, no long words
    const words = line.trim().split(/\s+/);
    const looksLikeChordLine = words.length > 0 && words.every((w) => /^[A-G][#b]?/.test(w) || w === "");
    if (looksLikeChordLine) {
      for (const m of line.matchAll(chordRegex)) {
        found.add(m[1]);
      }
    }
  }
  return Array.from(found);
}

// Mapeamento solfejo → semitom (dó=0, ré=2, mi=4, fá=5, sol=7, lá=9, si=11)
export const SOLFEGE_SEMITONES: Record<string, number> = {
  "dó":   0,
  "dó#":  1, "réb":  1,
  "ré":   2,
  "ré#":  3, "mib":  3,
  "mi":   4,
  "fá":   5,
  "fá#":  6, "solb": 6,
  "sol":  7,
  "sol#": 8, "láb":  8,
  "lá":   9,
  "lá#": 10, "sib": 10,
  "si":  11,
};

const SOLFEGE_TOKEN_RE = /^(dó|ré|mi|fá|sol|lá|si)[#b]?$/i;

// Extrai grupos únicos de notas em solfejo de uma cifra de teclado.
// Cada grupo representa um acorde na posição da cifra (ex: ["dó","mi","sol"]).
// Notas do mesmo acorde são separadas por 1-3 espaços; acordes diferentes por 4+ espaços.
export function extractSolfegeGroups(text: string): string[][] {
  const seen = new Map<string, string[]>();

  for (const line of text.split("\n")) {
    const tokens = line.trim().split(/\s+/).filter((t) => t !== "");
    if (tokens.length < 2) continue;
    // Só processa linhas onde todos os tokens são notas em solfejo
    if (!tokens.every((t) => SOLFEGE_TOKEN_RE.test(t))) continue;

    // Separa posições de acordes por 4+ espaços; notas do mesmo acorde ficam juntas
    const rawGroups = line.trim().split(/\s{4,}/);
    for (const raw of rawGroups) {
      const notes = raw.trim().split(/\s+/).filter((n) => SOLFEGE_TOKEN_RE.test(n));
      if (notes.length < 2) continue;
      const key = [...notes].sort().join(",");
      if (!seen.has(key)) seen.set(key, notes);
    }
  }

  return Array.from(seen.values());
}

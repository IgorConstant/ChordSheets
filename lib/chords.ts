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

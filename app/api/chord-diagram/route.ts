import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "node_modules/@tombatossals/chords-db/src/db");

function readChordFile(instrument: string, key: string, suffix: string) {
  const filePath = path.join(DB_PATH, instrument, "chords", key, `${suffix}.js`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  // Parse the ES module export default { ... } manually
  const match = content.match(/export default\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!match) return null;
  // Convert JS object to JSON (handle unquoted keys)
  try {
    const json = match[1]
      .replace(/(\w+):/g, '"$1":')        // quote keys
      .replace(/'/g, '"')                  // single to double quotes
      .replace(/,\s*}/g, "}")             // trailing commas
      .replace(/,\s*]/g, "]");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const SUFFIX_MAP: Record<string, string> = {
  "": "major", maj: "major", m: "minor", min: "minor",
  "7": "7", maj7: "maj7", m7: "m7", m7b5: "m7b5",
  dim: "dim", dim7: "dim7", aug: "aug", sus2: "sus2",
  sus4: "sus4", "9": "9", m9: "m9", maj9: "maj9",
  add9: "add9", "6": "6", m6: "m6", "11": "11", "13": "13",
};

function parseChord(chord: string) {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  const key = match[1];
  const rawSuffix = match[2] ?? "";
  const suffix = SUFFIX_MAP[rawSuffix] ?? rawSuffix;
  return { key, suffix };
}

// Bass: nota raiz nas 4 cordas (E A D G)
const BASS_STRINGS = ["E", "A", "D", "G"];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const OPEN_NOTES = [4, 9, 2, 7]; // E=4, A=9, D=2, G=7 (index in NOTE_NAMES)

function bassRootPositions(chordRoot: string) {
  const rootNorm = chordRoot.replace("b", "#").replace("Db", "C#").replace("Eb", "D#")
    .replace("Gb", "F#").replace("Ab", "G#").replace("Bb", "A#");
  const rootIdx = NOTE_NAMES.indexOf(rootNorm);
  if (rootIdx === -1) return null;

  return OPEN_NOTES.map((openNote, stringIdx) => {
    let fret = (rootIdx - openNote + 12) % 12;
    if (fret > 12) fret -= 12;
    return { string: BASS_STRINGS[stringIdx], fret };
  });
}

export async function POST(req: NextRequest) {
  const { chords, instrument } = await req.json();
  const results: Record<string, unknown> = {};

  for (const chord of chords as string[]) {
    if (instrument === "baixo") {
      const parsed = parseChord(chord);
      if (!parsed) continue;
      const positions = bassRootPositions(parsed.key);
      if (positions) results[chord] = { type: "bass", root: parsed.key, positions };
      continue;
    }

    const dbInstrument = instrument === "ukulele" ? "ukulele" : "guitar";
    const parsed = parseChord(chord);
    if (!parsed) continue;
    const data = readChordFile(dbInstrument, parsed.key, parsed.suffix);
    if (data?.positions?.[0]) {
      results[chord] = { type: "chord", position: data.positions[0] };
    }
  }

  return NextResponse.json(results);
}

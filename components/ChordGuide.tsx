"use client";

import { useEffect, useState } from "react";
import ChordDiagram from "./ChordDiagram";
import { extractChords } from "@/lib/chords";

interface ChordResult {
  type: "chord" | "bass";
  position?: { frets: string; fingers: string; barres?: number | number[] };
  root?: string;
  positions?: { string: string; fret: number }[];
}

interface Props {
  chordSheet: string;
  instrument: string;
}

export default function ChordGuide({ chordSheet, instrument }: Props) {
  const [data, setData] = useState<Record<string, ChordResult>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chordSheet || !["violao", "guitarra", "ukulele", "baixo"].includes(instrument)) {
      setData({});
      return;
    }

    const chords = extractChords(chordSheet);
    if (chords.length === 0) return;

    setLoading(true);
    fetch("/api/chord-diagram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chords, instrument }),
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [chordSheet, instrument]);

  const entries = Object.entries(data);
  if (loading) return <p className="mt-8 text-zinc-500 text-xs">Carregando guia de acordes...</p>;
  if (entries.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
        🎓 Guia para iniciantes
      </h2>
      <div className="flex flex-wrap gap-6">
        {entries.map(([name, result]) => (
          <ChordDiagram key={name} name={name} result={result} />
        ))}
      </div>
    </div>
  );
}

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
  open: boolean;
  onClose: () => void;
  dark?: boolean;
}

export default function ChordSidebar({ chordSheet, instrument, open, onClose, dark = false }: Props) {
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

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 border-l z-40 transform transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        } ${dark ? "bg-gray-950 border-gray-800" : "bg-white border-gray-100"}`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${dark ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${dark ? "text-gray-300" : "text-gray-500"}`}>
            🎓 Guia de acordes
          </h2>
          <button
            onClick={onClose}
            className={`transition text-xl leading-none ${dark ? "text-gray-600 hover:text-gray-200" : "text-gray-300 hover:text-gray-700"}`}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5">
          {loading && (
            <p className={`text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>Carregando acordes...</p>
          )}

          {!loading && entries.length === 0 && (
            <p className={`text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>
              Nenhum acorde encontrado. Gere uma cifra primeiro.
            </p>
          )}

          <div className="grid grid-cols-2 gap-6">
            {entries.map(([name, result]) => (
              <ChordDiagram key={name} name={name} result={result} size="lg" dark={dark} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

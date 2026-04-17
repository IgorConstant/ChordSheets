"use client";

import { useEffect, useState } from "react";
import ChordDiagram from "./ChordDiagram";
import { extractChords, extractSolfegeGroups, SOLFEGE_SEMITONES } from "@/lib/chords";

interface ChordResult {
  type: "chord" | "bass" | "piano";
  position?: { frets: string; fingers: string; barres?: number | number[] };
  root?: string;
  positions?: { string: string; fret: number }[];
  noteIndices?: number[];
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
    if (!chordSheet) { setData({}); return; }

    // Teclado: extrai grupos de notas em solfejo e monta diagramas de piano localmente
    if (instrument === "teclado") {
      const groups = extractSolfegeGroups(chordSheet);
      const pianoData: Record<string, ChordResult> = {};
      for (const notes of groups) {
        const label = notes.join(" ");
        const noteIndices = notes.map((n) => SOLFEGE_SEMITONES[n.toLowerCase()] ?? 0);
        pianoData[label] = { type: "piano", noteIndices };
      }
      setData(pianoData);
      return;
    }

    if (!["violao", "guitarra", "ukulele", "baixo"].includes(instrument)) {
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
        className={`fixed top-0 right-0 h-full w-96 border-l z-40 transform transition-transform duration-300 flex flex-col ${
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

          {!loading && entries.length === 0 && instrument === "gaita" && (
            <div className={`text-xs space-y-2 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              <p className="font-semibold">Legenda da tablatura de gaita diatônica:</p>
              <ul className="space-y-1">
                <li><span className="font-mono font-bold">+4</span> — Buraco 4, soprar (blow)</li>
                <li><span className="font-mono font-bold">4</span> — Buraco 4, puxar/inspirar (draw)</li>
                <li><span className="font-mono font-bold">3'</span> — Buraco 3, puxar com bend de meio tom</li>
                <li><span className="font-mono font-bold">3''</span> — Buraco 3, puxar com bend de tom inteiro</li>
              </ul>
              <p className="mt-3">Os buracos vão de 1 (mais grave) a 10 (mais agudo).</p>
            </div>
          )}

          {!loading && entries.length === 0 && instrument !== "gaita" && (
            <p className={`text-xs ${dark ? "text-gray-600" : "text-gray-400"}`}>
              Nenhum acorde encontrado. Gere uma cifra primeiro.
            </p>
          )}

          <div className="flex flex-wrap gap-6">
            {entries.map(([name, result]) => (
              <ChordDiagram key={name} name={name} result={result} size="lg" dark={dark} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

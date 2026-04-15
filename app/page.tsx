"use client";

import { useState, useEffect } from "react";
import ChordSidebar from "@/components/ChordSidebar";

const INSTRUMENTS = [
  { value: "violao", label: "🎸 Violão" },
  { value: "guitarra", label: "⚡ Guitarra" },
  { value: "baixo", label: "🎵 Baixo" },
  { value: "ukulele", label: "🌺 Ukulele" },
  { value: "teclado", label: "🎹 Teclado" },
];

export default function Home() {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [instrument, setInstrument] = useState("violao");
  const [chordSheet, setChordSheet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cifra_dark");
    if (saved === "true") setDark(true);
  }, []);

  function toggleDark() {
    setDark((prev) => {
      localStorage.setItem("cifra_dark", String(!prev));
      return !prev;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!song.trim() || !artist.trim()) return;

    setLoading(true);
    setError("");
    setChordSheet("");

    try {
      const res = await fetch("/api/chord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song: song.trim(), artist: artist.trim(), instrument }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChordSheet(data.chordSheet);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Algo deu errado.");
    } finally {
      setLoading(false);
    }
  }

  // Theme tokens
  const t = {
    bg: dark ? "bg-gray-950" : "bg-white",
    nav: dark ? "bg-gray-950/95 border-b border-gray-800" : "bg-white/97 shadow-[0_2px_2px_-2px_rgba(0,0,0,0.15)]",
    navBrand: dark ? "text-gray-200 hover:text-[#5ba3c9]" : "text-gray-800 hover:text-[#185370]",
    navBack: dark ? "text-gray-500 hover:text-[#5ba3c9]" : "text-gray-400 hover:text-[#185370]",
    divider: dark ? "text-gray-600" : "text-gray-300",
    accent: dark ? "text-[#5ba3c9]" : "text-[#185370]",
    heading: dark ? "text-gray-100" : "text-gray-900",
    subtitle: dark ? "text-gray-400" : "text-gray-600",
    border: dark ? "border-gray-800" : "border-gray-100",
    input: dark
      ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-600 focus:border-[#5ba3c9]"
      : "bg-white border-gray-200 text-gray-800 placeholder-gray-300 focus:border-[#185370]",
    instrActive: dark ? "bg-[#185370] text-white border-[#185370]" : "bg-[#185370] text-white border-[#185370]",
    instrInactive: dark
      ? "bg-gray-900 text-gray-500 border-gray-700 hover:border-[#5ba3c9] hover:text-[#5ba3c9]"
      : "bg-white text-gray-400 border-gray-200 hover:border-[#185370] hover:text-[#185370]",
    btn: dark ? "bg-[#185370] hover:bg-[#0e3a52]" : "bg-[#185370] hover:bg-[#0e3a52]",
    resultBorder: dark ? "border-gray-800" : "border-gray-100",
    resultLabel: dark ? "text-gray-600" : "text-gray-400",
    accordesBtn: dark
      ? "border-gray-700 text-gray-500 hover:border-[#5ba3c9] hover:text-[#5ba3c9]"
      : "border-gray-200 text-gray-400 hover:border-[#185370] hover:text-[#185370]",
    pre: dark ? "text-gray-300" : "text-gray-700",
    footer: dark ? "border-gray-800 text-gray-600" : "border-gray-100 text-gray-300",
    footerLink: dark ? "text-[#5ba3c9]" : "text-[#185370]",
    toggleBtn: dark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600",
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-sm transition-colors ${t.nav}`}>
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <a href="https://osomdosilencio.com.br" className={`font-medium transition-colors text-sm ${t.navBrand}`}>
            o som do silêncio
          </a>
          <span className={`mx-3 text-sm ${t.divider}`}>·</span>
          <span className={`text-sm font-medium ${t.accent}`}>cifras</span>
          <div className="flex-1" />
          <button
            onClick={toggleDark}
            title={dark ? "Modo claro" : "Modo escuro"}
            className={`text-lg mr-4 transition-colors ${t.toggleBtn}`}
          >
            {dark ? "☀️" : "🌙"}
          </button>
          <a href="https://osomdosilencio.com.br" className={`text-xs transition-colors ${t.navBack}`}>
            ← voltar ao site
          </a>
        </div>
      </nav>

      <main className={`min-h-screen flex flex-col items-center px-4 pt-28 pb-16 transition-colors ${t.bg}`}>
        <div className="w-full max-w-2xl">

          <div className={`mb-10 border-b pb-8 ${t.border}`}>
            <h1 className={`text-3xl font-medium mb-3 transition-colors ${t.heading}`} style={{ fontFamily: "Arial, sans-serif" }}>
              cifras
            </h1>
            <p className={`text-base leading-relaxed transition-colors ${t.subtitle}`} style={{ fontFamily: "Arial, sans-serif" }}>
              Digite o nome da música e receba a cifra — limpa, sem anúncios.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-10">
            <input
              type="text"
              placeholder="Nome da música *"
              value={song}
              onChange={(e) => setSong(e.target.value)}
              className={`border rounded px-4 py-3 focus:outline-none transition text-sm ${t.input}`}
              required
            />
            <input
              type="text"
              placeholder="Artista *"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className={`border rounded px-4 py-3 focus:outline-none transition text-sm ${t.input}`}
              required
            />
            <div className="flex gap-2 flex-wrap">
              {INSTRUMENTS.map((i) => (
                <button
                  key={i.value}
                  type="button"
                  onClick={() => setInstrument(i.value)}
                  className={`flex-1 py-2 px-2 rounded text-xs font-medium transition border ${
                    instrument === i.value ? t.instrActive : t.instrInactive
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || !song.trim() || !artist.trim()}
              className={`${t.btn} text-white font-semibold rounded px-4 py-3 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm`}
            >
              {loading ? "Gerando cifra..." : "Gerar cifra"}
            </button>
          </form>

          {error && <p className="text-red-500 text-sm mb-6">❌ {error}</p>}

          {chordSheet && (
            <div className={`border rounded p-6 ${t.resultBorder}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs uppercase tracking-widest ${t.resultLabel}`}>Cifra</span>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`text-xs border px-3 py-1.5 rounded transition ${t.accordesBtn}`}
                >
                  🎓 Ver acordes
                </button>
              </div>
              <pre className={`whitespace-pre-wrap font-mono text-sm leading-relaxed ${t.pre}`}>
                {chordSheet}
              </pre>
            </div>
          )}

        </div>

        <footer className={`mt-20 border-t pt-6 w-full max-w-2xl ${t.footer}`}>
          <p className="text-xs text-center">
            um projeto de{" "}
            <a href="https://osomdosilencio.com.br" className={`hover:underline ${t.footerLink}`}>
              o som do silêncio
            </a>
          </p>
        </footer>
      </main>

      <ChordSidebar
        chordSheet={chordSheet}
        instrument={instrument}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        dark={dark}
      />
    </>
  );
}


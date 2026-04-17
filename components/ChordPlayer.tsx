"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ─── tipos de bloco ───────────────────────────────────────────────────────────

type Block =
  | { kind: "meta";    text: string }
  | { kind: "section"; text: string }
  | { kind: "pair";    chordLine?: string; lyricLine?: string };

// ─── helpers de detecção de linha ────────────────────────────────────────────

const SECTION_RE  = /^\[.+\]/;
const CHORD_RE    = /^([A-G][#b]?(?:\w+)?\s*)+$/;
const SOLFEGE_RE  = /^((dó|ré|mi|fá|sol|lá|si)[#b]?\s*)+$/i;

function isChordOrNote(line: string): boolean {
  const t = line.trim();
  return !!t && (CHORD_RE.test(t) || SOLFEGE_RE.test(t));
}

// ─── parser ──────────────────────────────────────────────────────────────────

function parseChordSheet(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  // Coleta linhas de metadados no topo (antes da primeira seção/acorde)
  const metaLines: string[] = [];
  while (i < lines.length) {
    const l = lines[i].trimEnd();
    if (SECTION_RE.test(l.trim()) || isChordOrNote(l)) break;
    if (!l.trim() && metaLines.length > 0) { i++; break; }
    metaLines.push(l);
    i++;
  }
  if (metaLines.length > 0) {
    blocks.push({ kind: "meta", text: metaLines.join("\n") });
  }

  while (i < lines.length) {
    const l = lines[i].trimEnd();

    if (!l.trim()) { i++; continue; }

    if (SECTION_RE.test(l.trim())) {
      blocks.push({ kind: "section", text: l.trim() });
      i++;
      continue;
    }

    if (isChordOrNote(l)) {
      const next = lines[i + 1]?.trimEnd();
      const nextIsChordOrSection =
        next === undefined ||
        isChordOrNote(next) ||
        SECTION_RE.test(next?.trim() ?? "");

      if (!nextIsChordOrSection) {
        blocks.push({ kind: "pair", chordLine: l, lyricLine: next });
        i += 2;
      } else {
        blocks.push({ kind: "pair", chordLine: l });
        i++;
      }
      continue;
    }

    // Linha de letra sem acorde acima
    blocks.push({ kind: "pair", lyricLine: l });
    i++;
  }

  return blocks;
}

// ─── componente ──────────────────────────────────────────────────────────────

interface Props {
  chordSheet: string;
  dark?: boolean;
}

export default function ChordPlayer({ chordSheet, dark = false }: Props) {
  const [isPlaying, setIsPlaying]   = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1); // índice dentro de playableIdxs
  const [speed, setSpeed]           = useState(4);  // 1–10 → mais rápido = maior

  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  const blocks = useMemo(() => parseChordSheet(chordSheet), [chordSheet]);

  // Índices (em `blocks`) dos blocos que são "tocáveis" (pairs)
  const playableIdxs = useMemo<number[]>(
    () => blocks.reduce<number[]>((acc, b, i) => (b.kind === "pair" ? [...acc, i] : acc), []),
    [blocks],
  );

  const currentBlockIdx = currentIdx >= 0 ? (playableIdxs[currentIdx] ?? -1) : -1;

  // Intervalo em ms: speed 1→6 000 ms, speed 10→600 ms
  const intervalMs = Math.round(6000 / speed);

  // Avança automaticamente
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => {
        const next = prev + 1;
        if (next >= playableIdxs.length) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, intervalMs, playableIdxs.length]);

  // Rola até o bloco atual
  useEffect(() => {
    if (currentBlockIdx >= 0) {
      blockRefs.current[currentBlockIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentBlockIdx]);

  // Reset ao trocar de cifra
  useEffect(() => {
    setIsPlaying(false);
    setCurrentIdx(-1);
  }, [chordSheet]);

  function handlePlayPause() {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    // Se chegou ao fim ou nunca começou, reinicia do início
    if (currentIdx < 0 || currentIdx >= playableIdxs.length - 1) {
      setCurrentIdx(0);
    }
    setIsPlaying(true);
  }

  function goPrev() {
    setIsPlaying(false);
    setCurrentIdx((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIsPlaying(false);
    setCurrentIdx((i) => Math.min(playableIdxs.length - 1, i + 1));
  }

  // ── cores ────────────────────────────────────────────────────────────────

  const chordColor  = dark ? "#5ba3c9" : "#185370";
  const lyricColor  = dark ? "#d1d5db" : "#374151";
  const muteColor   = dark ? "#4b5563" : "#9ca3af";
  const activeBg    = dark ? "rgba(91,163,201,0.10)" : "rgba(24,83,112,0.06)";
  const activeBorder= dark ? "#5ba3c9" : "#185370";
  const ctrlBg      = dark ? "bg-gray-950" : "bg-white";
  const btnBase     = dark
    ? "border-gray-700 text-gray-400 hover:border-[#5ba3c9] hover:text-[#5ba3c9]"
    : "border-gray-200 text-gray-400 hover:border-[#185370] hover:text-[#185370]";
  const btnPlay     = isPlaying
    ? "bg-[#185370] text-white border-[#185370]"
    : btnBase;

  const progress = playableIdxs.length > 0
    ? ((currentIdx + 1) / playableIdxs.length) * 100
    : 0;

  return (
    <div>
      {/* ── controles (sticky) ─────────────────────────────────────────── */}
      <div className={`sticky top-14 z-20 pb-3 pt-1 ${ctrlBg}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Anterior */}
          <button
            onClick={goPrev}
            disabled={currentIdx <= 0}
            title="Anterior"
            className={`border rounded px-3 py-1.5 text-xs transition disabled:opacity-25 ${btnBase}`}
          >
            ◀
          </button>

          {/* Play / Pause */}
          <button
            onClick={handlePlayPause}
            className={`border rounded px-4 py-1.5 text-xs font-semibold transition ${btnPlay}`}
          >
            {isPlaying ? "⏸ Pausar" : "▶ Autoplay"}
          </button>

          {/* Próximo */}
          <button
            onClick={goNext}
            disabled={currentIdx >= playableIdxs.length - 1}
            title="Próximo"
            className={`border rounded px-3 py-1.5 text-xs transition disabled:opacity-25 ${btnBase}`}
          >
            ▶
          </button>

          {/* Velocidade */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-xs select-none" style={{ color: muteColor }}>🐢</span>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-20 accent-[#185370] cursor-pointer"
              title={`${(intervalMs / 1000).toFixed(1)}s por linha`}
            />
            <span className="text-xs select-none" style={{ color: muteColor }}>🐇</span>
          </div>

          {/* Contador */}
          {currentIdx >= 0 && (
            <span className="text-xs ml-auto tabular-nums" style={{ color: muteColor }}>
              {currentIdx + 1} / {playableIdxs.length}
            </span>
          )}
        </div>

        {/* Barra de progresso */}
        <div className={`mt-2 h-0.5 rounded-full ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: activeBorder }}
          />
        </div>
      </div>

      {/* ── cifra ──────────────────────────────────────────────────────── */}
      <div className="font-mono text-sm leading-relaxed mt-4">
        {blocks.map((block, i) => {
          const playablePos = playableIdxs.indexOf(i);
          const isCurrent   = i === currentBlockIdx;
          const isPast      = playablePos !== -1 && playablePos < currentIdx;

          return (
            <div
              key={i}
              ref={(el) => { blockRefs.current[i] = el; }}
              onClick={() => {
                if (playablePos !== -1) {
                  setCurrentIdx(playablePos);
                  setIsPlaying(false);
                }
              }}
              style={{
                borderLeft: isCurrent
                  ? `3px solid ${activeBorder}`
                  : "3px solid transparent",
                background:  isCurrent ? activeBg : "transparent",
                paddingLeft: "10px",
                paddingTop:  "4px",
                paddingBottom: "4px",
                marginBottom: "0.6rem",
                borderRadius: "4px",
                opacity: isPast ? 0.35 : 1,
                cursor: block.kind === "pair" ? "pointer" : "default",
                transition: "opacity 0.3s, background 0.2s, border-color 0.2s",
              }}
            >
              {block.kind === "meta" && (
                <pre style={{ color: muteColor, whiteSpace: "pre-wrap", margin: 0 }}>
                  {block.text}
                </pre>
              )}

              {block.kind === "section" && (
                <span style={{ color: muteColor, fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {block.text}
                </span>
              )}

              {block.kind === "pair" && (
                <>
                  {block.chordLine && (
                    <div style={{ color: chordColor, fontWeight: 700 }}>
                      {block.chordLine}
                    </div>
                  )}
                  {block.lyricLine !== undefined && (
                    <div style={{ color: lyricColor }}>
                      {block.lyricLine || "\u00a0"}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

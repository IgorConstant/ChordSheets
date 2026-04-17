"use client";

import React from "react";

function fretCharToNum(c: string): number | null {
  if (c === "x" || c === "X") return null;
  if (c >= "a") return c.charCodeAt(0) - "a".charCodeAt(0) + 10;
  return parseInt(c, 10);
}

interface ChordResult {
  type: "chord" | "bass" | "piano";
  position?: { frets: string; fingers: string; barres?: number | number[] };
  root?: string;
  positions?: { string: string; fret: number }[];
  noteIndices?: number[]; // para piano: semitoms (dó=0..si=11), primeiro é a raiz
}

interface Props {
  name: string;
  result: ChordResult;
  size?: "sm" | "lg";
  dark?: boolean;
}

const LIGHT = { grid: "#d1d5db", nut: "#9ca3af", dot: "#185370", dotText: "#ffffff", muted: "#9ca3af", fretNum: "#9ca3af" };
const DARK  = { grid: "#4b5563", nut: "#6b7280", dot: "#5ba3c9",  dotText: "#ffffff", muted: "#6b7280", fretNum: "#6b7280" };

function GuitarDiagram({ position, size = "sm", c }: { position: NonNullable<ChordResult["position"]>; size?: "sm" | "lg"; c: typeof LIGHT }) {
  const scale = size === "lg" ? 2.0 : 1;
  const STRINGS = 6;
  const FRETS_SHOWN = 4;
  const W = 80 * scale;
  const H = 110 * scale;
  const PAD_LEFT = 18 * scale;
  const PAD_TOP = 26 * scale;
  const PAD_BOTTOM = 8 * scale;
  const STRING_GAP = (W - PAD_LEFT - 10 * scale) / (STRINGS - 1);
  const FRET_GAP = (H - PAD_TOP - PAD_BOTTOM) / FRETS_SHOWN;
  const DOT_R = 7 * scale;

  const fretNums = position.frets.split("").map(fretCharToNum);
  const fingerChars = position.fingers.split("");
  const barres = position.barres != null
    ? Array.isArray(position.barres) ? position.barres : [position.barres]
    : [];

  const nonNull = fretNums.filter((f): f is number => f !== null && f > 0);
  const minFret = nonNull.length > 0 ? Math.min(...nonNull) : 1;
  const startFret = minFret <= 1 ? 1 : minFret;

  const sx = (i: number) => PAD_LEFT + i * STRING_GAP;
  const fy = (fret: number) => PAD_TOP + (fret - startFret + 0.5) * FRET_GAP;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT + (STRINGS - 1) * STRING_GAP} y2={PAD_TOP}
        stroke={startFret === 1 ? c.nut : c.grid} strokeWidth={startFret === 1 ? 3 * scale : 1} />
      {Array.from({ length: FRETS_SHOWN }).map((_, i) => (
        <line key={i} x1={PAD_LEFT} y1={PAD_TOP + (i + 1) * FRET_GAP}
          x2={PAD_LEFT + (STRINGS - 1) * STRING_GAP} y2={PAD_TOP + (i + 1) * FRET_GAP}
          stroke={c.grid} strokeWidth={1} />
      ))}
      {Array.from({ length: STRINGS }).map((_, i) => (
        <line key={i} x1={sx(i)} y1={PAD_TOP} x2={sx(i)} y2={PAD_TOP + FRETS_SHOWN * FRET_GAP}
          stroke={c.grid} strokeWidth={1} />
      ))}
      {barres.map((b) => (
        <rect key={b} x={PAD_LEFT - DOT_R} y={fy(b) - DOT_R}
          width={(STRINGS - 1) * STRING_GAP + DOT_R * 2} height={DOT_R * 2} rx={DOT_R} fill={c.dot} />
      ))}
      {fretNums.map((fret, i) => {
        const x = sx(STRINGS - 1 - i);
        const y = PAD_TOP - 10 * scale;
        if (fret === null) return <text key={i} x={x} y={y} textAnchor="middle" fontSize={9 * scale} fill={c.muted}>✕</text>;
        if (fret === 0) return <circle key={i} cx={x} cy={y} r={4 * scale} fill="none" stroke={c.muted} strokeWidth={1.5} />;
        return null;
      })}
      {fretNums.map((fret, i) => {
        if (!fret) return null;
        const x = sx(STRINGS - 1 - i);
        const y = fy(fret);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={DOT_R} fill={c.dot} />
            <text x={x} y={y + 4 * scale} textAnchor="middle" fontSize={8 * scale} fill={c.dotText} fontWeight="bold">
              {fingerChars[i] !== "0" ? fingerChars[i] : ""}
            </text>
          </g>
        );
      })}
      {startFret > 1 && (
        <text x={PAD_LEFT - 4} y={PAD_TOP + FRET_GAP * 0.5 + 4 * scale} textAnchor="end" fontSize={8 * scale} fill={c.fretNum}>
          {startFret}
        </text>
      )}
    </svg>
  );
}

const BASS_STRINGS_LABEL = ["G", "D", "A", "E"];
const DOT_R_BASE = 7;

// Teclas brancas: dó ré mi fá sol lá si (semitoms 0 2 4 5 7 9 11)
const PIANO_WHITE_KEYS = [
  { semitone: 0,  label: "dó"  },
  { semitone: 2,  label: "ré"  },
  { semitone: 4,  label: "mi"  },
  { semitone: 5,  label: "fá"  },
  { semitone: 7,  label: "sol" },
  { semitone: 9,  label: "lá"  },
  { semitone: 11, label: "si"  },
];

// Teclas pretas: posição relativa à tecla branca à esquerda
const PIANO_BLACK_KEYS = [
  { whiteIdx: 0, semitone: 1  }, // dó#
  { whiteIdx: 1, semitone: 3  }, // ré#
  { whiteIdx: 3, semitone: 6  }, // fá#
  { whiteIdx: 4, semitone: 8  }, // sol#
  { whiteIdx: 5, semitone: 10 }, // lá#
];

function PianoDiagram({ noteIndices, size = "sm", c }: {
  noteIndices: number[];
  size?: "sm" | "lg";
  c: typeof LIGHT;
}) {
  const scale = size === "lg" ? 2.0 : 1;
  const WHITE_W  = 14 * scale;
  const WHITE_H  = 54 * scale;
  const BLACK_W  = 9  * scale;
  const BLACK_H  = 34 * scale;
  const LABEL_H  = 12 * scale;
  const W = 7 * WHITE_W + 1;
  const H = WHITE_H + LABEL_H + 2;

  const root    = noteIndices[0];
  const noteSet = new Set(noteIndices);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Teclas brancas */}
      {PIANO_WHITE_KEYS.map(({ semitone, label }, i) => {
        const isRoot   = semitone === root;
        const isActive = noteSet.has(semitone);
        return (
          <g key={i}>
            <rect
              x={i * WHITE_W + 0.5}
              y={0.5}
              width={WHITE_W - 1}
              height={WHITE_H - 1}
              rx={2}
              fill={isRoot ? c.dot : isActive ? "#93c5fd" : "white"}
              stroke={c.grid}
              strokeWidth={1}
            />
            <text
              x={i * WHITE_W + WHITE_W / 2}
              y={WHITE_H + LABEL_H * 0.8}
              textAnchor="middle"
              fontSize={5.5 * scale}
              fill={isActive ? (isRoot ? c.dot : "#3b82f6") : c.muted}
              fontWeight={isActive ? "bold" : "normal"}
            >
              {label}
            </text>
          </g>
        );
      })}
      {/* Teclas pretas */}
      {PIANO_BLACK_KEYS.map(({ whiteIdx, semitone }) => {
        const isRoot   = semitone === root;
        const isActive = noteSet.has(semitone);
        return (
          <rect
            key={semitone}
            x={(whiteIdx + 1) * WHITE_W - BLACK_W / 2}
            y={0.5}
            width={BLACK_W}
            height={BLACK_H}
            rx={2}
            fill={isRoot ? c.dot : isActive ? "#3b82f6" : "#1f2937"}
          />
        );
      })}
    </svg>
  );
}


function BassDiagram({ positions, size = "sm", c }: { positions: { string: string; fret: number }[]; size?: "sm" | "lg"; c: typeof LIGHT }) {
  const scale = size === "lg" ? 2.0 : 1;
  const BASS_STRINGS = 4;
  const BASS_FRETS = 5;
  const W = 80 * scale;
  const H = 110 * scale;
  const PAD_LEFT = 22 * scale;
  const PAD_TOP = 26 * scale;
  const STRING_GAP = (W - PAD_LEFT - 8 * scale) / (BASS_STRINGS - 1);
  const FRET_GAP = (H - PAD_TOP - 10 * scale) / BASS_FRETS;
  const DOT_R = DOT_R_BASE * scale;

  const best = positions.reduce((a, b) => (a.fret <= b.fret ? a : b));
  const stringIdx = BASS_STRINGS_LABEL.indexOf(best.string);
  const fret = best.fret;
  const startFret = fret === 0 ? 0 : Math.max(1, fret - 1);

  const sx = (i: number) => PAD_LEFT + i * STRING_GAP;
  const fy = (f: number) => PAD_TOP + (f - startFret + 0.5) * FRET_GAP;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT + (BASS_STRINGS - 1) * STRING_GAP} y2={PAD_TOP}
        stroke={startFret === 0 ? c.nut : c.grid} strokeWidth={startFret === 0 ? 3 * scale : 1} />
      {Array.from({ length: BASS_FRETS }).map((_, i) => (
        <line key={i} x1={PAD_LEFT} y1={PAD_TOP + (i + 1) * FRET_GAP}
          x2={PAD_LEFT + (BASS_STRINGS - 1) * STRING_GAP} y2={PAD_TOP + (i + 1) * FRET_GAP}
          stroke={c.grid} strokeWidth={1} />
      ))}
      {BASS_STRINGS_LABEL.map((label, i) => (
        <g key={i}>
          <line x1={sx(i)} y1={PAD_TOP} x2={sx(i)} y2={PAD_TOP + BASS_FRETS * FRET_GAP}
            stroke={c.grid} strokeWidth={1} />
          <text x={sx(i)} y={PAD_TOP - 8 * scale} textAnchor="middle" fontSize={8 * scale} fill={c.muted}>{label}</text>
        </g>
      ))}
      {fret === 0 ? (
        <circle cx={sx(stringIdx)} cy={PAD_TOP - 14 * scale} r={5 * scale} fill="none" stroke={c.muted} strokeWidth={1.5} />
      ) : (
        <g>
          <circle cx={sx(stringIdx)} cy={fy(fret)} r={DOT_R} fill={c.dot} />
          <text x={sx(stringIdx)} y={fy(fret) + 4 * scale} textAnchor="middle" fontSize={8 * scale} fill={c.dotText} fontWeight="bold">1</text>
        </g>
      )}
      {startFret > 1 && (
        <text x={PAD_LEFT - 4} y={PAD_TOP + FRET_GAP * 0.5 + 4 * scale} textAnchor="end" fontSize={8 * scale} fill={c.fretNum}>
          {startFret}
        </text>
      )}
    </svg>
  );
}

export default function ChordDiagram({ name, result, size = "sm", dark = false }: Props) {
  const c = dark ? DARK : LIGHT;
  const nameColor = dark ? "#9ca3af" : "#374151";
  const bassLabel = dark ? "#6b7280" : "#9ca3af";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`font-semibold ${size === "lg" ? "text-sm" : "text-xs"}`} style={{ color: nameColor }}>{name}</span>
      {result.type === "piano" && result.noteIndices ? (
        <PianoDiagram noteIndices={result.noteIndices} size={size} c={c} />
      ) : result.type === "bass" && result.positions ? (
        <BassDiagram positions={result.positions} size={size} c={c} />
      ) : result.position ? (
        <GuitarDiagram position={result.position} size={size} c={c} />
      ) : null}
      {result.type === "bass" && (
        <span className="text-[10px]" style={{ color: bassLabel }}>nota raiz</span>
      )}
    </div>
  );
}

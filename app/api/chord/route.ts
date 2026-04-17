import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchLyrics(song: string, artist: string): Promise<string> {
  const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Letra não encontrada. Tente informar o artista.");
  const data = await res.json();
  return data.lyrics as string;
}

export async function POST(req: NextRequest) {
  const { song, artist, instrument = "violão" } = await req.json();

  if (!song || !artist) {
    return NextResponse.json({ error: "Nome da música e artista são obrigatórios." }, { status: 400 });
  }

  const isTeclado = instrument === "teclado";
  const isGaita   = instrument === "gaita";

  const instrumentLabel: Record<string, string> = {
    violao:   "violão",
    guitarra: "guitarra",
    baixo:    "baixo (cifra de baixo com notas e posições)",
    ukulele:  "ukulele (acordes adaptados para ukulele)",
    teclado:  "teclado/piano (NOTAS em solfejo: dó ré mi fá sol lá si)",
    gaita:    "gaita diatônica",
  };

  const instrumentName = instrumentLabel[instrument] ?? instrument;

  let lyrics: string;
  try {
    lyrics = await fetchLyrics(song, artist);
  } catch {
    return NextResponse.json({ error: "Letra não encontrada. Verifique o nome da música e o artista." }, { status: 404 });
  }

  const prompt = `Você é um especialista em cifras para ${instrumentName}.

Abaixo está a letra REAL da música "${song}" de ${artist}.
Sua tarefa é adicionar a tablatura CORRETA para ${instrumentName} acima de cada linha.

REGRAS:
1. Use as notas reais da melodia da música
2. Coloque a tablatura em uma linha separada ACIMA da linha de letra correspondente
3. Alinhe cada nota sobre a sílaba correta
4. Inclua no topo: título, artista e tonalidade da gaita recomendada (ex: Gaita em C, Gaita em G)
5. Identifique seções (Intro, Verso, Refrão, Ponte, Outro)
6. Sem markdown, sem asteriscos, apenas texto simples
${isTeclado ? `7. Para teclado: escreva as NOTAS do acorde em solfejo (dó ré mi fá sol lá si) separadas por ESPAÇO SIMPLES, em vez do nome do acorde. Use 8 ou mais espaços para separar acordes diferentes na mesma linha. Exemplos: Dó maior = "dó mi sol", Lá menor = "lá dó mi", Sol maior = "sol si ré". Use dó# para sustenido e réb/mib/solb/láb/sib para bemóis.` : ""}
${isGaita ? `7. Para gaita diatônica: use a notação padrão de tablatura de gaita:
   - Número = buraco (1 a 10)
   - Sinal + = soprar (blow), sem sinal = puxar/inspirar (draw)
   - Exemplo: +4 = buraco 4 soprado, 4 = buraco 4 puxado
   - Bends: adicione ' para meio tom (ex: 3'), '' para tom inteiro (ex: 3'')
   - Escreva cada nota separada por espaço, alinhada sobre a sílaba correta
   - Informe a afinação da gaita recomendada (C, G, D, A etc.)` : ""}

EXEMPLO DE FORMATO:
${isGaita
  ? `+4  4  +4  5  +5  5  +4
Co  le  o  que  vo  cê  tem`
  : isTeclado
  ? `dó mi sol        lá dó mi        fá lá dó
Cole o que você tem e vai em frente`
  : `C#m          A        E
Cole o que você tem e vai em frente`}

LETRA:
${lyrics}

Gere a tablatura completa agora.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const chordSheet = completion.choices[0].message.content ?? "";
    return NextResponse.json({ chordSheet });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

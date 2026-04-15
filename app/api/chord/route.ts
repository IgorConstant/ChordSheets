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

  const instrumentLabel: Record<string, string> = {
    violao: "violão",
    guitarra: "guitarra",
    baixo: "baixo (cifra de baixo com notas e posições)",
    ukulele: "ukulele (acordes adaptados para ukulele)",
    teclado: "teclado/piano",
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
Sua tarefa é adicionar os acordes/notas CORRETOS para ${instrumentName} acima de cada linha.

REGRAS:
1. Use os acordes reais da música
2. Coloque os acordes em uma linha separada ACIMA da linha de letra correspondente
3. Alinhe cada acorde sobre a sílaba correta
4. Inclua no topo: título, artista, tom original e capotraste (se aplicável)
5. Identifique seções (Intro, Verso, Refrão, Ponte, Outro)
6. Sem markdown, sem asteriscos, apenas texto simples

EXEMPLO DE FORMATO:
C#m          A        E
Cole o que você tem e vai em frente

LETRA:
${lyrics}

Gere a cifra completa agora.`;

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

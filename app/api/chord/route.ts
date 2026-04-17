import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function toKebab(str: string) {
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchFromLetras(song: string, artist: string): Promise<string> {
  const url = `https://www.letras.mus.br/${toKebab(artist)}/${toKebab(song)}/`;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(10000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ChordSheetBot/1.0)" },
  });
  if (!res.ok) throw new Error(`letras ${res.status}`);
  const html = await res.text();
  const match = html.match(/class="lyric-original">([\s\S]*?)<\/div>/);
  if (!match) throw new Error("lyrics container not found");
  const lyrics = match[1]
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (lyrics.length < 20) throw new Error("empty lyrics");
  return lyrics;
}

async function fetchLyrics(song: string, artist: string): Promise<string> {
  // Tenta lyrics.ovh e letras.mus.br em paralelo
  const results = await Promise.allSettled([
    fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`,
      { signal: AbortSignal.timeout(20000) }
    ).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      if (!d.lyrics) throw new Error("empty");
      return d.lyrics as string;
    }),
    fetchFromLetras(song, artist),
  ]);

  const found = results.find(r => r.status === "fulfilled");
  if (found?.status === "fulfilled") return found.value;
  throw new Error("not found");
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

Abaixo está a letra REAL da música. Use-a para construir a cifra:

LETRA:
${lyrics}

Sua tarefa é gerar a cifra COMPLETA de "${song}" de ${artist} para ${instrumentName}.

REGRAS:
1. Use os acordes/notas reais da música
2. Coloque os acordes em uma linha separada ACIMA da linha de letra correspondente
3. Alinhe cada acorde sobre a sílaba correta
4. Inclua no topo: título, artista, tom original e capotraste (se aplicável)
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

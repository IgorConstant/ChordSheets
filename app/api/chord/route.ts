import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchLyrics(song: string, artist: string): Promise<string | null> {
  // 1ª tentativa: lyrics.ovh
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (res.ok) {
      const data = await res.json();
      if (data.lyrics) return data.lyrics as string;
    }
  } catch { /* ignora */ }

  // 2ª tentativa: Genius
  try {
    const token = process.env.GENIUS_ACCESS_TOKEN;
    if (token) {
      const searchRes = await fetch(
        `https://api.genius.com/search?q=${encodeURIComponent(`${song} ${artist}`)}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const hit = searchData.response?.hits?.[0]?.result;
        if (hit?.url) {
          const pageRes = await fetch(hit.url, { signal: AbortSignal.timeout(8000) });
          if (pageRes.ok) {
            const html = await pageRes.text();
            // Extrai texto dos containers de lyrics do Genius
            const containers = [...html.matchAll(/data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g)];
            if (containers.length > 0) {
              const lyrics = containers
                .map(([, inner]) =>
                  inner
                    .replace(/<br\s*\/?>/gi, "\n")
                    .replace(/<[^>]+>/g, "")
                    .replace(/&amp;/g, "&")
                    .replace(/&apos;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&#x27;/g, "'")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                )
                .join("\n")
                .trim();
              if (lyrics.length > 50) return lyrics;
            }
          }
        }
      }
    }
  } catch { /* ignora */ }

  return null;
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

  const lyrics = await fetchLyrics(song, artist);

  const lyricsSection = lyrics
    ? `Abaixo está a letra REAL da música. Use-a para construir a cifra:\n\nLETRA:\n${lyrics}`
    : `A letra não foi encontrada automaticamente. Use seu conhecimento para gerar a cifra completa de "${song}" de ${artist}, incluindo a letra e os acordes corretos.`;

  const prompt = `Você é um especialista em cifras para ${instrumentName}.

${lyricsSection}

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

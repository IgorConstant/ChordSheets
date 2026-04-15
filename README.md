# 🎸 Cifra — Gerador de Cifras com IA

App web que busca a letra real de uma música e usa IA para gerar a cifra formatada, limpa e sem anúncios. Um projeto de [o som do silêncio](https://osomdosilencio.com.br).

---

## Como funciona

1. Usuário digita o nome da música + artista
2. App busca a letra real via **lyrics.ovh** (API gratuita, sem chave)
3. IA (**Groq / LLaMA 3.3 70B**) recebe a letra e adiciona os acordes acima de cada linha
4. Resultado exibido em tela limpa, sem anúncios, sem distrações

---

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS**
- **Groq SDK** (LLaMA 3.3 70B) — gratuito
- **lyrics.ovh** — API pública de letras, sem autenticação
- Deploy recomendado: **Vercel** (`cifras.osomdosilencio.com.br`)

---

## Instrumentos suportados

| Instrumento | Tipo de saída |
|---|---|
| 🎸 Violão | Cifra (acordes) |
| ⚡ Guitarra | Cifra (acordes) |
| 🎵 Baixo | Cifra para baixo |
| 🌺 Ukulele | Acordes adaptados para ukulele |
| 🎹 Teclado | Cifra (acordes) |

---

## Guia visual de acordes

O botão **"🎓 Ver acordes"** abre um sidebar com diagramas SVG de todos os acordes presentes na cifra gerada — útil para iniciantes aprenderem a posição dos dedos.

---

## Estrutura do projeto

```
chord-sheet/
├── app/
│   ├── page.tsx                  # UI principal
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── chord/route.ts        # Busca letra + chama IA
│       ├── chord-diagram/route.ts # Diagramas de acordes
│       └── telegram/route.ts     # Webhook do bot Telegram (futuro)
├── components/
│   ├── ChordSidebar.tsx          # Sidebar com guia de acordes
│   └── ChordDiagram.tsx          # Diagramas SVG
├── lib/
│   └── chords.ts                 # Extrator de acordes do texto
├── .env.local                    # Chaves (não commitar)
└── package.json
```

---

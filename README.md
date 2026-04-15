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

## Configuração local

### 1. Instalar dependências

```bash
cd Estudos/chord-sheet
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local`:

```env
GROQ_API_KEY=sua-chave-do-groq
```

**Onde pegar a chave do Groq (gratuito, sem cartão):**
→ https://console.groq.com/keys

### 3. Rodar

```bash
npm run dev
```

Acesse: http://localhost:3000

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

## Deploy no Vercel

```bash
npx vercel
```

Adicione a variável de ambiente no painel do Vercel:
- `GROQ_API_KEY`

Para usar com subdomínio, adicione um `CNAME` no seu DNS:
- `cifras` → `cname.vercel-dns.com`

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

## Próximos passos sugeridos

- [ ] Transpositor de tom (+/- semitons)
- [ ] Botão de imprimir / salvar como PDF
- [ ] Histórico de cifras geradas
- [ ] Tablatura para baixo


App web que busca a letra real de uma música e usa IA para gerar a cifra formatada, limpa e sem anúncios.

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
- Deploy recomendado: **Vercel**

---

## Configuração local

### 1. Instalar dependências

```bash
cd Estudos/chord-sheet
npm install
```

### 2. Configurar variáveis de ambiente

Edite o arquivo `.env.local`:

```env
GROQ_API_KEY=sua-chave-do-groq
UNLOCK_CODES=CIFRA-A1B2,CIFRA-C3D4,CIFRA-E5F6,CIFRA-G7H8,CIFRA-I9J0
```

**Onde pegar a chave do Groq (gratuito, sem cartão):**
→ https://console.groq.com/keys

### 3. Rodar

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Modelo de negócio

| Plano | O que oferece | Preço |
|---|---|---|
| **Gratuito** | 5 cifras | R$ 0 |
| **Ilimitado** | Cifras ilimitadas | R$ 10,00 (pagamento único) |

### Fluxo de pagamento

1. Usuário usa as 5 cifras gratuitas
2. Modal de pagamento aparece automaticamente
3. Usuário paga via **PIX** (chave: `6b07fc79-82d3-43fc-9937-7a04d6e0e4c8`)
4. Usuário envia comprovante + e-mail para `igorhenriqueconstant@gmail.com`
5. Você envia um código de desbloqueio manualmente
6. Usuário digita o código → acesso ilimitado liberado

### Gerenciar códigos de desbloqueio

Os códigos ficam no `.env.local` na variável `UNLOCK_CODES` (separados por vírgula):

```env
UNLOCK_CODES=CIFRA-A1B2,CIFRA-C3D4,CIFRA-E5F6
```

- Cada código pode ser usado **uma vez por dispositivo** (controle via localStorage)
- Quando os códigos acabarem, adicione mais e faça redeploy no Vercel
- Sugestão de formato: `CIFRA-XXXX` (4 caracteres aleatórios em maiúsculo)

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

## Deploy no Vercel

```bash
npx vercel
```

Adicione as variáveis de ambiente no painel do Vercel:
- `GROQ_API_KEY`
- `UNLOCK_CODES`

---

## Estrutura do projeto

```
chord-sheet/
├── app/
│   ├── page.tsx                  # UI principal (busca, seletor, paywall)
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── chord/
│       │   └── route.ts          # Busca letra + chama IA
│       └── validate-code/
│           └── route.ts          # Valida código de desbloqueio
├── .env.local                    # Chaves e códigos (não commitar)
└── package.json
```

---

## Próximos passos sugeridos

- [ ] Tablatura para baixo (em vez de cifra)
- [ ] Transpositor de tom (+/- semitons)
- [ ] Botão de imprimir / salvar como PDF
- [ ] Automação do envio do código por e-mail (ex: Resend)
- [ ] Histórico de cifras geradas

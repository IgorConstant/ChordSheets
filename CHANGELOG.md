# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

---

## [1.1.0] — 2026-04-17

### Adicionado
- **Gaita Diatônica** como novo instrumento
  - Tablatura com notação padrão: número do buraco + direção do ar (`+4` soprar, `4` puxar)
  - Suporte a bends: `3'` (meio tom), `3''` (tom inteiro)
  - IA indica a afinação de gaita recomendada (ex: Gaita em C, Gaita em G)
  - Sidebar exibe legenda interativa da tablatura em vez de diagramas de acordes

- **Modo Autoplay / Karaokê** (`ChordPlayer`)
  - Percorre automaticamente os blocos de acorde + letra da cifra
  - Controles de play/pause, voltar e avançar bloco
  - Controle de velocidade (slider 🐢–🐇)
  - Barra de progresso clicável
  - Auto-scroll para o bloco atual
  - Clique em qualquer bloco para pular direto para ele
  - Blocos já passados são exibidos com opacidade reduzida

- **Mapeamento de teclas do piano para Teclado**
  - Sidebar e guia de acordes exibem diagrama SVG de piano com uma oitava (Dó–Si)
  - Teclas ativas destacadas com cor; nota raiz em destaque diferenciado
  - Rótulos em solfejo (dó, ré, mi…) abaixo de cada tecla branca
  - Notas calculadas localmente (sem chamada de API)

- **Notas em solfejo no Teclado**
  - Para o instrumento Teclado, a IA gera notas em solfejo (dó, ré, mi, fá, sol, lá, si) em vez de nomes de acordes
  - Suporte a sustenidos (`dó#`) e bemóis (`réb`, `mib`, `solb`, `láb`, `sib`)

### Melhorado
- **Guia de acordes ampliado** — diagramas em escala `2.0×` (antes `1.6×`)
- **Sidebar alargada** de `w-72` para `w-96` com layout `flex-wrap` para acomodar diagramas de piano e guitarra lado a lado

### Corrigido
- Diagramas de piano desaparecendo do "Ver Acordes": regex de separação de grupos de notas corrigida de `\s{2,}` para `\s{4,}`, evitando que notas do mesmo acorde fossem separadas incorretamente

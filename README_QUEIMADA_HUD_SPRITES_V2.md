# Queimada — HUD e sprites V2

Integração visual baseada no mockup aprovado.

## HUD
- Topo: marca Voltz, turno, apenas HP do jogador e botão de fechar.
- HP do Capitão Rubro foi removido do topo e permanece apenas no card central do rival.
- Área central virou uma arena visual real com fundo em 4 camadas.
- Caixa de diálogo e menu 2x2 foram redesenhados em código.

## Background em camadas
1. `arena-bg.webp` — fundo distante/luz ambiente.
2. `arena-stands.webp` — arquibancada/estrutura.
3. `arena-floor.webp` — piso.
4. `arena-overlay.webp` — brilho/overlay, com animação sutil.

## Sprites de bola
- reta
- curva
- forte
- agarrável/verde
- bomba

## VFX
- impacto leve
- impacto forte
- rastro/traço da bola

## Alma Voltz
- coração azul com símbolo elétrico.
- 3 frames alternados em loop para animar a eletricidade.

A lógica de combate, Rally Rubro, Devolução Perfeita, áudio e demais minigames foi preservada.

# VOLTZ — Direção Sonora Oficial V1

## Identidade
Voltz Education adota uma linguagem sonora **chiptune / 8-bit original**, inspirada na sensação dos RPGs de portátil sem reproduzir melodias de jogos existentes.

## Leitmotiv Voltz
A assinatura melódica usa um contorno de seis notas que reaparece com variações maiores/menores em temas, vitórias e recompensas. A intenção é fazer o jogador reconhecer "Voltz" mesmo quando a instrumentação muda.

## Temas implementados
- `voltz-vila.ogg` — aventureiro, acolhedor e memorável.
- `voltz-matematica.ogg` — arpejos precisos e mecânicos.
- `voltz-portugues.ogg` — melódico, misterioso e mais espaçado.
- `voltz-educacao-fisica.ogg` — rápido, rítmico e energético.
- `voltz-batalha.ogg` — combate tradicional compartilhado entre os reinos.
- `voltz-capitao-rubro.ogg` — tema de rival específico da Queimada.

## SFX
A pasta `assets/audio/sfx/` contém 30 efeitos originais em 8-bit para interface, interação, progresso, batalha e Queimada.

## Integração
- Música muda automaticamente por cena/reino.
- Interiores usam o tema da Vila por enquanto.
- Combates tradicionais substituem temporariamente a música do mapa pelo tema de batalha e restauram a faixa da cena ao fechar.
- Queimada usa o tema do Capitão Rubro e restaura Educação Física ao retornar ao reino.
- O `AudioManager` mantém fallback sintetizado caso um arquivo falhe ao carregar.

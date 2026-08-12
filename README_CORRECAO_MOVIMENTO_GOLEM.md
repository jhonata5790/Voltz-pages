# Correção — jogador preso após o Golem

## Causa

Ao concluir o desafio do Golem, o save faz o guardião reaparecer como NPC amigável no mesmo ponto do boss. Dependendo da posição em que o jogador iniciou a batalha, o novo colisor do NPC podia surgir sobre a hitbox do jogador. O personagem recebia direção normalmente, mas qualquer tentativa de deslocamento era rejeitada pela colisão.

## Correção

- Ao fechar uma batalha, `releasePlayerFromCollision()` verifica a posição atual.
- Se a hitbox estiver dentro de um colisor criado/alterado durante a batalha, o jogador é movido apenas o mínimo necessário até o ponto livre mais próximo.
- A correção é genérica e também protege futuros bosses, NPCs e mudanças persistentes do mapa.
- O inventário de mundo aberto agora também é explicitamente considerado um overlay que pausa o movimento.

## Teste recomendado

1. Use o Painel Dev para liberar o Golem.
2. Inicie o desafio e chegue a 50%.
3. Avance o diálogo e receba o Diploma da Matemática.
4. Ao retornar ao mapa, teste WASD em todas as direções.
5. Converse com o Golem amigável e confirme que ele continua no local.

# Queimada — Arena Full HUD V3

Atualização de layout e movimento.

## Layout
- Arena visual agora ocupa toda a área útil abaixo do HUD superior.
- Os quatro comandos principais ficam lado a lado na parte inferior.
- A caixa de diálogo fica logo acima dos comandos.
- HP do Rubro continua apenas no card central da arena.
- HUD superior mantém apenas turno + HP do jogador.

## Transformação diálogo -> esquiva
No turno inimigo, a própria caixa de diálogo:
1. acende;
2. expande com uma transição de ~0,38 s;
3. vira a caixa de esquiva;
4. cresce por cima do cenário e pode encobrir parte do Capitão Rubro;
5. recebe a Alma Voltz e os projéteis.

## Movimento
O movimento agora usa velocidade real em pixels.
Antes, X e Y avançavam a mesma porcentagem da arena, o que fazia o eixo vertical
ser muito mais lento em uma arena larga. A velocidade horizontal existente foi
preservada e aplicada igualmente ao eixo vertical.

Nenhuma regra de ataque, Rally Rubro, Devolução Perfeita ou áudio foi removida.

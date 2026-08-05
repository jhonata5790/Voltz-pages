# World

Módulos responsáveis pelo funcionamento do mundo aberto.

Estrutura planejada:

- `state.js`: estado do mundo, jogador e câmera.
- `player.js`: movimento, direção e animação do jogador.
- `camera.js`: acompanhamento e limites da câmera.
- `collisions.js`: colisões e hitboxes.
- `renderer.js`: criação e atualização dos elementos visuais do mapa.
- `input.js`: teclado e controles de movimento.

O código será migrado gradualmente de `assets/js/openworld.js` para evitar quebrar o jogo durante a refatoração.

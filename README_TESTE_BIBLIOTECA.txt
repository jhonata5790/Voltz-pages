VOLTZ EDUCATION — TESTE LOCAL DA BIBLIOTECA

1. Abra esta pasta no VS Code.
2. Inicie game.html com Live Server.
3. Caminhe até a porta frontal da Biblioteca de Dicas e entre andando para cima.
4. O mapa exterior será ocultado, a câmera dará zoom e o jogador ficará menor.
5. Para sair, caminhe pela porta ao sul do interior.

Também é possível iniciar pelo terminal:
python -m http.server 8000

Depois acesse:
http://localhost:8000/game.html

ATUALIZAÇÃO — COLISORES DO INTERIOR
- Estantes, mesa, pufes e balcão agora possuem caixas físicas próprias.
- A colisão está alinhada à base visual de cada móvel.
- Ao se aproximar pela frente, o jogador é bloqueado antes de ser desenhado atrás do objeto.
- Ainda é possível passar visualmente atrás dos móveis ao contorná-los, como esperado em um mapa top-down.

ATUALIZAÇÃO — SISTEMA MODULAR
- A lógica comum foi movida para assets/js/interiors/interior-system.js.
- O registro central fica em assets/js/interiors/interior-data.js.
- A Biblioteca agora contém somente seu mapa, móveis, colisores, visual e configurações.
- O openworld.js não possui mais regras específicas da Biblioteca.

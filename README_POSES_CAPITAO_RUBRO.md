# Poses do Capitão Rubro

Foram integradas duas novas poses à Queimada.

- `assets/images/rivals/capitao-rubro-ataque.png`
  - usada durante carga, finta e arremessos do Rubro nas fases normais;
  - o estado neutro continua usando `capitao-rubro.png`.

- `assets/images/rivals/capitao-rubro-fase2.png`
  - ativada quando o Capitão Rubro fica com 30% de HP ou menos;
  - também tem prioridade durante o Rally Rubro;
  - permanece como a linguagem visual do trecho final da luta.

Fallback:
- caso qualquer pose extra falhe ao carregar, o jogo volta automaticamente para `capitao-rubro.png`.

Nenhum outro minigame foi alterado.

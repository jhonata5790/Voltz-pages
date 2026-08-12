# Correção — Agarrão da Queimada

O problema era uma inconsistência entre feedback e input:

- a bola começava a brilhar em 78 px;
- o agarrão só aceitava até 70 px;
- apertar cedo aplicava 260 ms de cooldown, maior que a própria janela útil.

Correções:

- brilho e captura agora usam a mesma distância: **104 px**;
- `Espaço` reconhece `event.key` e `event.code === "Space"`;
- input antecipado recebe **buffer de 160 ms** em vez de punição;
- o player e a bola mostram feedback explícito quando o agarrão está disponível;
- aparece `AGARRA! [ESPAÇO]` no momento correto;
- segurar Espaço não vira auto-catch: repetições automáticas do teclado são ignoradas.

Perfect Catch continua exigindo proximidade maior (46 px).

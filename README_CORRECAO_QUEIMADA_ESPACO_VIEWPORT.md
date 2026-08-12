# Correção — Queimada: Espaço + viewport

## Bug do Espaço

O lançamento era processado, mas `selectedThrow` era limpo antes de `renderDodgeballAim()` redesenhar a tela. A renderização acessava `option.min/max` depois de `option` virar `null`, causando erro de JavaScript e deixando a tela visualmente parada.

Correções:
- `selectedThrow` permanece até a resolução visual terminar;
- bloqueio contra lançamento duplo;
- botão fica desabilitado durante a resolução;
- detecção de Espaço também usa `event.code === "Space"`.

## Viewport

Quando a Queimada está ativa, o painel recebe `dodgeball-fit` e usa um layout compacto específico:
- sem scroll durante a luta;
- Capitão Rubro menor;
- topbar, diálogo, HUD e menus compactados;
- arena de esquiva se adapta à altura disponível;
- outros minigames mantêm o layout anterior.

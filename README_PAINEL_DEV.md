# Painel Dev — Voltz Education

Ferramenta interna para acelerar testes do jogo.

## Abrir

### PC
1. Dentro de `game.html`, pressione **P**.
2. Digite `menu`.
3. Pressione Enter.

### Celular
1. Abra o jogo normalmente no celular.
2. Os controles touch aparecem automaticamente em telas pequenas/dispositivos touch.
3. Toque em **DEV** no canto superior.
4. Digite `menu`.

Também é possível forçar a interface mobile adicionando `?mobile=1` ao endereço. `?mobile=0` desativa na sessão atual.

## Painel atualizado

O Painel Dev agora inclui:
- teleporte dos reinos já implementados;
- conclusão/restauração individual das 5 modalidades de Educação Física;
- atalhos diretos para Futebol, Vôlei V0.3 e Queimada standalone;
- abertura rápida de Basquete, Atletismo e Pentatlo;
- controle separado do final/diploma de Educação Física;
- Rally Rubro e Devolução Perfeita;
- toggle dos controles touch;
- recursos, buffs, batalha e diagnóstico do SAVE.

## Sessão x SAVE

- **Sessão:** teleporte, velocidade, Ritmo Lógico, colisores, abertura de testes e controles mobile. Não persiste progresso.
- **SAVE:** progresso de inimigos/bosses/equações, modalidades, diplomas, XP, moedas e itens. Essas ações usam o perfil real no Supabase.

> O código `menu` serve apenas para esconder a ferramenta da interface normal. Como o projeto é front-end e público, isso não é um mecanismo de segurança.

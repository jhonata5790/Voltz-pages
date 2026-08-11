# Painel Dev — Voltz Education

Ferramenta interna para acelerar testes do jogo.

## Abrir

1. Dentro de `game.html`, pressione **P**.
2. Digite `menu`.
3. Pressione Enter.

## Sessão x SAVE

- **Sessão:** teleporte, velocidade, Ritmo Lógico e colisores. Não persiste ao recarregar.
- **SAVE:** progresso de inimigos/bosses/equações, XP, moedas e itens. Essas ações usam o perfil real no Supabase.

O botão de reset da Matemática apaga apenas o progresso do reino; XP, moedas e inventário continuam intactos.

> O código `menu` serve apenas para esconder a ferramenta da interface normal. Como o projeto é front-end e público, isso não é um mecanismo de segurança.

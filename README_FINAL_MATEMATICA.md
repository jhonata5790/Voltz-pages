# Final do Reino da Matemática

## Golem dos Cálculos

- 600 PV.
- Ao chegar a 300 PV (50%), o combate é interrompido.
- O Golem não é derrotado: ele reconhece o aprendizado do jogador.
- O diálogo final entrega o **Diploma da Matemática**.
- A conclusão salva `guardianChallengeCompleted` no progresso do reino.
- O diploma fica em `progresso._world.diplomas["reino-matematica"]`.
- Nenhuma coluna nova no Supabase é necessária.

## Raciocínio Estruturado

O Diploma da Matemática desbloqueia uma habilidade permanente disponível na Mochila de qualquer batalha:

- 1 uso por batalha.
- Elimina uma alternativa incorreta da pergunta atual.
- Não é consumível.
- A habilidade é derivada do diploma salvo no perfil.

## Depois da conclusão

O Golem deixa de ser um inimigo e aparece na Fortaleza como NPC amigável com diálogo próprio.

## Painel Dev

`P` → `menu` → **Concluir guardião/Golem** também concede o diploma, sem XP/moedas, para testes.
**Restaurar Golem** remove a conclusão do guardião e o diploma, preservando o restante do progresso do reino.

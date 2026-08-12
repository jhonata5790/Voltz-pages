# Reino de Educação Física — Complexo Esportivo Voltz

Terceiro reino jogável.

## Estrutura

O reino não usa o combate de perguntas como progressão principal.

Modalidades:

1. Futebol — pênaltis com canto + força
2. Basquete — timing de arremesso
3. Atletismo — reação + alternância A/D
4. Vôlei — sequência rítmica A/S/D
5. Queimada — turnos de ataque + fase de esquiva em arena

Depois das cinco modalidades, o **Estádio Voltz** libera o **Pentatlo Voltz**:
versões curtas das cinco provas em sequência.

## Progressão e save

O save usa:

- `progresso["reino-educacao-fisica"].completedMinigameIds`
- `guardianChallengeCompleted`
- `_world.completedRealmIds`
- `_world.diplomas`

Cada primeira conclusão de modalidade concede 45 XP e 12 moedas.
Repetições funcionam como treino sem recompensa duplicada.

O Pentatlo concede:

- Diploma de Educação Física
- 260 XP
- 100 moedas
- Competência permanente **Reflexos Treinados**

### Reflexos Treinados

Uma vez por batalha, adiciona **6 segundos** ao cronômetro da pergunta atual.

## Painel DEV

P → `menu`

Há teleporte para todas as áreas esportivas, além de:

- Concluir 5 modalidades
- Resetar Educação Física

Nenhum SQL novo é necessário.

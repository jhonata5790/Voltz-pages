# Salvamento persistente do Voltz

O save usa a tabela `public.profiles` do Supabase.

## 1. Preparar o banco

Execute **uma vez** no SQL Editor do Supabase:

`supabase/001_profile_progress.sql`

A migration é segura para rodar novamente porque usa `add column if not exists`.

## 2. O que fica salvo

- XP
- moedas
- combo/rank
- inventário (`_inventory`)
- inimigos comuns derrotados por reino
- mini-chefe derrotado
- chefe derrotado
- conclusão do reino
- lista global de reinos concluídos (`_world.completedRealmIds`)

Exemplo simplificado da coluna `progresso`:

```json
{
  "_inventory": {
    "dica-foco": 2
  },
  "_world": {
    "completedRealmIds": []
  },
  "reino-matematica": {
    "defeatedEnemyIds": ["soma-01", "fator-02"],
    "miniBossDefeated": false,
    "bossDefeated": false,
    "completed": false
  }
}
```

## 3. Vitória atômica

`VoltzProfile.completeEncounter(...)` salva na mesma atualização da linha:

- o inimigo derrotado;
- XP recebido;
- moedas recebidas;
- flags de mini-chefe/chefe/conclusão.

Isso evita o caso de receber a recompensa e o inimigo reaparecer após recarregar.

## 4. Novos reinos

Qualquer reino registrado em `window.VoltzData.realms` que siga o formato:

- `id`
- `progressKey`
- `commonEnemies`
- `miniBoss`
- `boss`
- `scene`

já usa o mesmo motor de persistência do mapa.

## 5. Teste rápido

1. Entre em uma conta.
2. Derrote um inimigo no Reino da Matemática.
3. Espere a tela mostrar `✓ Progresso salvo`.
4. Atualize a página ou saia e entre novamente.
5. Volte ao Reino da Matemática.
6. O inimigo derrotado não deve reaparecer e XP/moedas devem continuar no perfil.

Se a tela mostrar aviso de que o banco não confirmou o salvamento, confirme primeiro se `001_profile_progress.sql` foi executado no projeto Supabase correto.

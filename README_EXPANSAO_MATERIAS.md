# Expansão de matérias — estrutura preparada

O jogo agora separa **motor**, **dados do reino** e **perfil/progresso**.

## Onde fica cada coisa

- `assets/js/openworld.js`: motor do mapa, câmera, colisão, interação e troca de cenas.
- `assets/js/battle.js`: motor de batalha.
- `assets/js/realms/realm-data.js`: lista dos reinos exibidos no Portal.
- `assets/js/realms/math/math-data.js`: conteúdo exclusivo da Matemática (modelo para as próximas matérias).
- `assets/js/core/game-profile.js`: sessão, HUD, XP, moedas e progresso persistente.
- `supabase/001_profile_progress.sql`: migration das colunas de progresso.

## Para criar uma nova matéria

1. Crie uma pasta em `assets/js/realms/<materia>/`.
2. Copie a estrutura de `math/math-data.js`.
3. Use um `id` igual ao id registrado em `realm-data.js`.
4. Defina no mínimo:
   - `enemyTypes`
   - `commonEnemies`
   - `scene`
5. Carregue o novo arquivo em `game.html` **antes** de `openworld.js`.
6. Em `realm-data.js`, mude `unlocked` para `true` quando o reino estiver pronto.

O `selectRealm()` já procura automaticamente cenas registradas em `window.VoltzData.realms`, então não é necessário criar outro `if (realmId === ...)` para cada matéria.

## Progresso

Use uma chave por reino:

```js
window.VoltzProfile.getRealmProgress("reino-gramatica");
window.VoltzProfile.setRealmProgress("reino-gramatica", {
  defeatedEnemyIds: [],
  miniBossDefeated: false,
  bossDefeated: false
});
```

O objeto completo é guardado na coluna JSONB `progresso`, evitando criar dezenas de colunas novas conforme entram novas matérias.

## Debug

Não existe mais uma segunda cópia do jogo para teste.

- normal: `game.html`
- debug: `game.html?debug=1`
- `openworld-test.html` apenas redireciona para o modo debug.

No modo debug, `F3` liga/desliga os colisores.

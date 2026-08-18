from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
text = path.read_text(encoding='utf-8')

old = '''  function volleyballChooseAttacker(g, team, setterId, input = null) {
    const candidates = volleyballTeamPlayers(g, team).filter((player) => player.id !== setterId);
    if (!candidates.length) return null;
    if (input?.moving && Math.abs(input.x) > .2) {
      return candidates.slice().sort((a, b) => input.x < 0 ? a.x - b.x : b.x - a.x)[0];
    }
    const defenders = volleyballTeamPlayers(g, team === "voltz" ? "rival" : "voltz");
    return candidates.slice().sort((a, b) => {
      const aSpace = Math.min(...defenders.map((defender) => Math.abs(defender.x - a.x)));
      const bSpace = Math.min(...defenders.map((defender) => Math.abs(defender.x - b.x)));
      return bSpace - aSpace;
    })[0];
  }
'''

new = '''  function volleyballAttackerRead(g, team, setter, candidate, input = null) {
    const opponents = volleyballTeamPlayers(g, team === "voltz" ? "rival" : "voltz");
    const attackY = team === "voltz" ? 56.5 : 43.5;
    const dx = candidate.x - setter.x;
    const dy = candidate.y - setter.y;
    const length = Math.hypot(dx, dy) || 1;
    const dirX = dx / length;
    const dirY = dy / length;
    const dot = input?.moving ? dirX * input.x + dirY * input.y : 0;

    // A direcao do movimento define um CONE de intencao, nao um alvo exato.
    // Dentro desse setor o jogo prioriza quem realmente consegue atacar melhor.
    const directionScore = input?.moving ? clamp((dot + 1) / 2, 0, 1) : .55;
    const reachDistance = Math.hypot(candidate.x - candidate.x, candidate.y - attackY);
    const reachBudget = VOLLEY_PLAYER_SPEED * .78 + 4;
    const reachability = clamp(1 - reachDistance / reachBudget, 0, 1);

    const netDistance = Math.abs(candidate.y - 50);
    const approachRoom = clamp((netDistance - 3) / 18, 0, 1);

    const blockers = opponents.filter((opponent) =>
      team === "voltz"
        ? opponent.y >= 24 && opponent.y <= 48
        : opponent.y >= 52 && opponent.y <= 76
    );
    const blockSpace = blockers.length
      ? clamp(Math.min(...blockers.map((blocker) => Math.abs(blocker.x - candidate.x))) / 30, 0, 1)
      : 1;

    const roleBonus = candidate.role === "PONTA" ? 1 : .75;
    const score = directionScore * 52 + reachability * 20 + blockSpace * 18 + approachRoom * 8 + roleBonus * 2;
    return { player:candidate, score, dot };
  }

  function volleyballChooseAttacker(g, team, setterId, input = null) {
    const setter = volleyballPlayer(g, setterId);
    if (!setter) return null;

    // Quem acabou de tocar nao entra como opcao de ataque. Quando o bloqueio
    // jogavel entrar, ele podera liberar essa excecao sem alterar a selecao normal.
    const candidates = volleyballTeamPlayers(g, team)
      .filter((player) => player.id !== setterId && player.id !== g.lastTouchPlayerId);
    if (!candidates.length) return null;

    const reads = candidates.map((candidate) => volleyballAttackerRead(g, team, setter, candidate, input));
    // Cone largo: a direcao comunica intencao, mas nunca transforma um pequeno
    // desvio do WASD em um levantamento completamente errado.
    const insideCone = input?.moving ? reads.filter((read) => read.dot >= .05) : reads;
    const pool = insideCone.length ? insideCone : reads;
    pool.sort((a, b) => b.score - a.score);
    return pool[0]?.player || null;
  }
'''

if old not in text:
    raise SystemExit('volleyballChooseAttacker antigo nao encontrado')
text = text.replace(old, new, 1)

old_target = '    const targetX = clamp(attacker.x + (input.moving ? input.x * 5 : 0), 16, 84);\n'
new_target = '    const targetX = clamp(attacker.x + (input.moving ? input.x * 2 : 0), 16, 84);\n'
if old_target not in text:
    raise SystemExit('targetX do levantamento nao encontrado')
text = text.replace(old_target, new_target, 1)

old_message = '    g.message = "LEVANTOU! Continua correndo e encontra a bola no alto.";\n'
new_message = '''    const attackSide = attacker.x < 42 ? "ESQUERDA" : attacker.x > 58 ? "DIREITA" : "MEIO";
    g.message = `LEVANTOU PARA ${attackSide}! O controle ja passou para quem esta mais apto a atacar.`;
'''
if old_message not in text:
    raise SystemExit('mensagem do levantamento nao encontrada')
text = text.replace(old_message, new_message, 1)

old_help = '          <div class="sports-help">O controle troca automaticamente para quem entra na jogada. A bola não espera você.</div>\n'
new_help = '          <div class="sports-help">O controle troca automaticamente para quem entra na jogada. No 2º toque, sua direção de movimento indica o setor e o jogo escolhe o atacante mais apto dentro dele.</div>\n'
if old_help not in text:
    raise SystemExit('texto de ajuda do Volei V0.3 nao encontrado')
text = text.replace(old_help, new_help, 1)

path.write_text(text, encoding='utf-8')

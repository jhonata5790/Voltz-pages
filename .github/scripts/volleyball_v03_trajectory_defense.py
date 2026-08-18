from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
text = path.read_text(encoding='utf-8')

# Limpa receptor automatico quando nosso time toca.
needle = '''      g.rivalAttackerId = null;\n    }\n    return g.teamTouches;\n'''
replacement = '''      g.rivalAttackerId = null;\n      g.voltzReceiverId = null;\n    }\n    return g.teamTouches;\n'''
if needle not in text:
    raise SystemExit('register touch marker missing')
text = text.replace(needle, replacement, 1)

# Troca o seletor de recepcao por uma versao persistente + cobertura universal.
start = text.find('  function volleyballChooseVoltzReceiver(g, target) {')
end = text.find('  function volleyballChooseSetter(', start)
if start < 0 or end < 0:
    raise SystemExit('receiver function markers missing')
new_receiver = r'''  function volleyballChooseVoltzReceiver(g, target) {
    const player = volleyballTeamPlayers(g, "voltz")
      .slice()
      .sort((a, b) => volleyballDistance(a, target) - volleyballDistance(b, target))[0];
    if (player) {
      g.voltzReceiverId = player.id;
      volleyballSetActive(g, player.id, "RECEPÇÃO");
    }
    return player;
  }

  function volleyballEnsureVoltzCoverage(g, landing) {
    if (!g?.ball?.inPlay || g.phase !== "rally" || !landing) return null;
    if (g.lastTouchTeam !== "rival" || landing.y <= 50) return null;

    const rivalTouches = volleyballTouchesFor(g, "rival");
    const plannedAttacker = volleyballPlayer(g, g.rivalAttackerId);
    const stillARealSet = Boolean(
      rivalTouches === 2 && plannedAttacker && g.ball.y < 47.5 && g.ball.z > 7
    );
    if (stillARealSet) return null;

    const target = { x:clamp(landing.x, 8, 92), y:clamp(landing.y, 54, 94) };
    const ranked = volleyballTeamPlayers(g, "voltz")
      .map((player) => ({ player, distance:volleyballDistance(player, target) }))
      .sort((a, b) => a.distance - b.distance);
    const best = ranked[0]?.player || null;
    let receiver = volleyballPlayer(g, g.voltzReceiverId);

    if (!receiver || receiver.team !== "voltz") receiver = best;
    else if (best && best.id !== receiver.id && volleyballDistance(receiver, target) - volleyballDistance(best, target) > 8) {
      receiver = best;
    }
    if (!receiver) return null;

    const changed = g.voltzReceiverId !== receiver.id;
    g.voltzReceiverId = receiver.id;
    if (g.activePlayerId !== receiver.id) volleyballSetActive(g, receiver.id, "DEFESA");
    if (changed && rivalTouches === 2) {
      g.message = "FREE BALL! O corte nao saiu — a bola vem no nosso campo. Busca a queda!";
    }
    return receiver;
  }

'''
text = text[:start] + new_receiver + text[end:]

# Toda frame decide defesa pela queda projetada.
needle = '''  function volleyballUpdatePlayers(g, dt) {\n    const active = volleyballPlayer(g, g.activePlayerId);\n    const landing = volleyballLanding(g.ball);\n    const voltzTouches = volleyballTouchesFor(g, "voltz");\n'''
replacement = '''  function volleyballUpdatePlayers(g, dt) {\n    const landing = volleyballLanding(g.ball);\n    const coverageReceiver = volleyballEnsureVoltzCoverage(g, landing);\n    const active = volleyballPlayer(g, g.activePlayerId);\n    const voltzTouches = volleyballTouchesFor(g, "voltz");\n'''
if needle not in text:
    raise SystemExit('update players header missing')
text = text.replace(needle, replacement, 1)

# Os sem bola cobrem qualquer free ball; se rival ainda constroi, acompanham a bola.
start = text.find('      const incoming = g.phase === "rally" && g.ball?.inPlay && landing && landing.y > 50 && g.lastTouchTeam !== "voltz";')
end = text.find('      } else if (g.phase === "rally" && voltzTouches === 1) {', start)
if start < 0 or end < 0:
    raise SystemExit('incoming movement block missing')
new_incoming = r'''      const incoming = Boolean(coverageReceiver && landing);
      if (incoming) {
        const side = player.homeX < 50 ? -1 : 1;
        if (player.role === "LEV") {
          tx = clamp(landing.x * .55 + 50 * .45, 30, 70);
          ty = clamp(landing.y - 13, 62, 75);
        } else {
          tx = clamp(landing.x + side * 13, 12, 88);
          ty = clamp(landing.y - 6, 64, 84);
        }
        speed = 33;
      } else if (g.phase === "rally" && g.lastTouchTeam === "rival") {
        const shift = clamp((g.ball.x - 50) * .2, -9, 9);
        tx = clamp(player.homeX + shift, 14, 86);
        ty = player.role === "LEV" ? 69 : 77;
        speed = 28;
'''
text = text[:start] + new_incoming + text[end:]

# Reset simples entre pontos.
needle = '    g.rivalServerId = null;\n    g.ball = { x:50, y:team === "voltz" ? 87 : 13, z:2, vx:0, vy:0, vz:0, inPlay:false };\n'
replacement = '    g.rivalServerId = null;\n    g.voltzReceiverId = null;\n    g.ball = { x:50, y:team === "voltz" ? 87 : 13, z:2, vx:0, vy:0, vz:0, inPlay:false };\n'
if needle not in text:
    raise SystemExit('serve reset marker missing')
text = text.replace(needle, replacement, 1)

path.write_text(text, encoding='utf-8')

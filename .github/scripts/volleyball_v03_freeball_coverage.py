from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
text = path.read_text(encoding='utf-8')

# 1) Todo toque Voltz encerra a atribuicao defensiva anterior.
old = '''    if (team === "voltz") {
      g.rivalReceiverId = null;
      g.rivalSetterId = null;
      g.rivalAttackerId = null;
    }
'''
new = '''    if (team === "voltz") {
      g.rivalReceiverId = null;
      g.rivalSetterId = null;
      g.rivalAttackerId = null;
      g.voltzReceiverId = null;
    }
'''
if old not in text:
    raise SystemExit('volleyballRegisterTouch nao encontrado')
text = text.replace(old, new, 1)

# 2) A escolha do receptor passa a ser estado persistente da bola, e nao evento de ataque.
old = '''  function volleyballChooseVoltzReceiver(g, target) {
    const player = volleyballTeamPlayers(g, "voltz")
      .slice()
      .sort((a, b) => volleyballDistance(a, target) - volleyballDistance(b, target))[0];
    if (player) volleyballSetActive(g, player.id, "RECEPÇÃO");
    return player;
  }
'''
new = '''  function volleyballChooseVoltzReceiver(g, target) {
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

    // Defesa reage a TRAJETORIA. Se o ultimo toque foi rival e a projecao cai
    // no nosso campo, isso e uma bola defensavel, independentemente de ter sido
    // saque, ataque, free ball, levantamento passado ou toque quebrado.
    if (g.lastTouchTeam !== "rival" || landing.y <= 50) {
      if (g.lastTouchTeam !== "rival") g.voltzReceiverId = null;
      return null;
    }

    const rivalTouches = volleyballTouchesFor(g, "rival");
    const plannedAttacker = volleyballPlayer(g, g.rivalAttackerId);
    const rivalStillBuildingAttack = Boolean(
      rivalTouches === 2 &&
      plannedAttacker &&
      g.ball.y < 47.5 &&
      g.ball.z > 7
    );

    // Enquanto o levantamento rival ainda esta realmente chegando ao atacante,
    // mantemos a formacao defensiva sem roubar o controle cedo demais. Se ele
    // perder a bola e ela atravessar a rede, a cobertura assume imediatamente.
    if (rivalStillBuildingAttack) return null;

    const target = {
      x: clamp(landing.x, 8, 92),
      y: clamp(landing.y, 54, 94)
    };
    const ranked = volleyballTeamPlayers(g, "voltz")
      .map((player) => ({ player, distance: volleyballDistance(player, target) }))
      .sort((a, b) => a.distance - b.distance);
    const best = ranked[0]?.player || null;
    let receiver = volleyballPlayer(g, g.voltzReceiverId);

    // Reatribui apenas quando necessario, evitando piscar controle entre atletas
    // enquanto a mesma bola esta em voo.
    if (!receiver || receiver.team !== "voltz") receiver = best;
    else if (best && best.id !== receiver.id) {
      const currentDistance = volleyballDistance(receiver, target);
      const bestDistance = volleyballDistance(best, target);
      if (currentDistance - bestDistance > 8) receiver = best;
    }

    if (!receiver) return null;
    const changed = g.voltzReceiverId !== receiver.id;
    g.voltzReceiverId = receiver.id;
    if (g.activePlayerId !== receiver.id) volleyballSetActive(g, receiver.id, "DEFESA");

    if (changed && rivalTouches === 2) {
      g.message = "FREE BALL! O ataque rival nao saiu — a bola vem no nosso campo. Busca a queda!";
    }
    return receiver;
  }
'''
if old not in text:
    raise SystemExit('volleyballChooseVoltzReceiver nao encontrado')
text = text.replace(old, new, 1)

# 3) A IA rival guarda o ponto de CONTATO de cada construcao, em vez de perseguir a queda final da parabola.
old = '''  function volleyballRivalReceive(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    const setter = volleyballChooseSetter(g, "rival", player.id);
    if (!setter) return;
    g.rivalSetterId = setter.id;
    volleyballLaunch(g, setter.x, clamp(setter.y, 26, 42), .7, 7);
  }

  function volleyballRivalSet(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    const attacker = volleyballChooseAttacker(g, "rival", player.id);
    if (!attacker) return;
    g.rivalAttackerId = attacker.id;
    volleyballLaunch(g, attacker.x, 43.5, .76, 19);
  }

  function volleyballRivalAttack(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    const target = volleyballOpenTarget(g, "rival", [
      { x:18, y:82 }, { x:50, y:86 }, { x:82, y:82 },
      { x:30, y:62 }, { x:70, y:62 }
    ]);
    volleyballLaunch(g, target.x, target.y, .6, 0);
    volleyballChooseVoltzReceiver(g, target);
    g.message = "ATAQUE VISITANTE! Lê a queda e corre.";
    sportSfx("hit");
  }
'''
new = '''  function volleyballRivalReceive(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    const setter = volleyballChooseSetter(g, "rival", player.id);
    if (!setter) return;
    const contact = { x:setter.x, y:clamp(setter.y, 26, 42) };
    g.rivalSetterId = setter.id;
    g.rivalSetContact = contact;
    g.rivalAttackContact = null;
    volleyballLaunch(g, contact.x, contact.y, .7, 7);
  }

  function volleyballRivalSet(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    const attacker = volleyballChooseAttacker(g, "rival", player.id);
    g.rivalSetContact = null;
    if (!attacker) return;
    const contact = { x:attacker.x, y:43.5 };
    g.rivalAttackerId = attacker.id;
    g.rivalAttackContact = contact;
    volleyballLaunch(g, contact.x, contact.y, .76, 19);
  }

  function volleyballRivalAttack(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    g.rivalSetContact = null;
    g.rivalAttackContact = null;
    const target = volleyballOpenTarget(g, "rival", [
      { x:18, y:82 }, { x:50, y:86 }, { x:82, y:82 },
      { x:30, y:62 }, { x:70, y:62 }
    ]);
    volleyballLaunch(g, target.x, target.y, .6, 0);
    volleyballChooseVoltzReceiver(g, target);
    g.message = "ATAQUE VISITANTE! Lê a queda e corre.";
    sportSfx("hit");
  }
'''
if old not in text:
    raise SystemExit('funcoes de construcao rival nao encontradas')
text = text.replace(old, new, 1)

# 4) Setter e atacante rival correm para o ponto em que devem TOCAR a bola.
old = '''    if (touches === 1) {
      const setter = volleyballPlayer(g, g.rivalSetterId);
      if (setter) {
        volleyballMoveToward(setter, clamp(landing.x, 18, 82), clamp(landing.y, 22, 44), 35, dt, 7, 46);
        if (volleyballRivalContactReady(setter, g.ball, "set")) volleyballRivalSet(g, setter);
      }
      return;
    }

    if (touches === 2) {
      const attacker = volleyballPlayer(g, g.rivalAttackerId);
      if (attacker) {
        volleyballMoveToward(attacker, clamp(landing.x, 10, 90), clamp(landing.y, 37, 46), 38, dt, 7, 46);
        if (volleyballRivalContactReady(attacker, g.ball, "attack")) volleyballRivalAttack(g, attacker);
      }
    }
'''
new = '''    if (touches === 1) {
      const setter = volleyballPlayer(g, g.rivalSetterId);
      if (setter) {
        const contact = g.rivalSetContact || landing;
        volleyballMoveToward(setter, clamp(contact.x, 18, 82), clamp(contact.y, 22, 44), 35, dt, 7, 46);
        if (volleyballRivalContactReady(setter, g.ball, "set")) volleyballRivalSet(g, setter);
      }
      return;
    }

    if (touches === 2) {
      const attacker = volleyballPlayer(g, g.rivalAttackerId);
      if (attacker) {
        const contact = g.rivalAttackContact || landing;
        volleyballMoveToward(attacker, clamp(contact.x, 10, 90), clamp(contact.y, 37, 46), 38, dt, 7, 46);
        if (volleyballRivalContactReady(attacker, g.ball, "attack")) volleyballRivalAttack(g, attacker);
      }
    }
'''
if old not in text:
    raise SystemExit('bloco de movimento ofensivo rival nao encontrado')
text = text.replace(old, new, 1)

# 5) Movimento Voltz passa a ter atribuicao defensiva universal por trajetoria.
old = '''  function volleyballUpdatePlayers(g, dt) {
    const active = volleyballPlayer(g, g.activePlayerId);
    const landing = volleyballLanding(g.ball);
    const voltzTouches = volleyballTouchesFor(g, "voltz");

    if (active?.team === "voltz") {
'''
new = '''  function volleyballUpdatePlayers(g, dt) {
    const landing = volleyballLanding(g.ball);
    const coverageReceiver = volleyballEnsureVoltzCoverage(g, landing);
    const active = volleyballPlayer(g, g.activePlayerId);
    const voltzTouches = volleyballTouchesFor(g, "voltz");

    if (active?.team === "voltz") {
'''
if old not in text:
    raise SystemExit('cabecalho volleyballUpdatePlayers nao encontrado')
text = text.replace(old, new, 1)

old = '''      const incoming = g.phase === "rally" && g.ball?.inPlay && landing && landing.y > 50 && g.lastTouchTeam !== "voltz";
      if (incoming) {
        const shift = clamp((landing.x - 50) * .22, -10, 10);
        if (player.role === "LEV") {
          tx = clamp(50 + shift * .35, 38, 62);
          ty = 67;
        } else {
          tx = clamp(player.homeX + shift, 14, 86);
          ty = landing.y > 75 ? 76 : 70;
        }
        speed = 31;
      } else if (g.phase === "rally" && voltzTouches === 1) {
'''
new = '''      const incoming = Boolean(coverageReceiver && landing);
      if (incoming) {
        // Um jogador recebe controle e os outros DOIS fazem cobertura de verdade
        // ao redor da queda, preparando imediatamente o segundo toque.
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
        // Mesmo enquanto o rival ainda constroi a jogada, o time se desloca com
        // a bola. Ninguem fica plantado esperando a classificacao "ataque".
        const shift = clamp((g.ball.x - 50) * .2, -9, 9);
        tx = clamp(player.homeX + shift, 14, 86);
        ty = player.role === "LEV" ? 69 : 77;
        speed = 28;
      } else if (g.phase === "rally" && voltzTouches === 1) {
'''
if old not in text:
    raise SystemExit('bloco incoming Voltz nao encontrado')
text = text.replace(old, new, 1)

# 6) Reset completo dos novos estados em saque/ponto inicial.
old = '''    g.rivalReceiverId = null;
    g.rivalSetterId = null;
    g.rivalAttackerId = null;
    g.rivalServerId = null;
    g.ball = { x:50, y:team === "voltz" ? 87 : 13, z:2, vx:0, vy:0, vz:0, inPlay:false };
'''
new = '''    g.rivalReceiverId = null;
    g.rivalSetterId = null;
    g.rivalAttackerId = null;
    g.rivalServerId = null;
    g.rivalSetContact = null;
    g.rivalAttackContact = null;
    g.voltzReceiverId = null;
    g.ball = { x:50, y:team === "voltz" ? 87 : 13, z:2, vx:0, vy:0, vz:0, inPlay:false };
'''
if old not in text:
    raise SystemExit('reset volleyballPrepareServe nao encontrado')
text = text.replace(old, new, 1)

old = '''      rivalReceiverId:null,
      rivalSetterId:null,
      rivalAttackerId:null,
      rivalServerId:null,
      ball:{ x:50, y:13, z:2, vx:0, vy:0, vz:0, inPlay:false },
'''
new = '''      rivalReceiverId:null,
      rivalSetterId:null,
      rivalAttackerId:null,
      rivalServerId:null,
      rivalSetContact:null,
      rivalAttackContact:null,
      voltzReceiverId:null,
      ball:{ x:50, y:13, z:2, vx:0, vy:0, vz:0, inPlay:false },
'''
if old not in text:
    raise SystemExit('estado inicial do Volei nao encontrado')
text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')

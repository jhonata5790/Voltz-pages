from pathlib import Path

path = Path('assets/js/realms/physical-education/sports-minigames.js')
text = path.read_text(encoding='utf-8')


def replace_function(source, name, next_name, replacement):
    start = source.find(f'  function {name}(')
    end = source.find(f'  function {next_name}(', start)
    if start < 0 or end < 0:
        raise SystemExit(f'Nao foi possivel localizar {name} -> {next_name}')
    return source[:start] + replacement.rstrip() + '\n\n' + source[end:]

prepare_serve = r'''  function volleyballPrepareServe(g, team = g.servingTeam || "rival") {
    const now = performance.now();
    volleyballResetPlayers(g);
    g.servingTeam = team;
    g.lastTouchTeam = team;
    g.teamTouches = 0;
    g.lastTouchPlayerId = null;
    g.rivalReceiverId = null;
    g.rivalSetterId = null;
    g.rivalAttackerId = null;
    g.rivalServerId = null;
    g.ball = { x:50, y:team === "voltz" ? 87 : 13, z:2, vx:0, vy:0, vz:0, inPlay:false };
    g.phase = team === "voltz" ? "serve-voltz" : "serve-rival";
    g.nextServeAt = now + (team === "rival" ? 900 : 0);
    g.message = team === "voltz"
      ? "SEU SAQUE · mova para ajustar o ângulo e aperte J."
      : "SAQUE VISITANTE · o sacador está indo para a linha de fundo.";

    if (team === "voltz") {
      const server = volleyballPlayer(g, "v2");
      server.x = 50;
      server.y = 88;
      volleyballSetActive(g, server.id, "SAQUE");
      g.ball.x = server.x;
      g.ball.y = server.y - 2;
      g.ball.z = 3;
    } else {
      const server = volleyballPlayer(g, "r2");
      if (server) {
        server.x = 50;
        server.y = 8;
        g.rivalServerId = server.id;
        g.ball.x = server.x;
        g.ball.y = server.y + 2.2;
        g.ball.z = 3.2;
      }
    }
    syncVolleyballDynamicDom(now);
  }'''

rival_serve = r'''  function volleyballRivalServe(g) {
    const server = volleyballPlayer(g, g.rivalServerId) || volleyballPlayer(g, "r2");
    if (!server) return volleyballPoint(g, "voltz", "O adversário não conseguiu organizar o saque.");

    // O saque nasce no sacador, nunca no vazio.
    g.ball.x = server.x;
    g.ball.y = server.y + 2.2;
    g.ball.z = 3.2;
    const target = {
      x: 18 + Math.random() * 64,
      y: 73 + Math.random() * 17
    };
    volleyballLaunch(g, target.x, target.y, 1.34, 0);
    g.phase = "rally";
    g.message = "SAQUE FEITO! A bola está viva — corre pra recepção.";
    volleyballChooseVoltzReceiver(g, target);
    sportSfx("hit");
  }'''

contact_helper = r'''  function volleyballRivalContactReady(player, ball, kind) {
    if (!player || !ball?.inPlay) return false;
    const distance = volleyballDistance(player, ball);
    if (kind === "receive") {
      return ball.y < 51 && ball.vz < 1.5 && ball.z >= 1 && ball.z <= 9 && distance <= 5.2;
    }
    if (kind === "set") {
      return ball.y < 51 && ball.z >= 4 && ball.z <= 13 && distance <= 4.8;
    }
    return ball.y < 51 && ball.z >= 12 && ball.z <= 25 && distance <= 5.4;
  }

  function volleyballUpdateRivalAI(g, dt) {
    if (g.phase !== "rally" || !g.ball.inPlay) return;
    const touches = volleyballTouchesFor(g, "rival");
    const landing = volleyballLanding(g.ball) || { x:g.ball.x, y:g.ball.y };

    if (touches === 0 && (g.lastTouchTeam !== "rival" || g.teamTouches === 0)) {
      if (!g.rivalReceiverId) {
        const receiver = volleyballTeamPlayers(g, "rival")
          .slice()
          .sort((a, b) => volleyballDistance(a, landing) - volleyballDistance(b, landing))[0];
        g.rivalReceiverId = receiver?.id || null;
      }
      const receiver = volleyballPlayer(g, g.rivalReceiverId);
      if (receiver) {
        volleyballMoveToward(receiver, clamp(landing.x, 10, 90), clamp(landing.y, 8, 46), 34, dt, 7, 46);
        if (volleyballRivalContactReady(receiver, g.ball, "receive")) volleyballRivalReceive(g, receiver);
      }
      return;
    }

    if (touches === 1) {
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
  }'''

players_update = r'''  function volleyballUpdatePlayers(g, dt) {
    const active = volleyballPlayer(g, g.activePlayerId);
    const landing = volleyballLanding(g.ball);
    const voltzTouches = volleyballTouchesFor(g, "voltz");

    if (active?.team === "voltz") {
      const input = volleyballInputVector();
      if (input.moving) {
        active.x += input.x * VOLLEY_PLAYER_SPEED * dt;
        active.y += input.y * VOLLEY_PLAYER_SPEED * dt;
        active.x = clamp(active.x, 8, 92);
        active.y = clamp(active.y, 53.5, 94);
      }
      if (g.phase === "serve-voltz") {
        g.ball.x = active.x;
        g.ball.y = active.y - 3;
        g.ball.z = 3;
      }
    }

    // Companheiros sem controle continuam lendo a jogada: defesa, cobertura,
    // transicao para ataque e recomposicao. Eles nunca ficam parados esperando turno.
    volleyballTeamPlayers(g, "voltz").forEach((player) => {
      if (player.id === g.activePlayerId) return;
      let tx = player.homeX;
      let ty = player.homeY;
      let speed = 27;

      const incoming = g.phase === "rally" && g.ball?.inPlay && landing && landing.y > 50 && g.lastTouchTeam !== "voltz";
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
        // Depois da recepcao: levantador busca o segundo toque e pontas abrem para atacar.
        if (player.role === "LEV") {
          tx = 50;
          ty = 65;
        } else {
          tx = player.homeX < 50 ? 24 : 76;
          ty = 58;
        }
        speed = 30;
      } else if (g.phase === "rally" && voltzTouches === 2) {
        // Enquanto o atacante entra na bola, os outros fecham cobertura atras dele.
        const attacker = volleyballPlayer(g, g.activePlayerId);
        tx = attacker ? clamp((player.homeX + attacker.x) / 2, 18, 82) : player.homeX;
        ty = player.role === "LEV" ? 70 : 72;
        speed = 29;
      } else if (g.phase === "rally" && g.lastTouchTeam === "voltz") {
        // Bola do outro lado: recompoe em triangulo antes da devolucao rival.
        const ballShift = clamp((g.ball.x - 50) * .18, -8, 8);
        tx = clamp(player.homeX + ballShift, 14, 86);
        ty = player.role === "LEV" ? 69 : 78;
        speed = 26;
      }

      volleyballMoveToward(player, tx, ty, speed, dt, 54, 94);
    });

    volleyballTeamPlayers(g, "rival").forEach((player) => {
      if ([g.rivalReceiverId, g.rivalSetterId, g.rivalAttackerId].includes(player.id)) return;
      if (g.phase === "serve-rival" && player.id === g.rivalServerId) {
        volleyballMoveToward(player, 50, 8, 28, dt, 6, 46);
        g.ball.x = player.x;
        g.ball.y = player.y + 2.2;
        g.ball.z = 3.2;
        return;
      }
      let tx = player.homeX;
      let ty = player.homeY;
      if (g.phase === "rally") {
        const rivalTouches = volleyballTouchesFor(g, "rival");
        if (rivalTouches === 0 && landing && landing.y < 50) {
          tx = clamp(player.homeX + (landing.x - 50) * .14, 12, 88);
          ty = player.role === "LEV" ? 29 : 24;
        } else if (rivalTouches >= 1 && player.role === "PONTA") {
          ty = 42;
        }
      }
      volleyballMoveToward(player, tx, ty, 24, dt, 7, 46);
    });
  }'''

text = replace_function(text, 'volleyballPrepareServe', 'volleyballPoint', prepare_serve)
text = replace_function(text, 'volleyballRivalServe', 'volleyballVoltzServe', rival_serve)
text = replace_function(text, 'volleyballUpdateRivalAI', 'volleyballUpdatePlayers', contact_helper)
text = replace_function(text, 'volleyballUpdatePlayers', 'volleyballUpdateBall', players_update)

# Estado inicial tambem precisa conhecer o sacador rival.
needle = '      rivalAttackerId:null,\n      ball:{ x:50, y:13, z:2, vx:0, vy:0, vz:0, inPlay:false },'
replacement = '      rivalAttackerId:null,\n      rivalServerId:null,\n      ball:{ x:50, y:13, z:2, vx:0, vy:0, vz:0, inPlay:false },'
if needle not in text:
    raise SystemExit('estado inicial do Volei V0.3 nao encontrado')
text = text.replace(needle, replacement, 1)

path.write_text(text, encoding='utf-8')

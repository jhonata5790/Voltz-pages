from pathlib import Path

sports_path = Path('assets/js/realms/physical-education/sports-minigames.js')
css_path = Path('assets/css/volleyball/volleyball-standalone.css')
volley_html_path = Path('volleyball.html')
game_html_path = Path('game.html')

sports = sports_path.read_text(encoding='utf-8')
css = css_path.read_text(encoding='utf-8')
volley_html = volley_html_path.read_text(encoding='utf-8')
game_html = game_html_path.read_text(encoding='utf-8')

start_marker = '  // Volei V0.2 · primeiro prototipo jogavel real.'
end_marker = '  function startVolleyball() {'
if start_marker not in sports or end_marker not in sports:
    raise SystemExit('volleyball prototype markers not found')

before, rest = sports.split(start_marker, 1)
_, after = rest.split(end_marker, 1)

dynamic = r'''  // Volei V0.3 · rally continuo em tempo real.
  // WASD nunca vira menu: sempre movimenta o atleta ativo.
  // J executa o toque contextual: recepcao -> levantamento -> ataque.
  const VOLLEY_GRAVITY = 78;
  const VOLLEY_PLAYER_SPEED = 39;
  const VOLLEY_TARGET_POINTS = 5;

  function volleyballDynamicPlayers() {
    return [
      { id:"v1", team:"voltz", x:28, y:80, homeX:28, homeY:80, role:"PONTA" },
      { id:"v2", team:"voltz", x:50, y:70, homeX:50, homeY:70, role:"LEV" },
      { id:"v3", team:"voltz", x:72, y:80, homeX:72, homeY:80, role:"PONTA" },
      { id:"r1", team:"rival", x:28, y:20, homeX:28, homeY:20, role:"PONTA" },
      { id:"r2", team:"rival", x:50, y:30, homeX:50, homeY:30, role:"LEV" },
      { id:"r3", team:"rival", x:72, y:20, homeX:72, homeY:20, role:"PONTA" }
    ];
  }

  function volleyballPlayer(g, id) {
    return g?.players?.find((player) => player.id === id) || null;
  }

  function volleyballTeamPlayers(g, team) {
    return (g?.players || []).filter((player) => player.team === team);
  }

  function volleyballDistance(a, b) {
    return Math.hypot(Number(a?.x || 0) - Number(b?.x || 0), Number(a?.y || 0) - Number(b?.y || 0));
  }

  function volleyballInputVector() {
    let x = 0;
    let y = 0;
    if (state.pressed.has("a") || state.pressed.has("arrowleft")) x -= 1;
    if (state.pressed.has("d") || state.pressed.has("arrowright")) x += 1;
    if (state.pressed.has("w") || state.pressed.has("arrowup")) y -= 1;
    if (state.pressed.has("s") || state.pressed.has("arrowdown")) y += 1;
    const length = Math.hypot(x, y) || 1;
    return { x:x / length, y:y / length, moving:Boolean(x || y) };
  }

  function volleyballMoveToward(player, targetX, targetY, speed, dt, minY, maxY) {
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const length = Math.hypot(dx, dy);
    if (length > .05) {
      const step = Math.min(length, speed * dt);
      player.x += dx / length * step;
      player.y += dy / length * step;
    }
    player.x = clamp(player.x, 8, 92);
    player.y = clamp(player.y, minY, maxY);
  }

  function volleyballLanding(ball) {
    if (!ball?.inPlay) return null;
    const disc = ball.vz * ball.vz + 2 * VOLLEY_GRAVITY * Math.max(0, ball.z);
    const t = (ball.vz + Math.sqrt(Math.max(0, disc))) / VOLLEY_GRAVITY;
    if (!Number.isFinite(t) || t < 0) return null;
    return {
      x: ball.x + ball.vx * t,
      y: ball.y + ball.vy * t,
      t
    };
  }

  function volleyballLaunch(g, targetX, targetY, duration, targetZ = 0) {
    const ball = g.ball;
    const t = Math.max(.18, Number(duration) || .6);
    ball.vx = (targetX - ball.x) / t;
    ball.vy = (targetY - ball.y) / t;
    ball.vz = (targetZ - ball.z + .5 * VOLLEY_GRAVITY * t * t) / t;
    ball.inPlay = true;
  }

  function volleyballTouchesFor(g, team) {
    return g.lastTouchTeam === team ? Number(g.teamTouches || 0) : 0;
  }

  function volleyballRegisterTouch(g, team, playerId) {
    if (g.lastTouchTeam !== team) g.teamTouches = 0;
    g.lastTouchTeam = team;
    g.teamTouches += 1;
    g.lastTouchPlayerId = playerId;
    if (team === "voltz") {
      g.rivalReceiverId = null;
      g.rivalSetterId = null;
      g.rivalAttackerId = null;
    }
    return g.teamTouches;
  }

  function volleyballSetActive(g, playerId, reason = "") {
    if (!volleyballPlayer(g, playerId)) return;
    g.activePlayerId = playerId;
    if (reason) g.controlReason = reason;
  }

  function volleyballOpenTarget(g, team, candidateTargets) {
    const defenders = volleyballTeamPlayers(g, team === "voltz" ? "rival" : "voltz");
    let best = candidateTargets[0];
    let bestScore = -Infinity;
    candidateTargets.forEach((target) => {
      const nearest = Math.min(...defenders.map((player) => volleyballDistance(player, target)));
      const score = nearest + Math.random() * 3.5;
      if (score > bestScore) {
        bestScore = score;
        best = target;
      }
    });
    return best;
  }

  function volleyballChooseVoltzReceiver(g, target) {
    const player = volleyballTeamPlayers(g, "voltz")
      .slice()
      .sort((a, b) => volleyballDistance(a, target) - volleyballDistance(b, target))[0];
    if (player) volleyballSetActive(g, player.id, "RECEPÇÃO");
    return player;
  }

  function volleyballChooseSetter(g, team, excludeId) {
    const center = team === "voltz" ? { x:50, y:66 } : { x:50, y:34 };
    return volleyballTeamPlayers(g, team)
      .filter((player) => player.id !== excludeId)
      .sort((a, b) => volleyballDistance(a, center) - volleyballDistance(b, center))[0] || null;
  }

  function volleyballChooseAttacker(g, team, setterId, input = null) {
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

  function volleyballResetPlayers(g) {
    g.players.forEach((player) => {
      player.x = player.homeX;
      player.y = player.homeY;
    });
  }

  function volleyballPrepareServe(g, team = g.servingTeam || "rival") {
    const now = performance.now();
    volleyballResetPlayers(g);
    g.servingTeam = team;
    g.lastTouchTeam = team;
    g.teamTouches = 0;
    g.lastTouchPlayerId = null;
    g.rivalReceiverId = null;
    g.rivalSetterId = null;
    g.rivalAttackerId = null;
    g.ball = { x:50, y:team === "voltz" ? 87 : 13, z:2, vx:0, vy:0, vz:0, inPlay:false };
    g.phase = team === "voltz" ? "serve-voltz" : "serve-rival";
    g.nextServeAt = now + (team === "rival" ? 650 : 0);
    g.message = team === "voltz"
      ? "SEU SAQUE · mova para ajustar o ângulo e aperte J."
      : "SAQUE VISITANTE · se posiciona, a bola já vem.";
    if (team === "voltz") {
      const server = volleyballPlayer(g, "v2");
      server.x = 50;
      server.y = 88;
      volleyballSetActive(g, server.id, "SAQUE");
      g.ball.x = server.x;
      g.ball.y = server.y - 2;
    }
    syncVolleyballDynamicDom(now);
  }

  function volleyballPoint(g, team, message) {
    if (!g?.dynamic || g.phase === "point") return;
    if (team === "voltz") g.score += 1;
    else g.rivalScore += 1;
    g.phase = "point";
    g.ball.inPlay = false;
    g.pointResumeAt = performance.now() + 900;
    g.servingTeam = team;
    g.message = message;
    sportSfx(team === "voltz" ? "success" : "failure");
    syncVolleyballDynamicDom(performance.now());
  }

  function volleyballRivalServe(g) {
    const server = volleyballPlayer(g, "r2");
    g.ball.x = server?.x ?? 50;
    g.ball.y = 13;
    g.ball.z = 3;
    const target = {
      x: 18 + Math.random() * 64,
      y: 73 + Math.random() * 17
    };
    volleyballLaunch(g, target.x, target.y, 1.28, 0);
    g.phase = "rally";
    g.message = "A bola está viva. Corre pra recepção!";
    volleyballChooseVoltzReceiver(g, target);
    sportSfx("whistle");
  }

  function volleyballVoltzServe(g) {
    if (g.phase !== "serve-voltz") return;
    const server = volleyballPlayer(g, g.activePlayerId) || volleyballPlayer(g, "v2");
    const input = volleyballInputVector();
    g.ball.x = server.x;
    g.ball.y = server.y - 3;
    g.ball.z = 3;
    let target;
    if (input.moving) {
      target = {
        x: clamp(50 + input.x * 34 + (server.x - 50) * .25, 12, 88),
        y: clamp(25 + input.y * 12, 10, 43)
      };
    } else {
      target = volleyballOpenTarget(g, "voltz", [
        { x:20, y:22 }, { x:50, y:18 }, { x:80, y:22 }, { x:32, y:38 }, { x:68, y:38 }
      ]);
    }
    g.lastTouchTeam = "voltz";
    g.teamTouches = 0;
    volleyballLaunch(g, target.x, target.y, 1.15, 0);
    g.phase = "rally";
    g.message = "Saque em jogo! Prepara a cobertura.";
    g.rivalReceiverId = null;
    sportSfx("hit");
  }

  function volleyballVoltzReceive(g, player) {
    const touches = volleyballRegisterTouch(g, "voltz", player.id);
    if (touches !== 1) return;
    const setter = volleyballChooseSetter(g, "voltz", player.id);
    if (!setter) return volleyballPoint(g, "rival", "A jogada desmontou antes do levantamento.");
    const distance = volleyballDistance(player, g.ball);
    const contactHeight = g.ball.z;
    const quality = clamp(1 - distance / 10, 0, 1) * .55 + clamp(1 - Math.abs(contactHeight - 5.5) / 8, 0, 1) * .45;
    const targetX = clamp(setter.x + (quality < .45 ? (Math.random() - .5) * 8 : 0), 20, 80);
    const targetY = clamp(setter.y + (quality < .45 ? (Math.random() - .5) * 5 : 0), 58, 74);
    volleyballLaunch(g, targetX, targetY, quality > .72 ? .68 : .78, 7);
    volleyballSetActive(g, setter.id, "LEVANTAMENTO");
    g.message = quality > .76 ? "RECEPÇÃO NA MÃO! Corre pro segundo toque." : "Bola viva! Busca o levantamento.";
    sportSfx("hit");
  }

  function volleyballVoltzSet(g, player) {
    const touches = volleyballRegisterTouch(g, "voltz", player.id);
    if (touches !== 2) return;
    const input = volleyballInputVector();
    const attacker = volleyballChooseAttacker(g, "voltz", player.id, input);
    if (!attacker) return volleyballPoint(g, "rival", "Sem opção de ataque.");
    const targetX = clamp(attacker.x + (input.moving ? input.x * 5 : 0), 16, 84);
    const targetY = 56.5;
    volleyballLaunch(g, targetX, targetY, .78, 19);
    volleyballSetActive(g, attacker.id, "ATAQUE");
    g.message = "LEVANTOU! Continua correndo e encontra a bola no alto.";
    sportSfx("hit");
  }

  function volleyballVoltzAttack(g, player) {
    const input = volleyballInputVector();
    const touches = volleyballRegisterTouch(g, "voltz", player.id);
    if (touches !== 3) return;
    let target;
    if (input.moving) {
      target = {
        x: clamp(50 + input.x * 34 + (player.x - 50) * .18, 10, 90),
        y: clamp(27 + input.y * 13, 10, 44)
      };
    } else {
      target = volleyballOpenTarget(g, "voltz", [
        { x:18, y:18 }, { x:50, y:16 }, { x:82, y:18 },
        { x:28, y:39 }, { x:72, y:39 }
      ]);
    }
    const timing = clamp(1 - Math.abs(g.ball.z - 18) / 15, .35, 1);
    const duration = .66 - timing * .12;
    volleyballLaunch(g, target.x, target.y, duration, 0);
    g.message = timing > .82 ? "CRAVOU NO ALTO! Fecha a quadra pra defesa." : "Ataque em jogo. Recompõe!";
    g.rivalReceiverId = null;
    g.rivalSetterId = null;
    g.rivalAttackerId = null;
    sportSfx("hit");
  }

  function volleyballDynamicAction() {
    const g = state.current;
    if (!g?.dynamic) return;
    if (g.phase === "serve-voltz") {
      volleyballVoltzServe(g);
      return;
    }
    if (g.phase !== "rally" || !g.ball.inPlay) return;
    const player = volleyballPlayer(g, g.activePlayerId);
    if (!player || player.team !== "voltz") return;
    const touches = volleyballTouchesFor(g, "voltz");
    const distance = volleyballDistance(player, g.ball);
    const maxDistance = touches === 2 ? 10.2 : 9.2;
    const maxHeight = touches === 2 ? 27 : touches === 1 ? 15 : 12;
    if (distance > maxDistance || g.ball.z > maxHeight) {
      g.message = g.ball.z > maxHeight ? "Ainda está alta demais. Continua acompanhando a bola!" : "Chega mais perto da bola!";
      return;
    }
    if (touches === 0) volleyballVoltzReceive(g, player);
    else if (touches === 1) volleyballVoltzSet(g, player);
    else if (touches === 2) volleyballVoltzAttack(g, player);
  }

  function volleyballRivalReceive(g, player) {
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
        if (g.ball.y < 51 && g.ball.vz < 4 && g.ball.z <= 11 && volleyballDistance(receiver, g.ball) <= 10.5) {
          volleyballRivalReceive(g, receiver);
        }
      }
      return;
    }

    if (touches === 1) {
      const setter = volleyballPlayer(g, g.rivalSetterId);
      if (setter) {
        volleyballMoveToward(setter, clamp(landing.x, 18, 82), clamp(landing.y, 22, 44), 35, dt, 7, 46);
        if (g.ball.y < 50 && g.ball.vz < 5 && g.ball.z <= 15 && volleyballDistance(setter, g.ball) <= 9.5) {
          volleyballRivalSet(g, setter);
        }
      }
      return;
    }

    if (touches === 2) {
      const attacker = volleyballPlayer(g, g.rivalAttackerId);
      if (attacker) {
        volleyballMoveToward(attacker, clamp(landing.x, 10, 90), clamp(landing.y, 37, 46), 38, dt, 7, 46);
        if (g.ball.y < 51 && g.ball.vz < 7 && g.ball.z <= 27 && volleyballDistance(attacker, g.ball) <= 10.5) {
          volleyballRivalAttack(g, attacker);
        }
      }
    }
  }

  function volleyballUpdatePlayers(g, dt) {
    const active = volleyballPlayer(g, g.activePlayerId);
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
      }
    }

    volleyballTeamPlayers(g, "voltz").forEach((player) => {
      if (player.id === g.activePlayerId) return;
      let tx = player.homeX;
      let ty = player.homeY;
      const touches = volleyballTouchesFor(g, "voltz");
      if (g.phase === "rally" && touches === 1) {
        if (player.role === "PONTA") ty = 58;
        if (player.role === "LEV") ty = 66;
      } else if (g.phase === "rally" && touches === 2) {
        ty = player.role === "PONTA" ? 59 : 70;
      }
      volleyballMoveToward(player, tx, ty, 21, dt, 54, 94);
    });

    volleyballTeamPlayers(g, "rival").forEach((player) => {
      if ([g.rivalReceiverId, g.rivalSetterId, g.rivalAttackerId].includes(player.id)) return;
      let ty = player.homeY;
      if (volleyballTouchesFor(g, "rival") >= 1 && player.role === "PONTA") ty = 42;
      volleyballMoveToward(player, player.homeX, ty, 18, dt, 7, 46);
    });
  }

  function volleyballUpdateBall(g, dt) {
    const ball = g.ball;
    if (!ball?.inPlay) return;
    const previousY = ball.y;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;
    ball.vz -= VOLLEY_GRAVITY * dt;

    const crossedNet = (previousY - 50) * (ball.y - 50) <= 0 && Math.abs(previousY - ball.y) > .01;
    if (crossedNet && ball.z < 4.2) {
      ball.vy *= -.18;
      ball.vx *= .72;
      ball.vz = Math.max(ball.vz, 1.5);
      g.message = "NA REDE! A bola perdeu toda a força.";
    }

    if (ball.z > 0) return;
    ball.z = 0;
    ball.inPlay = false;

    const out = ball.x < 5 || ball.x > 95 || ball.y < 4 || ball.y > 96;
    if (out) {
      const winner = g.lastTouchTeam === "voltz" ? "rival" : "voltz";
      volleyballPoint(g, winner, winner === "voltz" ? "FORA! Ponto Voltz." : "Ataque pra fora. Ponto visitante.");
      return;
    }

    if (ball.y > 50) volleyballPoint(g, "rival", "A bola caiu na quadra Voltz. Ponto visitante.");
    else volleyballPoint(g, "voltz", "A bola tocou o chão do outro lado. PONTO VOLTZ!");
  }

  function getVolleyballDynamicDom() {
    return {
      court: document.getElementById("volleyballDynamicCourt"),
      ball: document.getElementById("volleyballDynamicBall"),
      shadow: document.getElementById("volleyballBallShadow"),
      landing: document.getElementById("volleyballLandingMarker"),
      feedback: document.getElementById("volleyballDynamicFeedback"),
      status: document.getElementById("volleyballDynamicStatus"),
      scoreV: document.getElementById("volleyballScoreVoltz"),
      scoreR: document.getElementById("volleyballScoreRival"),
      touches: document.getElementById("volleyballTouchCount")
    };
  }

  function renderVolleyballDynamic() {
    const g = state.current;
    if (!g?.dynamic) return;
    const playerMarkup = g.players.map((player) => `
      <div id="volleyballPlayer-${player.id}" class="volleyball-dynamic-player team-${player.team} ${player.id === g.activePlayerId ? "is-active" : ""}" data-id="${player.id}">
        <span>${player.role}</span>
      </div>`).join("");

    openPanelShell(
      "🏐 Vôlei · Rally Voltz",
      "Quadra da Sequência",
      "Sem turnos: corre, lê a bola e mantém o rally vivo.",
      `<div class="sports-game-card volleyball-dynamic-card">
        <div class="volleyball-dynamic-scoreboard">
          <div><small>VOLTZ</small><strong id="volleyballScoreVoltz">${g.score}</strong></div>
          <div class="volleyball-dynamic-center"><b>PRIMEIRO A ${g.targetPoints}</b><span id="volleyballDynamicStatus">RALLY</span></div>
          <div><small>VISITANTE</small><strong id="volleyballScoreRival">${g.rivalScore}</strong></div>
        </div>

        <div id="volleyballDynamicCourt" class="volleyball-dynamic-court">
          <div class="volleyball-dynamic-net"><i></i></div>
          <div class="volleyball-attack-line line-rival"></div>
          <div class="volleyball-attack-line line-voltz"></div>
          <div class="volleyball-side-label rival">VISITANTE</div>
          <div class="volleyball-side-label voltz">VOLTZ</div>
          ${playerMarkup}
          <div id="volleyballLandingMarker" class="volleyball-landing-marker"></div>
          <div id="volleyballBallShadow" class="volleyball-ball-shadow"></div>
          <div id="volleyballDynamicBall" class="volleyball-dynamic-ball">🏐</div>
        </div>

        <div class="volleyball-dynamic-hud">
          <div class="volleyball-control-strip"><span><b>WASD</b> MOVER</span><span><b>J</b> TOCAR / SACAR</span><span>TOQUES <b id="volleyballTouchCount">0/3</b></span></div>
          <div id="volleyballDynamicFeedback" class="sports-feedback">${escapeHtml(g.message)}</div>
          <div class="sports-help">O controle troca automaticamente para quem entra na jogada. A bola não espera você.</div>
        </div>
      </div>`
    );
    syncVolleyballDynamicDom(performance.now());
  }

  function syncVolleyballDynamicDom(now) {
    const g = state.current;
    if (!g?.dynamic) return;
    const dom = getVolleyballDynamicDom();
    if (!dom.court) return;
    g.players.forEach((player) => {
      const el = document.getElementById(`volleyballPlayer-${player.id}`);
      if (!el) return;
      el.style.left = `${player.x}%`;
      el.style.top = `${player.y}%`;
      const active = player.id === g.activePlayerId;
      el.classList.toggle("is-active", active);
      el.classList.toggle("can-touch", active && g.phase === "rally" && g.ball.inPlay && volleyballDistance(player, g.ball) <= 10.5 && g.ball.z <= 27);
    });

    const ball = g.ball;
    if (dom.ball && ball) {
      const visualY = ball.y - Math.max(0, ball.z) * .30;
      const scale = 1 + Math.min(1.15, Math.max(0, ball.z) * .024);
      dom.ball.style.left = `${ball.x}%`;
      dom.ball.style.top = `${visualY}%`;
      dom.ball.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(3)})`;
      dom.ball.classList.toggle("in-play", Boolean(ball.inPlay));
    }
    if (dom.shadow && ball) {
      dom.shadow.style.left = `${ball.x}%`;
      dom.shadow.style.top = `${ball.y}%`;
      const shadowScale = clamp(1 - ball.z / 45, .28, 1);
      dom.shadow.style.transform = `translate(-50%,-50%) scale(${shadowScale.toFixed(3)})`;
      dom.shadow.style.opacity = ball.inPlay ? String(clamp(.78 - ball.z / 58, .18, .72)) : "0";
    }

    const landing = volleyballLanding(ball);
    const incomingVoltz = ball?.inPlay && landing && landing.y > 50 && g.lastTouchTeam !== "voltz";
    if (dom.landing) {
      dom.landing.classList.toggle("visible", Boolean(incomingVoltz));
      if (incomingVoltz) {
        dom.landing.style.left = `${clamp(landing.x, 7, 93)}%`;
        dom.landing.style.top = `${clamp(landing.y, 53, 94)}%`;
      }
    }

    if (dom.feedback && dom.feedback.textContent !== g.message) dom.feedback.textContent = g.message || "";
    if (dom.scoreV) dom.scoreV.textContent = String(g.score);
    if (dom.scoreR) dom.scoreR.textContent = String(g.rivalScore);
    if (dom.touches) dom.touches.textContent = `${volleyballTouchesFor(g, "voltz")}/3`;
    if (dom.status) {
      const active = volleyballPlayer(g, g.activePlayerId);
      const status = g.phase === "serve-voltz" ? "SEU SAQUE"
        : g.phase === "serve-rival" ? "SAQUE VISITANTE"
          : g.phase === "point" ? "PONTO"
            : `${g.controlReason || "RALLY"}${active ? ` · ${active.role}` : ""}`;
      dom.status.textContent = status;
    }
  }

  function updateVolleyballDynamic(now, dt) {
    const g = state.current;
    if (!g?.dynamic) return;

    if (g.phase === "point") {
      if (now >= g.pointResumeAt) {
        if (g.score >= g.targetPoints || g.rivalScore >= g.targetPoints) {
          finishSport("volleyball", g.score > g.rivalScore, g.score > g.rivalScore
            ? "Você venceu mantendo o rally vivo e conectando os três toques em movimento."
            : "O visitante fechou a partida. Reposicione mais cedo e mantenha a bola viva.");
          return;
        }
        volleyballPrepareServe(g, g.servingTeam);
      }
      syncVolleyballDynamicDom(now);
      return;
    }

    if (g.phase === "serve-rival" && now >= g.nextServeAt) volleyballRivalServe(g);

    volleyballUpdatePlayers(g, dt);
    if (g.phase === "rally") {
      volleyballUpdateRivalAI(g, dt);
      volleyballUpdateBall(g, dt);
    }
    syncVolleyballDynamicDom(now);
  }

  function startVolleyballPrototype() {
    global.VoltzStandaloneVolleyball?.onMatchStarted?.();
    sportSfx("whistle");
    state.current = {
      type:"volleyball",
      prototype:true,
      dynamic:true,
      score:0,
      rivalScore:0,
      targetPoints:VOLLEY_TARGET_POINTS,
      players:volleyballDynamicPlayers(),
      activePlayerId:"v1",
      controlReason:"RECEPÇÃO",
      phase:"serve-rival",
      servingTeam:"rival",
      nextServeAt:performance.now() + 650,
      pointResumeAt:0,
      lastTouchTeam:"rival",
      teamTouches:0,
      lastTouchPlayerId:null,
      rivalReceiverId:null,
      rivalSetterId:null,
      rivalAttackerId:null,
      ball:{ x:50, y:13, z:2, vx:0, vy:0, vz:0, inPlay:false },
      message:"SAQUE VISITANTE · se posiciona, a bola já vem."
    };
    renderVolleyballDynamic();

    let last = performance.now();
    const tick = (now) => {
      if (!state.open || state.current?.type !== "volleyball" || !state.current?.dynamic) return;
      const dt = Math.min(.034, Math.max(0, (now - last) / 1000));
      last = now;
      updateVolleyballDynamic(now, dt);
      state.rafId = requestAnimationFrame(tick);
    };
    state.rafId = requestAnimationFrame(tick);
  }

'''

sports = before + dynamic + end_marker + after

sports = sports.replace(
    'volleyball: "Construa a jogada em três toques: mova a recepção com WASD, use J no contato, escolha o levantamento com A/S/D e ataque no tempo certo.",',
    'volleyball: "Partida contínua em tempo real. WASD move o atleta ativo e J executa o toque contextual: recepção, levantamento, ataque ou saque.",',
    1
)

old_input = '''    if (game.type === "volleyball") {
      if (game.prototype) {
        if (["a","s","d"].includes(key) && !event.repeat && game.phase !== "reception") volleyballPrototypeDirection(key);
        if (key === "j" && !event.repeat) volleyballPrototypeAction();
      } else if (["a","s","d"].includes(key)) {
        volleyballInput(key);
      }
    }
'''
new_input = '''    if (game.type === "volleyball") {
      if (game.dynamic) {
        if (key === "j" && !event.repeat) volleyballDynamicAction();
      } else if (["a","s","d"].includes(key)) {
        volleyballInput(key);
      }
    }
'''
if old_input not in sports:
    raise SystemExit('volleyball input handler marker not found')
sports = sports.replace(old_input, new_input, 1)

css_marker = '/* Volei V0.2 prototype */'
if css_marker not in css:
    raise SystemExit('volleyball css marker not found')
css = css.split(css_marker, 1)[0] + r'''/* Volei V0.3 · rally continuo */
.volleyball-dynamic-card { width:min(1120px,100%) !important; }
.volleyball-dynamic-scoreboard {
  display:grid; grid-template-columns:1fr auto 1fr; gap:12px; align-items:center;
  margin-bottom:12px; text-align:center;
}
.volleyball-dynamic-scoreboard > div:not(.volleyball-dynamic-center) {
  display:grid; gap:2px; padding:8px 12px; border-radius:12px;
  background:rgba(255,255,255,.045); border:1px solid rgba(255,255,255,.09);
}
.volleyball-dynamic-scoreboard small { font-size:.58rem; letter-spacing:1.3px; opacity:.6; }
.volleyball-dynamic-scoreboard strong { font-size:1.55rem; }
.volleyball-dynamic-scoreboard > div:first-child strong { color:#baffdf; }
.volleyball-dynamic-scoreboard > div:last-child strong { color:#ffadb7; }
.volleyball-dynamic-center { display:grid; gap:3px; min-width:190px; }
.volleyball-dynamic-center b { color:#ffd166; font-size:.62rem; letter-spacing:1.2px; }
.volleyball-dynamic-center span { color:rgba(245,251,255,.82); font-size:.72rem; font-weight:1000; }

.volleyball-dynamic-court {
  position:relative; width:min(980px,100%); aspect-ratio:16/9; margin:0 auto;
  overflow:hidden; border-radius:18px; border:2px solid rgba(99,245,181,.32);
  background:
    linear-gradient(90deg, transparent 49.8%, rgba(255,255,255,.06) 50%, transparent 50.2%),
    linear-gradient(180deg, rgba(255,107,122,.075) 0 49.5%, rgba(99,245,181,.085) 50.5% 100%),
    repeating-linear-gradient(90deg, rgba(255,255,255,.016) 0 68px, rgba(255,255,255,.035) 69px 70px),
    #07131a;
  box-shadow:inset 0 0 70px rgba(0,0,0,.34);
  contain:layout paint style;
}
.volleyball-dynamic-net {
  position:absolute; z-index:7; left:4%; right:4%; top:50%; height:8px;
  transform:translateY(-50%); background:#eefcff;
  box-shadow:0 0 12px rgba(255,255,255,.42);
}
.volleyball-dynamic-net::before,
.volleyball-dynamic-net::after {
  content:""; position:absolute; top:-10px; width:5px; height:28px; border-radius:4px; background:#c8f6ff;
}
.volleyball-dynamic-net::before { left:-3px; }
.volleyball-dynamic-net::after { right:-3px; }
.volleyball-dynamic-net i {
  position:absolute; left:0; right:0; top:8px; height:12px; opacity:.24;
  background:repeating-linear-gradient(90deg,#fff 0 1px,transparent 1px 12px);
}
.volleyball-attack-line { position:absolute; left:5%; right:5%; height:1px; border-top:1px dashed rgba(255,255,255,.13); }
.volleyball-attack-line.line-rival { top:34%; }
.volleyball-attack-line.line-voltz { top:66%; }
.volleyball-side-label { position:absolute; z-index:1; left:12px; font-size:.52rem; font-weight:1000; letter-spacing:1.5px; opacity:.38; }
.volleyball-side-label.rival { top:9px; color:#ffadb7; }
.volleyball-side-label.voltz { bottom:9px; color:#baffdf; }

.volleyball-dynamic-player {
  position:absolute; z-index:5; width:31px; height:31px; border-radius:50%;
  transform:translate(-50%,-50%); transition:box-shadow .08s ease, width .08s ease, height .08s ease;
  display:grid; place-items:center; will-change:left,top;
}
.volleyball-dynamic-player span {
  position:absolute; top:34px; left:50%; transform:translateX(-50%);
  font-size:.46rem; font-weight:1000; letter-spacing:.7px; white-space:nowrap; opacity:.55;
}
.volleyball-dynamic-player.team-voltz {
  background:#63f5b5; border:3px solid #e5fff2; color:#dffff0;
  box-shadow:0 0 15px rgba(99,245,181,.18);
}
.volleyball-dynamic-player.team-rival {
  background:#ff6b7a; border:3px solid #ffd8dc; color:#ffd8dc;
  box-shadow:0 0 15px rgba(255,107,122,.16);
}
.volleyball-dynamic-player.is-active {
  width:38px; height:38px; border-color:#fff;
  box-shadow:0 0 0 8px rgba(69,163,255,.12),0 0 24px rgba(69,163,255,.52);
  background:#45a3ff;
}
.volleyball-dynamic-player.is-active span { opacity:1; color:#fff; }
.volleyball-dynamic-player.can-touch {
  box-shadow:0 0 0 10px rgba(255,209,102,.14),0 0 28px rgba(255,209,102,.62);
}

.volleyball-dynamic-ball {
  position:absolute; z-index:12; width:31px; height:31px; display:grid; place-items:center;
  font-size:1.42rem; pointer-events:none; opacity:.68;
  filter:drop-shadow(0 5px 6px rgba(0,0,0,.48));
  will-change:left,top,transform;
}
.volleyball-dynamic-ball.in-play { opacity:1; }
.volleyball-ball-shadow {
  position:absolute; z-index:3; width:26px; height:12px; border-radius:50%;
  background:rgba(0,0,0,.48); filter:blur(2px); pointer-events:none;
  will-change:left,top,transform,opacity;
}
.volleyball-landing-marker {
  position:absolute; z-index:2; width:54px; height:26px; border-radius:50%;
  transform:translate(-50%,-50%); border:2px dashed rgba(255,209,102,.75);
  background:rgba(255,209,102,.045); opacity:0; pointer-events:none;
}
.volleyball-landing-marker.visible { opacity:1; animation:volleyballLandingPulse .62s ease-in-out infinite alternate; }
@keyframes volleyballLandingPulse { from{ transform:translate(-50%,-50%) scale(.86); } to{ transform:translate(-50%,-50%) scale(1.05); } }

.volleyball-dynamic-hud { margin-top:12px; }
.volleyball-control-strip { display:flex; gap:9px; justify-content:center; flex-wrap:wrap; }
.volleyball-control-strip span {
  padding:7px 10px; border-radius:999px; background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.085); color:rgba(245,251,255,.64); font-size:.65rem; font-weight:900;
}
.volleyball-control-strip b { color:#ffd166; }

@media(max-width:700px){
  .volleyball-dynamic-scoreboard { grid-template-columns:1fr 1fr; }
  .volleyball-dynamic-center { grid-column:1/-1; grid-row:1; }
  .volleyball-dynamic-court { aspect-ratio:4/3; }
  .volleyball-dynamic-player { width:27px; height:27px; }
  .volleyball-dynamic-player.is-active { width:34px; height:34px; }
}
'''

for text_name, text in [('volleyball.html', volley_html), ('game.html', game_html)]:
    pass
volley_html = volley_html.replace('volleyball-v02', 'volleyball-v03')
game_html = game_html.replace('volleyball-v02', 'volleyball-v03')

sports_path.write_text(sports, encoding='utf-8')
css_path.write_text(css, encoding='utf-8')
volley_html_path.write_text(volley_html, encoding='utf-8')
game_html_path.write_text(game_html, encoding='utf-8')

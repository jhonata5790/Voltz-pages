(function initializeVolleyballPressureEngine(global) {
  const SOURCE_URL = "assets/js/realms/physical-education/sports-minigames.js?v=volleyball-v09-base";

  function loadFallback(error) {
    console.error("[Voltz Volei V0.9] Falha ao aplicar balanceamento. Carregando motor base.", error);
    const script = document.createElement("script");
    script.src = SOURCE_URL;
    script.defer = true;
    document.head.appendChild(script);
  }

  async function boot() {
    try {
      const response = await fetch(SOURCE_URL, { cache:"no-store" });
      if (!response.ok) throw new Error(`Falha ao buscar motor base: HTTP ${response.status}`);
      let source = await response.text();

      function replaceExact(oldText, newText, label) {
        if (!source.includes(oldText)) throw new Error(`Patch nao encontrou: ${label}`);
        source = source.replace(oldText, newText);
      }

      function insertBefore(marker, text, label) {
        const index = source.indexOf(marker);
        if (index < 0) throw new Error(`Patch nao encontrou anchor: ${label}`);
        source = source.slice(0, index) + text + source.slice(index);
      }

      function replaceFunction(name, nextName, replacement) {
        const startMarker = `  function ${name}(`;
        const endMarker = `\n  function ${nextName}(`;
        const start = source.indexOf(startMarker);
        const end = source.indexOf(endMarker, start);
        if (start < 0 || end < 0) throw new Error(`Patch nao encontrou funcao: ${name}`);
        source = source.slice(0, start) + replacement.trimEnd() + source.slice(end);
      }

      replaceExact(
`    g.rivalAttackContact = null;
    g.voltzReceiverId = null;
    g.ball = { x:50, y:team === "voltz" ? 87 : 13, z:2, vx:0, vy:0, vz:0, inPlay:false };`,
`    g.rivalAttackContact = null;
    g.voltzReceiverId = null;
    g.lastVoltzAttackPressure = 0;
    g.rivalReceiveQuality = 1;
    g.rivalSetQuality = 1;
    g.rivalReceiveReactionUntil = 0;
    g.rivalErrorReason = "";
    g.ball = { x:50, y:team === "voltz" ? 87 : 13, z:2, vx:0, vy:0, vz:0, inPlay:false };`,
        "reset de qualidade rival"
      );

      replaceExact(
`    g.lastTouchTeam = "voltz";
    g.teamTouches = 0;
    volleyballLaunch(g, target.x, target.y, 1.15, 0);`,
`    g.lastVoltzAttackPressure = volleyballVoltzAttackPressure(g, target, .62, true);
    g.lastTouchTeam = "voltz";
    g.teamTouches = 0;
    volleyballLaunch(g, target.x, target.y, 1.15, 0);`,
        "pressao do saque Voltz"
      );

      replaceExact(
`    const timing = clamp(1 - Math.abs(g.ball.z - 18) / 15, .35, 1);
    const duration = .66 - timing * .12;
    volleyballLaunch(g, target.x, target.y, duration, 0);`,
`    const timing = clamp(1 - Math.abs(g.ball.z - 18) / 15, .35, 1);
    const duration = .66 - timing * .12;
    g.lastVoltzAttackPressure = volleyballVoltzAttackPressure(g, target, timing, false);
    g.lastVoltzAttackTarget = { x:target.x, y:target.y };
    volleyballLaunch(g, target.x, target.y, duration, 0);`,
        "pressao do corte Voltz"
      );

      const helpers = String.raw`  function volleyballRivalRoleSkill(player, skill) {
    if (!player) return .82;
    if (skill === "receive") return player.role === "LEV" ? .80 : .94;
    if (skill === "set") return player.role === "LEV" ? .99 : .78;
    if (skill === "attack") return player.role === "PONTA" ? .96 : .72;
    return .84;
  }

  function volleyballRivalPrepareRun(player, kind) {
    if (!player) return;
    player.rivalActionKind = kind;
    player.rivalActionStartX = player.x;
    player.rivalActionStartY = player.y;
  }

  function volleyballRivalRunDistance(player) {
    if (!player) return 0;
    const startX = Number.isFinite(Number(player.rivalActionStartX)) ? Number(player.rivalActionStartX) : player.x;
    const startY = Number.isFinite(Number(player.rivalActionStartY)) ? Number(player.rivalActionStartY) : player.y;
    return Math.hypot(player.x - startX, player.y - startY);
  }

  function volleyballVoltzAttackPressure(g, target, timing = .55, serve = false) {
    const defenders = volleyballTeamPlayers(g, "rival");
    const nearest = defenders.length
      ? Math.min(...defenders.map((defender) => volleyballDistance(defender, target)))
      : 24;
    const space = clamp((nearest - 3) / 25, 0, 1);
    const edge = clamp(Math.abs(Number(target?.x || 50) - 50) / 36, 0, 1);
    const depth = clamp((42 - Number(target?.y || 30)) / 30, 0, 1);

    if (serve) {
      return clamp(.08 + timing * .10 + space * .22 + edge * .08 + depth * .05, .08, .48);
    }
    return clamp(timing * .46 + space * .34 + edge * .12 + depth * .08, .12, .98);
  }

  function volleyballRivalContactQuality(g, player, kind) {
    const run = volleyballRivalRunDistance(player);
    const runBudget = kind === "receive" ? 30 : kind === "set" ? 27 : 29;
    const runGood = clamp(1 - run / runBudget, 0, 1);
    const skill = volleyballRivalRoleSkill(player, kind);

    if (kind === "receive") {
      const distance = volleyballDistance(player, g.ball);
      const contactGood = clamp(1 - distance / 5.6, 0, 1);
      const heightGood = clamp(1 - Math.abs(Number(g.ball.z || 0) - 5) / 6.5, 0, 1);
      const pressure = clamp(Number(g.lastVoltzAttackPressure || 0), 0, 1);
      return clamp(skill * .40 + runGood * .22 + contactGood * .16 + heightGood * .10 + .12 - pressure * .32, .08, 1);
    }

    if (kind === "set") {
      const receiveQuality = clamp(Number(g.rivalReceiveQuality ?? 1), 0, 1);
      return clamp(receiveQuality * .60 + skill * .26 + runGood * .14, .08, 1);
    }

    const setQuality = clamp(Number(g.rivalSetQuality ?? 1), 0, 1);
    return clamp(setQuality * .62 + skill * .26 + runGood * .12, .08, 1);
  }

`;
      insertBefore("  function volleyballRivalReceive(g, player) {", helpers, "helpers da IA pressionavel");

      replaceFunction("volleyballRivalReceive", "volleyballRivalSet", String.raw`  function volleyballRivalReceive(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    const quality = volleyballRivalContactQuality(g, player, "receive");
    g.rivalReceiveQuality = quality;
    const setter = volleyballChooseSetter(g, "rival", player.id);
    if (!setter) return;

    if (quality < .28) {
      const outX = player.x < 50 ? -8 : 108;
      g.rivalSetterId = null;
      g.rivalSetContact = null;
      g.rivalAttackContact = null;
      g.rivalErrorReason = "Seu ataque tirou o defensor do equilibrio e a recepcao espirrou.";
      g.message = "RECEPCAO ESTOURADA! A pressao da Voltz abriu o ponto.";
      volleyballLaunch(g, outX, clamp(player.y + 5, 8, 43), .68, 0);
      sportSfx("hit");
      return;
    }

    const error = 1 - quality;
    const contact = {
      x:clamp(setter.x + (Math.random() - .5) * 12 * error, 16, 84),
      y:clamp(setter.y + (Math.random() - .5) * 8 * error, 24, 43)
    };
    g.rivalSetterId = setter.id;
    g.rivalSetContact = contact;
    g.rivalAttackContact = null;
    volleyballRivalPrepareRun(setter, "set");
    volleyballLaunch(g, contact.x, contact.y, .70 + error * .15, 7 + error * 2.5);
    if (quality < .52) g.message = "RECEPCAO QUEBRADA! O levantador rival precisou correr atras da bola.";
  }`);

      replaceFunction("volleyballRivalSet", "volleyballRivalAttack", String.raw`  function volleyballRivalSet(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    const quality = volleyballRivalContactQuality(g, player, "set");
    g.rivalSetQuality = quality;
    g.rivalSetContact = null;

    if (quality < .38) {
      g.rivalAttackerId = null;
      g.rivalAttackContact = null;
      const freeX = clamp(player.x + (Math.random() - .5) * 12, 20, 80);
      g.message = "LEVANTAMENTO QUEBRADO! Bola de graca atravessando para a Voltz.";
      volleyballLaunch(g, freeX, 61 + Math.random() * 7, .72, 0);
      sportSfx("hit");
      return;
    }

    const attacker = volleyballChooseAttacker(g, "rival", player.id);
    if (!attacker) return;
    const error = 1 - quality;
    const contact = {
      x:clamp(attacker.x + (Math.random() - .5) * 14 * error, 14, 86),
      y:clamp(43.5 - error * 6, 35, 44)
    };
    g.rivalAttackerId = attacker.id;
    g.rivalAttackContact = contact;
    volleyballRivalPrepareRun(attacker, "attack");
    volleyballLaunch(g, contact.x, contact.y, .72 + error * .14, 13 + quality * 6);
    if (quality < .60) g.message = "LEVANTAMENTO FORA DO PONTO! O atacante rival vai chegar desequilibrado.";
  }`);

      replaceFunction("volleyballRivalAttack", "volleyballRivalContactReady", String.raw`  function volleyballRivalAttack(g, player) {
    volleyballRegisterTouch(g, "rival", player.id);
    g.rivalSetContact = null;
    g.rivalAttackContact = null;
    const quality = volleyballRivalContactQuality(g, player, "attack");
    const setQuality = clamp(Number(g.rivalSetQuality ?? 1), 0, 1);

    if (setQuality < .48 || quality < .43) {
      const outX = player.x < 50 ? -9 : 109;
      g.rivalErrorReason = "A recepcao e o levantamento quebrados deixaram o atacante sem equilibrio.";
      g.message = "ATAQUE RIVAL PRA FORA! A pressao acumulada virou erro.";
      volleyballLaunch(g, outX, 72 + Math.random() * 8, .64, 0);
      sportSfx("hit");
      return;
    }

    if (setQuality < .64 || quality < .62) {
      const target = { x:clamp(50 + (player.x - 50) * .20, 34, 66), y:74 + Math.random() * 7 };
      volleyballLaunch(g, target.x, target.y, .86, 0);
      volleyballChooseVoltzReceiver(g, target);
      g.message = "ATAQUE SEM FORCA! A Voltz forcou uma bola de graca.";
      sportSfx("hit");
      return;
    }

    const openTarget = volleyballOpenTarget(g, "rival", [
      { x:18, y:82 }, { x:50, y:86 }, { x:82, y:82 },
      { x:30, y:62 }, { x:70, y:62 }
    ]);
    const safety = clamp((.82 - quality) / .35, 0, 1);
    const target = {
      x:clamp(openTarget.x + (50 - openTarget.x) * safety * .42, 12, 88),
      y:clamp(openTarget.y + (76 - openTarget.y) * safety * .30, 60, 88)
    };
    volleyballLaunch(g, target.x, target.y, .66 - quality * .06, 0);
    volleyballChooseVoltzReceiver(g, target);
    g.message = quality > .82 ? "ATAQUE VISITANTE! Le a queda e corre." : "Ataque rival controlado. A jogada anterior tirou um pouco da forca.";
    sportSfx("hit");
  }`);

      replaceFunction("volleyballUpdateRivalAI", "volleyballUpdatePlayers", String.raw`  function volleyballUpdateRivalAI(g, dt) {
    if (g.phase !== "rally" || !g.ball.inPlay) return;
    const touches = volleyballTouchesFor(g, "rival");
    const landing = volleyballLanding(g.ball) || { x:g.ball.x, y:g.ball.y };

    if (touches === 0 && (g.lastTouchTeam !== "rival" || g.teamTouches === 0)) {
      if (!g.rivalReceiverId) {
        const receiver = volleyballTeamPlayers(g, "rival")
          .slice()
          .sort((a, b) => volleyballDistance(a, landing) - volleyballDistance(b, landing))[0];
        g.rivalReceiverId = receiver?.id || null;
        if (receiver) {
          volleyballRivalPrepareRun(receiver, "receive");
          const pressure = clamp(Number(g.lastVoltzAttackPressure || 0), 0, 1);
          g.rivalReceiveReactionUntil = performance.now() + 80 + pressure * 175;
        }
      }
      const receiver = volleyballPlayer(g, g.rivalReceiverId);
      if (receiver) {
        const pressure = clamp(Number(g.lastVoltzAttackPressure || 0), 0, 1);
        if (performance.now() < Number(g.rivalReceiveReactionUntil || 0)) return;
        const rolePenalty = receiver.role === "LEV" ? 1.4 : 0;
        const speed = clamp(33 - pressure * 6 - rolePenalty, 25.8, 33);
        volleyballMoveToward(receiver, clamp(landing.x, 10, 90), clamp(landing.y, 8, 46), speed, dt, 7, 46);
        if (volleyballRivalContactReady(receiver, g.ball, "receive")) volleyballRivalReceive(g, receiver);
      }
      return;
    }

    if (touches === 1) {
      const setter = volleyballPlayer(g, g.rivalSetterId);
      if (setter) {
        const contact = g.rivalSetContact || landing;
        const quality = clamp(Number(g.rivalReceiveQuality ?? 1), 0, 1);
        const speed = 31 + quality * 4;
        volleyballMoveToward(setter, clamp(contact.x, 18, 82), clamp(contact.y, 22, 44), speed, dt, 7, 46);
        if (volleyballRivalContactReady(setter, g.ball, "set")) volleyballRivalSet(g, setter);
      }
      return;
    }

    if (touches === 2) {
      const attacker = volleyballPlayer(g, g.rivalAttackerId);
      if (attacker) {
        const contact = g.rivalAttackContact || landing;
        const quality = clamp(Number(g.rivalSetQuality ?? 1), 0, 1);
        const speed = 33 + quality * 5;
        volleyballMoveToward(attacker, clamp(contact.x, 10, 90), clamp(contact.y, 35, 46), speed, dt, 7, 46);
        if (volleyballRivalContactReady(attacker, g.ball, "attack")) volleyballRivalAttack(g, attacker);
      }
    }
  }`);

      replaceExact(
`      const winner = g.lastTouchTeam === "voltz" ? "rival" : "voltz";
      volleyballPoint(g, winner, winner === "voltz" ? "FORA! Ponto Voltz." : "Ataque pra fora. Ponto visitante.");`,
`      const winner = g.lastTouchTeam === "voltz" ? "rival" : "voltz";
      const reason = winner === "voltz" && g.rivalErrorReason
        ? "FORA! " + g.rivalErrorReason + " PONTO VOLTZ!"
        : winner === "voltz" ? "FORA! Ponto Voltz." : "Ataque pra fora. Ponto visitante.";
      g.rivalErrorReason = "";
      volleyballPoint(g, winner, reason);`,
        "mensagem de erro para fora"
      );

      replaceExact(
`    if (ball.y > 50) volleyballPoint(g, "rival", "A bola caiu na quadra Voltz. Ponto visitante.");
    else volleyballPoint(g, "voltz", "A bola tocou o chão do outro lado. PONTO VOLTZ!");`,
`    if (ball.y > 50) volleyballPoint(g, "rival", "A bola caiu na quadra Voltz. Ponto visitante.");
    else {
      const pressure = clamp(Number(g.lastVoltzAttackPressure || 0), 0, 1);
      volleyballPoint(g, "voltz", pressure >= .66
        ? "NO CHAO! Seu ataque abriu espaco e a defesa rival nao chegou. PONTO VOLTZ!"
        : "A bola tocou o chão do outro lado. PONTO VOLTZ!");
    }`,
        "mensagem de bola no chao rival"
      );

      replaceExact(
`      rivalAttackContact:null,
      voltzReceiverId:null,
      ball:{ x:50, y:13, z:2, vx:0, vy:0, vz:0, inPlay:false },`,
`      rivalAttackContact:null,
      voltzReceiverId:null,
      lastVoltzAttackPressure:0,
      rivalReceiveQuality:1,
      rivalSetQuality:1,
      rivalReceiveReactionUntil:0,
      rivalErrorReason:"",
      ball:{ x:50, y:13, z:2, vx:0, vy:0, vz:0, inPlay:false },`,
        "estado inicial da IA rival"
      );

      if (!source.includes("function volleyballVoltzAttackPressure")) throw new Error("Patch V0.9 incompleto");
      if (!source.includes("RECEPCAO ESTOURADA")) throw new Error("Patch V0.9 sem feedback de pressao");

      const script = document.createElement("script");
      script.textContent = `${source}\n//# sourceURL=voltz-sports-minigames-v09-pressure.js`;
      document.head.appendChild(script);
      global.VoltzVolleyballPressureEngine = Object.freeze({ version:"0.9", patched:true });
      console.info("[Voltz Volei] V0.9 pressure engine carregado.");
    } catch (error) {
      loadFallback(error);
    }
  }

  boot();
})(window);

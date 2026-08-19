(function installVolleyballPowerCoreV11(global) {
  const nativeFetch = global.fetch.bind(global);
  let armed = true;

  function isSportsEngineRequest(input) {
    const url = typeof input === "string" ? input : String(input?.url || "");
    return url.includes("assets/js/realms/physical-education/sports-minigames.js");
  }

  global.fetch = async function voltzVolleyballPowerFetch(input, init) {
    const response = await nativeFetch(input, init);
    if (!armed || !isSportsEngineRequest(input)) return response;

    const source = await response.clone().text();
    const closing = "\n})(window);";
    const closingIndex = source.lastIndexOf(closing);
    if (closingIndex < 0) return response;

    armed = false;
    global.fetch = nativeFetch;

    const injection = String.raw`

  // -------------------------------------------------------
  // Volei V1.1 · poderes individuais e carga por jogador
  // -------------------------------------------------------
  const VOLLEYBALL_POWER_DEFS_V11 = Object.freeze({
    v1:Object.freeze({ id:"fire-serve", icon:"🔥", name:"Saque Incandescente", kind:"serve" }),
    v2:Object.freeze({ id:"energized-set", icon:"✨", name:"Levantamento Energizado", kind:"set" }),
    v3:Object.freeze({ id:"lightning-cut", icon:"⚡", name:"Corte Relampago", kind:"attack" })
  });

  function volleyballV11EnsurePowers(g) {
    if (!g?.dynamic || g.type !== "volleyball") return null;
    g.volleyballPowers ||= {};
    Object.entries(VOLLEYBALL_POWER_DEFS_V11).forEach(([playerId, def]) => {
      const current = g.volleyballPowers[playerId] || {};
      g.volleyballPowers[playerId] = {
        playerId,
        powerId:def.id,
        icon:def.icon,
        name:def.name,
        kind:def.kind,
        charge:clamp(Number(current.charge || 0), 0, 100)
      };
    });
    if (!Number.isFinite(Number(g.voltzServeIndex))) g.voltzServeIndex = 0;
    return g.volleyballPowers;
  }

  function volleyballV11Power(g, playerId) {
    return volleyballV11EnsurePowers(g)?.[playerId] || null;
  }

  function volleyballV11AddCharge(g, playerId, amount) {
    const power = volleyballV11Power(g, playerId);
    if (!power) return 0;
    power.charge = clamp(Number(power.charge || 0) + Number(amount || 0), 0, 100);
    return power.charge;
  }

  function volleyballV11Armed(g, powerId = "") {
    const armedPower = g?.volleyballArmedPower || null;
    if (!armedPower) return null;
    if (powerId && armedPower.powerId !== powerId) return null;
    return armedPower;
  }

  function volleyballV11ClearArmed(g) {
    if (!g) return;
    g.volleyballArmedPower = null;
  }

  function volleyballV11ConsumeArmed(g, powerId, playerId) {
    const armedPower = volleyballV11Armed(g, powerId);
    if (!armedPower || (playerId && armedPower.playerId !== playerId)) return false;
    const power = volleyballV11Power(g, armedPower.playerId);
    if (!power || power.charge < 100) {
      volleyballV11ClearArmed(g);
      return false;
    }
    power.charge = 0;
    volleyballV11ClearArmed(g);
    return true;
  }

  function volleyballV11Usable(g, player, def) {
    if (!g || !player || !def) return { ok:false, reason:"Sem poder neste jogador." };
    const touches = volleyballTouchesFor(g, "voltz");
    if (def.id === "fire-serve") {
      const valid = g.phase === "serve-voltz" && g.currentVoltzServerId === player.id;
      return { ok:valid, reason:valid ? "" : "Saque Incandescente so pode ser armado quando este jogador estiver sacando." };
    }
    if (def.id === "energized-set") {
      const valid = g.phase === "rally" && g.ball?.inPlay && touches === 1;
      return { ok:valid, reason:valid ? "" : "Levantamento Energizado entra no segundo toque da jogada." };
    }
    if (def.id === "lightning-cut") {
      const valid = g.phase === "rally" && g.ball?.inPlay && touches === 2;
      return { ok:valid, reason:valid ? "" : "Corte Relampago entra no terceiro toque da jogada." };
    }
    return { ok:false, reason:"Poder indisponivel agora." };
  }

  const volleyballRegisterTouchV11Base = volleyballRegisterTouch;
  volleyballRegisterTouch = function volleyballRegisterTouchV11(g, team, playerId) {
    const beforeTouches = team === "voltz" ? volleyballTouchesFor(g, "voltz") : 0;
    const result = volleyballRegisterTouchV11Base(g, team, playerId);
    if (team === "voltz" && g?.dynamic) {
      const mainGain = beforeTouches === 0 ? 22 : beforeTouches === 1 ? 29 : 34;
      volleyballV11AddCharge(g, playerId, mainGain);
      volleyballTeamPlayers(g, "voltz").forEach((mate) => {
        if (mate.id !== playerId) volleyballV11AddCharge(g, mate.id, 4);
      });
    }
    return result;
  };

  const volleyballPointV11Base = volleyballPoint;
  volleyballPoint = function volleyballPointV11(g, team, message) {
    if (g?.dynamic && team === "voltz") {
      volleyballTeamPlayers(g, "voltz").forEach((player) => volleyballV11AddCharge(g, player.id, 9));
    }
    volleyballV11ClearArmed(g);
    g.volleyballLightningPending = false;
    return volleyballPointV11Base(g, team, message);
  };

  const volleyballPrepareServeV11Base = volleyballPrepareServe;
  volleyballPrepareServe = function volleyballPrepareServeV11(g, team = g.servingTeam || "rival") {
    const result = volleyballPrepareServeV11Base(g, team);
    volleyballV11EnsurePowers(g);
    volleyballV11ClearArmed(g);
    g.volleyballLightningPending = false;
    g.volleyballFx = null;

    if (team !== "voltz") {
      g.currentVoltzServerId = null;
      return result;
    }

    const order = ["v1", "v2", "v3"];
    const serverId = order[Number(g.voltzServeIndex || 0) % order.length];
    g.voltzServeIndex = Number(g.voltzServeIndex || 0) + 1;
    const baseServer = volleyballPlayer(g, "v2");
    if (baseServer && serverId !== "v2") {
      baseServer.x = baseServer.homeX;
      baseServer.y = baseServer.homeY;
    }
    const server = volleyballPlayer(g, serverId);
    if (server) {
      server.x = 50;
      server.y = 88;
      g.currentVoltzServerId = server.id;
      volleyballSetActive(g, server.id, "SAQUE");
      g.ball.x = server.x;
      g.ball.y = server.y - 3;
      g.ball.z = 3;
      const def = VOLLEYBALL_POWER_DEFS_V11[server.id];
      g.message = def?.id === "fire-serve"
        ? "SEU SAQUE · este sacador possui Saque Incandescente. K saca; L arma o poder quando estiver carregado."
        : "SEU SAQUE · K executa o saque normal.";
    }
    return result;
  };

  const volleyballVoltzServeV11Base = volleyballVoltzServe;
  volleyballVoltzServe = function volleyballVoltzServeV11(g) {
    const server = volleyballPlayer(g, g.activePlayerId);
    const fireArmed = Boolean(server && volleyballV11Armed(g, "fire-serve")?.playerId === server.id);
    if (fireArmed) volleyballV11ConsumeArmed(g, "fire-serve", server.id);

    const result = volleyballVoltzServeV11Base(g);
    if (!fireArmed || !g.ball?.inPlay) return result;

    const landing = volleyballLanding(g.ball) || { x:50, y:22 };
    const target = {
      x:clamp(landing.x, 10, 90),
      y:clamp(landing.y, 9, 44)
    };
    volleyballLaunch(g, target.x, target.y, .72, 0);
    g.lastVoltzAttackPressure = .94;
    g.lastVoltzAttackTarget = { ...target };
    g.volleyballFx = { type:"fire", playerId:server.id, until:performance.now() + 1550 };
    g.message = "🔥 SAQUE INCANDESCENTE! A bola atravessa a quadra antes da defesa conseguir se organizar.";
    sportSfx("impactPower");
    return result;
  };

  const volleyballVoltzSetV11Base = volleyballVoltzSet;
  volleyballVoltzSet = function volleyballVoltzSetV11(g, player) {
    const energized = Boolean(player && volleyballV11Armed(g, "energized-set")?.playerId === player.id);
    if (energized) volleyballV11ConsumeArmed(g, "energized-set", player.id);

    const result = volleyballVoltzSetV11Base(g, player);
    if (!energized || g.lastTouchTeam !== "voltz" || volleyballTouchesFor(g, "voltz") !== 2) return result;

    const attacker = volleyballPlayer(g, g.activePlayerId);
    if (attacker?.team === "voltz") {
      volleyballLaunch(g, clamp(attacker.x, 16, 84), 56.5, .68, 23);
      g.volleyballFx = { type:"energy", playerId:player.id, until:performance.now() + 1100 };
      g.message = "✨ LEVANTAMENTO ENERGIZADO! A recepcao foi estabilizada e a bola chegou limpa para o ataque.";
      sportSfx("counterReady");
    }
    return result;
  };

  function volleyballV11ActivatePower() {
    const g = state.current;
    if (!g?.dynamic || g.type !== "volleyball") return { ok:false, message:"Abra a partida de volei primeiro." };
    volleyballV11EnsurePowers(g);
    const player = volleyballPlayer(g, g.activePlayerId);
    const def = VOLLEYBALL_POWER_DEFS_V11[player?.id];
    const power = volleyballV11Power(g, player?.id);
    if (!player || !def || !power) return { ok:false, message:"Este jogador nao possui poder." };

    if (power.charge < 100) {
      const message = `${def.icon} ${def.name}: ${Math.round(power.charge)}% carregado.`;
      g.message = message;
      return { ok:false, message, charge:power.charge };
    }

    const usable = volleyballV11Usable(g, player, def);
    if (!usable.ok) {
      g.message = usable.reason;
      return { ok:false, message:usable.reason, charge:power.charge };
    }

    const current = volleyballV11Armed(g);
    if (current?.playerId === player.id && current?.powerId === def.id) {
      volleyballV11ClearArmed(g);
      g.message = `${def.icon} ${def.name} desarmado. A carga foi preservada.`;
      return { ok:true, armed:false, playerId:player.id, powerId:def.id, charge:power.charge };
    }

    g.volleyballArmedPower = { playerId:player.id, powerId:def.id, armedAt:performance.now() };
    if (def.id === "fire-serve") g.message = "🔥 SAQUE INCANDESCENTE ARMADO · aperte K para incendiar o saque.";
    else if (def.id === "energized-set") g.message = "✨ LEVANTAMENTO ENERGIZADO ARMADO · aperte K no segundo toque.";
    else g.message = "⚡ CORTE RELAMPAGO ARMADO · construa o contato e aperte J para o corte especial.";
    sportSfx("counterReady");
    return { ok:true, armed:true, playerId:player.id, powerId:def.id, charge:power.charge };
  }

  function volleyballV11BeginLightning() {
    const g = state.current;
    const player = volleyballPlayer(g, g?.activePlayerId);
    if (!g?.dynamic || !player || player.id !== "v3") return false;
    if (!volleyballV11Armed(g, "lightning-cut") || volleyballTouchesFor(g, "voltz") !== 2) return false;
    const consumed = volleyballV11ConsumeArmed(g, "lightning-cut", player.id);
    if (!consumed) return false;
    g.volleyballLightningPending = true;
    g.volleyballFx = { type:"lightning-charge", playerId:player.id, until:performance.now() + 1800 };
    return true;
  }

  function volleyballV11FinishLightning(outcome = {}) {
    const g = state.current;
    if (!g?.dynamic || !g.volleyballLightningPending) return false;
    g.volleyballLightningPending = false;
    const good = Boolean(outcome.good);
    const perfect = Boolean(outcome.perfect);

    if (!good || !g.ball?.inPlay) {
      g.volleyballFx = { type:"lightning-miss", playerId:"v3", until:performance.now() + 700 };
      g.lastVoltzAttackPressure = Math.min(.16, Number(g.lastVoltzAttackPressure || .16));
      g.message = "⚡ O RELAMPAGO ESCAPOU DO TEMPO! O corte saiu torto e a defesa consegue ler a bola.";
      return true;
    }

    const target = volleyballOpenTarget(g, "voltz", [
      { x:12, y:14 }, { x:50, y:11 }, { x:88, y:14 },
      { x:18, y:41 }, { x:82, y:41 }, { x:50, y:39 }
    ]);
    volleyballLaunch(g, target.x, target.y, perfect ? .30 : .37, 0);
    g.lastVoltzAttackPressure = perfect ? 1 : .985;
    g.lastVoltzAttackTarget = { ...target };
    g.volleyballFx = { type:"lightning", playerId:"v3", until:performance.now() + 1050 };
    g.message = perfect
      ? "⚡⚡ CORTE RELAMPAGO PERFEITO! A bola sumiu no maior vazio da defesa!"
      : "⚡ CORTE RELAMPAGO! O ataque explodiu no espaco antes da cobertura fechar.";
    sportSfx("impactPower");
    return true;
  }

  function volleyballV11Snapshot() {
    const g = state.current;
    if (!g?.dynamic || g.type !== "volleyball") return null;
    const powers = volleyballV11EnsurePowers(g);
    const activeId = g.activePlayerId || "";
    const player = volleyballPlayer(g, activeId);
    const def = VOLLEYBALL_POWER_DEFS_V11[activeId] || null;
    const usable = def && player ? volleyballV11Usable(g, player, def) : { ok:false };
    return {
      activePlayerId:activeId,
      currentServerId:g.currentVoltzServerId || null,
      armed:g.volleyballArmedPower ? { ...g.volleyballArmedPower } : null,
      lightningPending:Boolean(g.volleyballLightningPending),
      fx:g.volleyballFx ? { ...g.volleyballFx } : null,
      powers:Object.fromEntries(Object.entries(powers).map(([id, power]) => [id, { ...power, ready:power.charge >= 100 }])),
      activeUsable:Boolean(usable.ok)
    };
  }

  global.VoltzVolleyballPowerCoreV11 = Object.freeze({
    version:"1.1",
    getSnapshot:volleyballV11Snapshot,
    activate:volleyballV11ActivatePower,
    beginLightning:volleyballV11BeginLightning,
    finishLightning:volleyballV11FinishLightning,
    cancelArmed:() => {
      const g = state.current;
      if (!g?.dynamic) return false;
      volleyballV11ClearArmed(g);
      return true;
    },
    devChargeAll:() => {
      const g = state.current;
      if (!g?.dynamic || g.type !== "volleyball") return false;
      volleyballV11EnsurePowers(g);
      Object.values(g.volleyballPowers).forEach((power) => { power.charge = 100; });
      return true;
    }
  });
`;

    const patched = source.slice(0, closingIndex) + injection + source.slice(closingIndex);
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("content-type", "text/javascript; charset=utf-8");

    return new Response(patched, {
      status:response.status,
      statusText:response.statusText,
      headers
    });
  };

  global.VoltzVolleyballPowerCoreAccessV11 = Object.freeze({ installed:true });
})(window);

(function installVolleyballCoreAccessV10(global) {
  const nativeFetch = global.fetch.bind(global);
  let armed = true;

  function isSportsEngineRequest(input) {
    const url = typeof input === "string" ? input : String(input?.url || "");
    return url.includes("assets/js/realms/physical-education/sports-minigames.js");
  }

  global.fetch = async function voltzVolleyballFetch(input, init) {
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
  // Volei V1.0 · ponte interna para K/J e corte cinematografico
  // -------------------------------------------------------
  const volleyballUpdateDynamicV10Base = updateVolleyballDynamic;
  updateVolleyballDynamic = function volleyballUpdateDynamicV10(now, dt) {
    const g = state.current;
    const timeScale = g?.type === "volleyball" && g?.dynamic
      ? clamp(Number(g.volleyballTimeScale ?? 1), 0, 1)
      : 1;
    return volleyballUpdateDynamicV10Base(now, dt * timeScale);
  };

  function volleyballV10ActiveContext() {
    const g = state.current;
    if (!g?.dynamic || g.type !== "volleyball") return null;
    const player = volleyballPlayer(g, g.activePlayerId);
    if (!player || player.team !== "voltz") return null;
    return { g, player, touches:volleyballTouchesFor(g, "voltz") };
  }

  function volleyballV10CanTouch() {
    const context = volleyballV10ActiveContext();
    if (!context || context.g.phase !== "rally" || !context.g.ball?.inPlay) return false;
    const { g, player, touches } = context;
    const distance = volleyballDistance(player, g.ball);
    const maxDistance = touches === 2 ? 10.2 : 9.2;
    const maxHeight = touches === 2 ? 27 : touches === 1 ? 15 : 12;
    return distance <= maxDistance && g.ball.z <= maxHeight;
  }

  function volleyballV10SetMessage(message) {
    const g = state.current;
    if (!g?.dynamic || g.type !== "volleyball") return false;
    g.message = String(message || "");
    return true;
  }

  function volleyballV10DirectAttack(options = {}) {
    const context = volleyballV10ActiveContext();
    if (!context) return { ok:false, reason:"context" };
    const { g, player, touches } = context;
    if (g.phase !== "rally" || !g.ball?.inPlay) return { ok:false, reason:"rally" };
    if (!volleyballV10CanTouch()) {
      g.message = "Chega na bola primeiro! O ataque so sai quando voce realmente toca nela.";
      return { ok:false, reason:"contact" };
    }

    volleyballRegisterTouch(g, "voltz", player.id);

    const quality = clamp(Number(options.quality ?? .34), 0, 1);
    const soft = Boolean(options.soft);
    const miss = Boolean(options.miss);
    const openSpace = Boolean(options.openSpace);
    const rivals = volleyballTeamPlayers(g, "rival");
    let target;

    if (miss && rivals.length) {
      const easiest = rivals
        .slice()
        .sort((a, b) => volleyballDistance(a, { x:50, y:28 }) - volleyballDistance(b, { x:50, y:28 }))[0];
      target = {
        x:clamp(easiest.x + (Math.random() - .5) * 5, 14, 86),
        y:clamp(easiest.y + (Math.random() - .5) * 4, 10, 43)
      };
    } else if (openSpace) {
      target = volleyballOpenTarget(g, "voltz", [
        { x:16, y:17 }, { x:50, y:14 }, { x:84, y:17 },
        { x:24, y:39 }, { x:76, y:39 }, { x:50, y:36 }
      ]);
    } else {
      const input = volleyballInputVector();
      if (input.moving) {
        target = {
          x:clamp(50 + input.x * 28 + (player.x - 50) * .12, 14, 86),
          y:clamp(27 + input.y * 10, 12, 42)
        };
      } else {
        target = { x:clamp(50 + (player.x - 50) * .18, 24, 76), y:29 };
      }
    }

    let duration;
    if (miss) duration = .94;
    else if (soft) duration = 1.02;
    else if (quality >= .82) duration = .48;
    else duration = .82 - quality * .14;

    g.lastVoltzAttackPressure = miss || soft
      ? .08
      : openSpace
        ? clamp(.62 + quality * .34, .62, .98)
        : clamp(.14 + quality * .26, .14, .46);
    g.lastVoltzAttackTarget = { x:target.x, y:target.y };
    g.rivalReceiverId = null;
    g.rivalSetterId = null;
    g.rivalAttackerId = null;
    g.rivalSetContact = null;
    g.rivalAttackContact = null;
    g.rivalReceiveReactionUntil = 0;
    g.rivalErrorReason = "";

    volleyballLaunch(g, target.x, target.y, duration, 0);

    if (miss) {
      g.message = "PEGOU MAL! O corte saiu lento e caiu em cima da defesa rival.";
    } else if (soft) {
      g.message = touches === 2
        ? "TOQUE LEVE! Bola controlada para o outro lado."
        : "Toque controlado devolvido sem forcar a jogada.";
    } else if (openSpace && quality >= .82) {
      g.message = "CRAVADA! O corte encontrou o maior espaco vazio da defesa!";
    } else {
      g.message = "Ataque direto. A bola foi para o outro lado sem construir os tres toques.";
    }

    sportSfx(quality >= .82 && openSpace ? "impactPower" : "hit");
    return { ok:true, target:{ ...target }, quality, touchesBefore:touches };
  }

  global.VoltzVolleyballCoreV10 = Object.freeze({
    getState: () => state.current,
    getTouchCount: () => {
      const g = state.current;
      return g?.type === "volleyball" && g?.dynamic ? volleyballTouchesFor(g, "voltz") : -1;
    },
    getActivePlayer: () => {
      const g = state.current;
      const player = g?.dynamic ? volleyballPlayer(g, g.activePlayerId) : null;
      return player ? { id:player.id, role:player.role, team:player.team, x:player.x, y:player.y } : null;
    },
    canTouch: volleyballV10CanTouch,
    setMessage: volleyballV10SetMessage,
    directAttack: volleyballV10DirectAttack,
    setTimeScale: (value) => {
      const g = state.current;
      if (!g?.dynamic || g.type !== "volleyball") return false;
      g.volleyballTimeScale = clamp(Number(value), 0, 1);
      return true;
    },
    getTimeScale: () => {
      const g = state.current;
      return g?.type === "volleyball" && g?.dynamic ? Number(g.volleyballTimeScale ?? 1) : 1;
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

  global.VoltzVolleyballCoreAccessV10 = Object.freeze({ installed:true });
})(window);

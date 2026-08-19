(function initializeVolleyballPowersV11(global) {
  const POWER_CLASS_BY_ID = Object.freeze({
    "fire-serve":"power-fire-v11",
    "energized-set":"power-energy-v11",
    "lightning-cut":"power-lightning-v11"
  });

  function core() {
    return global.VoltzVolleyballPowerCoreV11 || null;
  }

  function stateCore() {
    return global.VoltzVolleyballCoreV10 || null;
  }

  function snapshot() {
    return core()?.getSnapshot?.() || null;
  }

  function isDynamicVolleyball() {
    const state = stateCore()?.getState?.();
    return Boolean(state?.type === "volleyball" && state?.dynamic);
  }

  function ensurePlayerVisual(playerEl, power) {
    if (!playerEl || !power) return null;
    let widget = playerEl.querySelector(".volleyball-player-power-v11");
    if (!widget) {
      const aura = document.createElement("i");
      aura.className = "volleyball-power-aura-v11";
      aura.setAttribute("aria-hidden", "true");
      playerEl.appendChild(aura);

      widget = document.createElement("div");
      widget.className = "volleyball-player-power-v11";
      widget.innerHTML = `
        <span class="volleyball-power-icon-v11"></span>
        <i class="volleyball-power-track-v11"><b></b></i>
        <em class="volleyball-power-readout-v11">0%</em>`;
      playerEl.appendChild(widget);
    }
    return widget;
  }

  function syncPlayerPowers(snap) {
    Object.entries(snap?.powers || {}).forEach(([playerId, power]) => {
      const playerEl = document.getElementById(`volleyballPlayer-${playerId}`);
      if (!playerEl) return;
      const widget = ensurePlayerVisual(playerEl, power);
      const fill = widget?.querySelector(".volleyball-power-track-v11 b");
      const icon = widget?.querySelector(".volleyball-power-icon-v11");
      const readout = widget?.querySelector(".volleyball-power-readout-v11");
      const armed = snap?.armed?.playerId === playerId && snap?.armed?.powerId === power.powerId;

      Object.values(POWER_CLASS_BY_ID).forEach((className) => playerEl.classList.remove(className));
      playerEl.classList.add(POWER_CLASS_BY_ID[power.powerId] || "");
      playerEl.classList.toggle("power-ready-v11", Boolean(power.ready));
      playerEl.classList.toggle("power-armed-v11", Boolean(armed));

      if (fill) fill.style.width = `${Math.max(0, Math.min(100, Number(power.charge || 0)))}%`;
      if (icon) icon.textContent = power.icon || "⚡";
      if (readout) readout.textContent = power.ready ? (armed ? "ARMADO" : "L") : `${Math.round(power.charge || 0)}%`;
      if (widget) {
        widget.title = `${power.name} · ${Math.round(power.charge || 0)}%`;
        widget.classList.toggle("ready", Boolean(power.ready));
        widget.classList.toggle("armed", Boolean(armed));
      }
    });
  }

  function ensurePowerPrompt() {
    const court = document.getElementById("volleyballDynamicCourt");
    const active = court?.querySelector(".volleyball-dynamic-player.team-voltz.is-active") || null;
    document.querySelectorAll(".volleyball-power-prompt-v11").forEach((node) => {
      if (node.parentElement !== active) node.remove();
    });
    if (!active) return null;

    let prompt = active.querySelector(".volleyball-power-prompt-v11");
    if (!prompt) {
      prompt = document.createElement("em");
      prompt.className = "volleyball-power-prompt-v11";
      active.appendChild(prompt);
    }
    return { prompt, active };
  }

  function syncPowerPrompt(snap) {
    const target = ensurePowerPrompt();
    if (!target) return;
    const { prompt, active } = target;
    const playerId = active.dataset.id || snap?.activePlayerId || "";
    const power = snap?.powers?.[playerId];
    const armed = snap?.armed?.playerId === playerId && snap?.armed?.powerId === power?.powerId;
    let text = "";

    if (power?.ready && armed) {
      if (power.powerId === "fire-serve") text = "🔥 ARMADO · K INCENDIAR";
      else if (power.powerId === "energized-set") text = "✨ ARMADO · K ENERGIZAR";
      else text = "⚡ ARMADO · J RELAMPAGO";
    } else if (power?.ready && snap?.activeUsable) {
      text = `L · ${power.icon} ${power.name.toUpperCase()}`;
    }

    prompt.textContent = text;
    prompt.classList.toggle("visible", Boolean(text));
    prompt.classList.toggle("armed", Boolean(armed));
  }

  function syncBallFx(snap, now) {
    const ball = document.getElementById("volleyballDynamicBall");
    const court = document.getElementById("volleyballDynamicCourt");
    if (!ball) return;
    const classes = ["power-ball-fire-v11", "power-ball-energy-v11", "power-ball-lightning-v11", "power-ball-lightning-charge-v11", "power-ball-lightning-miss-v11"];
    classes.forEach((className) => ball.classList.remove(className));
    court?.classList.remove("power-fx-fire-v11", "power-fx-energy-v11", "power-fx-lightning-v11");

    const fx = snap?.fx;
    if (!fx || now >= Number(fx.until || 0)) return;
    if (fx.type === "fire") {
      ball.classList.add("power-ball-fire-v11");
      court?.classList.add("power-fx-fire-v11");
    } else if (fx.type === "energy") {
      ball.classList.add("power-ball-energy-v11");
      court?.classList.add("power-fx-energy-v11");
    } else if (fx.type === "lightning") {
      ball.classList.add("power-ball-lightning-v11");
      court?.classList.add("power-fx-lightning-v11");
    } else if (fx.type === "lightning-charge") {
      ball.classList.add("power-ball-lightning-charge-v11");
      court?.classList.add("power-fx-lightning-v11");
    } else if (fx.type === "lightning-miss") {
      ball.classList.add("power-ball-lightning-miss-v11");
    }
  }

  function syncHudHelp() {
    const strip = document.querySelector(".volleyball-control-strip");
    if (strip && !strip.querySelector("[data-volleyball-power-control='1']")) {
      const span = document.createElement("span");
      span.dataset.volleyballPowerControl = "1";
      span.innerHTML = "<b>L</b> PODER";
      const touches = strip.querySelector("span:last-child");
      if (touches) strip.insertBefore(span, touches);
      else strip.appendChild(span);
    }

    const help = document.querySelector(".volleyball-dynamic-hud .sports-help");
    if (help && help.dataset.powersV11 !== "1") {
      help.dataset.powersV11 = "1";
      help.textContent = "K constroi, J finaliza e L arma o poder exclusivo do jogador ativo quando a aura estiver acesa. Cada toque carrega principalmente quem participou da jogada.";
    }
  }

  function syncMobileActions() {
    const root = document.getElementById("voltzMobileControls");
    const actions = document.getElementById("voltzMobileActions");
    if (!root || !actions || root.dataset.context !== "volleyball") return;
    if (actions.querySelector("[data-key='l']")) return;

    const close = actions.querySelector("[data-key='escape']");
    const button = document.createElement("button");
    button.className = "mobile-action volleyball-power-mobile-v11";
    button.dataset.key = "l";
    button.innerHTML = "<b>L</b><span>PODER</span>";
    if (close) actions.insertBefore(button, close);
    else actions.appendChild(button);
  }

  function activatePower() {
    const result = core()?.activate?.();
    return result || { ok:false };
  }

  document.addEventListener("keydown", (event) => {
    if (!isDynamicVolleyball()) return;
    const key = String(event.key || "").toLowerCase();
    if (key !== "l") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;
    activatePower();
  }, true);

  global.addEventListener("blur", () => {});

  let last = 0;
  function frame(now) {
    if (now - last < 33) {
      requestAnimationFrame(frame);
      return;
    }
    last = now;
    if (!isDynamicVolleyball()) {
      requestAnimationFrame(frame);
      return;
    }
    const snap = snapshot();
    if (snap) {
      syncPlayerPowers(snap);
      syncPowerPrompt(snap);
      syncBallFx(snap, now);
    }
    syncHudHelp();
    syncMobileActions();
    requestAnimationFrame(frame);
  }

  global.VoltzVolleyballPowersV11 = Object.freeze({
    version:"1.1",
    activate:activatePower,
    getSnapshot:snapshot,
    devChargeAll:() => core()?.devChargeAll?.() || false
  });

  requestAnimationFrame(frame);
})(window);
